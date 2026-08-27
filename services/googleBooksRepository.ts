export type GoogleBookCandidate = {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  totalPages?: number;
  coverUrl?: string;
  description?: string;
  isbn?: string;
};

function firstString(values: unknown) {
  return Array.isArray(values) && typeof values[0] === 'string' ? values[0] : '';
}

function firstIsbn(values: unknown) {
  if (!Array.isArray(values)) return undefined;
  const item = values.find((value) => value && typeof value === 'object') as Record<string, unknown> | undefined;
  return typeof item?.identifier === 'string' ? item.identifier : undefined;
}

function normalizeCoverUrl(value: unknown) {
  return typeof value === 'string' && value ? value.replace('http://', 'https://') : undefined;
}

const searchCache = new Map<string, GoogleBookCandidate[]>();

export const googleBooksRepository = {
  async search(query: string): Promise<GoogleBookCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const cacheKey = trimmed.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ q: trimmed, maxResults: '5' });
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY?.trim()
      || process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
    if (apiKey) params.set('key', apiKey);

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const body = await response.text();
    if (!response.ok) {
      console.error('Google Books error body:', body.slice(0, 500));
      throw new Error(`GOOGLE_BOOKS_${response.status}`);
    }

    const data = JSON.parse(body) as { items?: Array<{ volumeInfo?: Record<string, unknown> }> };
    const books = (data.items ?? []).map((item) => {
      const volume = item.volumeInfo ?? {};
      const imageLinks = volume.imageLinks && typeof volume.imageLinks === 'object'
        ? volume.imageLinks as Record<string, unknown>
        : {};
      return {
        title: typeof volume.title === 'string' ? volume.title : '',
        author: firstString(volume.authors),
        publisher: typeof volume.publisher === 'string' ? volume.publisher : undefined,
        publishedDate: typeof volume.publishedDate === 'string' ? volume.publishedDate : undefined,
        totalPages: typeof volume.pageCount === 'number' && volume.pageCount > 0 ? volume.pageCount : undefined,
        coverUrl: normalizeCoverUrl(imageLinks.thumbnail ?? imageLinks.smallThumbnail),
        description: typeof volume.description === 'string' ? volume.description : undefined,
        isbn: firstIsbn(volume.industryIdentifiers),
      };
    }).filter((book) => book.title);

    searchCache.set(cacheKey, books);
    return books;
  },
};
