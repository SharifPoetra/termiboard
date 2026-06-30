const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function getRankBetween(prev: string | null, next: string | null): string {
  const p = prev || '0';
  const n = next || 'z';

  let result = '';
  let i = 0;

  while (true) {
    const pChar = p[i] || '0';
    const nChar = n[i] || 'z';

    const pVal = CHARS.indexOf(pChar);
    const nVal = CHARS.indexOf(nChar);

    // Calculate the midpoint value between the two characters
    const midVal = Math.floor((pVal + nVal) / 2);

    // Handle collision when no integer space is left between characters
    if (midVal === pVal) {
      result += pChar;
      i++;

      // If previous rank string ends, append a middle character to extend precision
      if (i >= p.length && CHARS.indexOf(nChar) - CHARS.indexOf('0') > 1) {
        result += CHARS[Math.floor(CHARS.length / 2)];
        break;
      }
      continue;
    }

    result += CHARS[midVal];
    break;
  }

  return result;
}
