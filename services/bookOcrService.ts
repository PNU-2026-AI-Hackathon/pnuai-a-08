import MlkitOcr from 'rn-mlkit-ocr';

type OcrDetector = 'korean' | 'latin';

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

async function recognizeLines(imageUri: string, detector: OcrDetector) {
  const result = await MlkitOcr.recognizeText(imageUri, detector);
  return result.blocks.flatMap((block) => block.lines.map((line) => normalizeLine(line.text)));
}

export const bookOcrService = {
  async extractTitleCandidates(imageUri: string): Promise<string[]> {
    const koreanLines = await recognizeLines(imageUri, 'korean');
    let latinLines: string[] = [];

    try {
      latinLines = await recognizeLines(imageUri, 'latin');
    } catch {
      latinLines = [];
    }

    const lines = [...koreanLines, ...latinLines];
    return [...new Set(lines)]
      .filter((line) => line.length >= 2)
      .sort((first, second) => {
        const scoreGap = scoreTitleCandidate(second) - scoreTitleCandidate(first);
        return scoreGap !== 0 ? scoreGap : second.length - first.length;
      })
      .slice(0, 12);
  },
};
