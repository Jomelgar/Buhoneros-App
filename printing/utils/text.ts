export function truncate(text: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (text.length <= maxChars) return text;
  if (maxChars === 1) return text.slice(0, 1);
  return text.slice(0, maxChars - 1) + '…';
}

export function wrapText(text: string, maxChars: number): string[] {
  const cleaned = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [''];
  if (maxChars <= 0) return [''];

  const words = cleaned.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) lines.push(current);

    if (word.length <= maxChars) {
      current = word;
    } else {
      // Hard split very long words
      let rest = word;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      current = rest;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}
