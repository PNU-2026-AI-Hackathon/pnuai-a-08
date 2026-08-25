const GEMINI_OCR_MODEL = process.env.EXPO_PUBLIC_GEMINI_OCR_MODEL
  ?? process.env.EXPO_PUBLIC_GEMINI_MODEL
  ?? 'gemini-3.6-flash';
const GENERATE_CONTENT_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_OCR_MODEL}:generateContent`;

type GenerateContentResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function scoreTitleCandidate(text: string) {
  let score = 0;
  if (text.length >= 2 && text.length <= 18) score += 4;
  if (/[\uAC00-\uD7A3]/.test(text)) score += 3;
  if (/\d/.test(text)) score -= 1;
  if (/\uCD9C\uD310|\uC9C0\uC740\uC774|\uC62E\uAE40|ISBN|\uAC00\uACA9|\uC6D0$/.test(text)) score -= 4;
  const meaningful = text.replace(/[^0-9A-Za-z\uAC00-\uD7A3]/g, '').length;
  if (meaningful < text.length / 2) score -= 2;
  return score;
}

function normalizeLine(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function extractText(response: GenerateContentResponse) {
  return (response.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join('\n');
}

function parseJsonArray(text: string): string[] {
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function fallbackLines(text: string) {
  return text
    .split(/\r?\n|[,，]/)
    .map((line) => line.replace(/^[-*\d.\s"']+/, '').replace(/["']+$/, ''))
    .map(normalizeLine);
}

function uniqueTitleCandidates(values: string[]) {
  return [...new Set(values.map(normalizeLine))]
    .filter((line) => line.length >= 2 && line.length <= 40)
    .sort((first, second) => {
      const scoreGap = scoreTitleCandidate(second) - scoreTitleCandidate(first);
      return scoreGap !== 0 ? scoreGap : second.length - first.length;
    })
    .slice(0, 12);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('IMAGE_BASE64_CONVERSION_FAILED'));
    };
    reader.onerror = () => reject(new Error('IMAGE_BASE64_CONVERSION_FAILED'));
    reader.readAsDataURL(blob);
  });
}

async function imageUriToInlineData(imageUri: string) {
  const response = await fetch(imageUri);
  if (!response.ok) throw new Error('OCR_IMAGE_READ_FAILED');
  const blob = await response.blob();

  try {
    const dataUrl = await blobToDataUrl(blob);
    const [, metadata = '', base64 = ''] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) ?? [];
    if (!base64) throw new Error('OCR_IMAGE_BASE64_EMPTY');
    return {
      mimeType: metadata || blob.type || 'image/jpeg',
      data: base64,
    };
  } finally {
    (blob as Blob & { close?: () => void }).close?.();
  }
}

async function extractTitleCandidatesWithGemini(imageUri: string) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING');

  const inlineData = await imageUriToInlineData(imageUri);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(GENERATE_CONTENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: [
                  '이 이미지는 책 표지 사진입니다.',
                  '표지에서 실제 책 제목으로 보이는 후보만 한국어/원문 그대로 추출하세요.',
                  '저자명, 출판사, ISBN, 가격, 홍보 문구, 부제처럼 보이는 문장은 제외하세요.',
                  '확신이 낮아도 가능한 제목 후보를 최대 8개까지 JSON 문자열 배열로만 답하세요.',
                  '예: ["아몬드", "파과"]',
                ].join(' '),
              },
              { inlineData },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as GenerateContentResponse;
    if (!response.ok) {
      const apiMessage = data.error?.message?.replaceAll('\n', ' ').slice(0, 240);
      throw new Error(`GEMINI_OCR_HTTP_${response.status}${apiMessage ? `:${apiMessage}` : ''}`);
    }

    const text = extractText(data);
    if (!text) {
      const reason = data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason;
      throw new Error(`GEMINI_OCR_EMPTY_RESPONSE${reason ? `:${reason}` : ''}`);
    }

    const jsonCandidates = parseJsonArray(text);
    return uniqueTitleCandidates(jsonCandidates.length ? jsonCandidates : fallbackLines(text));
  } finally {
    clearTimeout(timeoutId);
  }
}

export const bookOcrService = {
  async extractTitleCandidates(imageUri: string): Promise<string[]> {
    return extractTitleCandidatesWithGemini(imageUri);
  },
};
