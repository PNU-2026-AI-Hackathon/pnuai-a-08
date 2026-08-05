import { Book } from '@/models/Book';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GENERATE_CONTENT_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type InteractionTextContent = {
  type?: string;
  text?: string;
};

type InteractionStep = {
  type?: string;
  content?: InteractionTextContent[];
};

type InteractionResponse = {
  id?: string;
  steps?: InteractionStep[];
};

export type GeminiTurnResult = {
  text: string;
  interactionId?: string;
};

export type GeminiHistoryTurn = {
  role: 'user' | 'model';
  text: string;
};

function getSystemInstruction(book: Book) {
  return [
    '너는 서로서가 앱의 한국어 독서 대화 도우미다.',
    `현재 대화 중인 책은 「${book.title.replace('\n', ' ')}」이고 저자는 ${book.author}다.`,
    '사용자가 요청하지 않으면 중요한 결말과 반전을 먼저 밝히지 않는다.',
    '책에 없는 문장이나 사실을 지어내지 말고, 불확실하면 불확실하다고 말한다.',
    '답변은 친근하고 이해하기 쉬운 한국어로 작성한다.',
  ].join(' ');
}

function extractModelText(response: InteractionResponse) {
  return (response.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === 'text' && content.text)
    .map((content) => content.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join('\n\n');
}

export async function askGeminiAboutBook({
  book,
  message,
  previousInteractionId,
  history = [],
}: {
  book: Book;
  message: string;
  previousInteractionId?: string;
  history?: GeminiHistoryTurn[];
}): Promise<GeminiTurnResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: message,
        system_instruction: getSystemInstruction(book),
        ...(previousInteractionId
          ? { previous_interaction_id: previousInteractionId }
          : {}),
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = (await response.json()) as InteractionResponse;
      const text = extractModelText(data);

      if (data.id && text) {
        return { text, interactionId: data.id };
      }
    }

    // 일부 Expo/React Native 환경에서 beta Interactions 응답을 처리하지 못하면
    // 동일한 Gemini 모델의 generateContent API로 대화 이력을 포함해 재시도합니다.
    const fallbackResponse = await fetch(GENERATE_CONTENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: getSystemInstruction(book) }] },
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

    if (!fallbackResponse.ok) {
      throw new Error(`GEMINI_HTTP_${fallbackResponse.status}`);
    }

    const fallbackData = (await fallbackResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const fallbackText = (fallbackData.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text?.trim())
      .filter((text): text is string => Boolean(text))
      .join('\n\n');

    if (!fallbackText) {
      throw new Error('GEMINI_EMPTY_RESPONSE');
    }

    return { text: fallbackText };
  } finally {
    clearTimeout(timeoutId);
  }
}
