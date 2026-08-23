import { Book } from '@/models/Book';

const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-3.6-flash';
const GENERATE_CONTENT_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiTurnResult = {
  text: string;
  interactionId?: string;
};

export type GeminiHistoryTurn = {
  role: 'user' | 'model';
  text: string;
};

type GenerateContentResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function getSystemInstruction(book: Book) {
  return [
    '너는 서로서가 앱의 한국어 독서 대화 도우미다.',
    `현재 대화 중인 책은 「${book.title.replaceAll('\n', ' ')}」이고 저자는 ${book.author}다.`,
    book.description ? `참고할 소개는 다음과 같다: ${book.description}` : '',
    '사용자가 요청하지 않으면 중요한 결말과 반전을 먼저 밝히지 않는다.',
    '책에 없는 문장이나 사실을 지어내지 말고, 불확실하면 불확실하다고 말한다.',
    '답변은 친근하고 이해하기 쉬운 한국어로 작성한다.',
  ].filter(Boolean).join(' ');
}

function extractText(response: GenerateContentResponse) {
  return (response.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join('\n\n');
}

export async function askGeminiAboutBook({
  book,
  message,
  history = [],
}: {
  book: Book;
  message: string;
  previousInteractionId?: string;
  history?: GeminiHistoryTurn[];
}): Promise<GeminiTurnResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(GENERATE_CONTENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: getSystemInstruction(book) }],
        },
        contents: [
          ...history.map((turn) => ({
            role: turn.role,
            parts: [{ text: turn.text }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as GenerateContentResponse;

    if (!response.ok) {
      const apiMessage = data.error?.message?.replaceAll('\n', ' ').slice(0, 240);
      throw new Error(`GEMINI_HTTP_${response.status}${apiMessage ? `:${apiMessage}` : ''}`);
    }

    const text = extractText(data);
    if (!text) {
      const reason = data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason;
      throw new Error(`GEMINI_EMPTY_RESPONSE${reason ? `:${reason}` : ''}`);
    }

    return { text };
  } finally {
    clearTimeout(timeoutId);
  }
}
