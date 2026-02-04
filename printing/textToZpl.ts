export type TextToZplOptions = {
  /** Label width in dots. 4" @203dpi ≈ 812 */
  widthDots?: number;
  /** Left/right margin in dots */
  marginDots?: number;
  /** Font height in dots for ^A0 */
  fontHeight?: number;
  /** Font width in dots for ^A0 */
  fontWidth?: number;
  /** Extra space between lines in dots */
  lineGap?: number;
  /** Top offset in dots */
  topDots?: number;
  /** If true, emit ^CI28 (UTF-8). Default false for safety. */
  useUnicode?: boolean;
};

function sanitizeText(input: string): string {
  if (!input) return '';
  // Normalize newlines
  let s = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Remove control chars except \n and \t
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return s;
}

function escapeForZplField(text: string): string {
  // Prevent ZPL control characters in user content
  return text.replace(/[\^~]/g, ' ');
}

function expandTabs(line: string, tabSize = 4): string {
  if (!line.includes('\t')) return line;
  return line.replace(/\t/g, ' '.repeat(tabSize));
}

function splitChars(s: string): string[] {
  // Unicode-safe split (handles surrogate pairs)
  return Array.from(s);
}

function sliceChars(chars: string[], start: number, end: number): string {
  return chars.slice(start, end).join('');
}

export function textToZpl(text: string, options: TextToZplOptions = {}): string {
  const widthDots = options.widthDots ?? 812;
  const marginDots = options.marginDots ?? 30;
  const fontHeight = options.fontHeight ?? 28;
  const fontWidth = options.fontWidth ?? 28;
  const lineGap = options.lineGap ?? 7;
  const topDots = options.topDots ?? 20;
  const useUnicode = options.useUnicode ?? false;

  const sanitized = sanitizeText(text).trimEnd();
  if (!sanitized.trim()) {
    throw new Error('El texto está vacío.');
  }

  const printableWidth = Math.max(0, widthDots - 2 * marginDots);
  const maxChars = Math.max(1, Math.floor(printableWidth / Math.max(1, fontWidth)));

  // Split into logical lines then wrap into printable lines
  const rawLines = sanitized.split('\n');
  const outLines: string[] = [];

  for (const raw of rawLines) {
    const expanded = escapeForZplField(expandTabs(raw));

    // Keep empty line (prints blank)
    if (expanded.length === 0) {
      outLines.push('');
      continue;
    }

    const chars = splitChars(expanded);
    for (let i = 0; i < chars.length; i += maxChars) {
      outLines.push(sliceChars(chars, i, i + maxChars));
    }
  }

  const lineStep = fontHeight + lineGap;
  const labelHeight = topDots + outLines.length * lineStep + marginDots;

  const parts: string[] = [];
  parts.push('^XA');
  parts.push(`^PW${widthDots}`);
  parts.push(`^LL${labelHeight}`);
  parts.push('^LH0,0');
  if (useUnicode) {
    // UTF-8
    parts.push('^CI28');
  }

  // Print each line. We do per-line centering while respecting margin.
  // To adjust margins/fonts, tweak options: widthDots/marginDots/fontHeight/fontWidth.
  outLines.forEach((line, idx) => {
    const y = topDots + idx * lineStep;
    const lineLen = splitChars(line).length;
    const lineWidth = lineLen * fontWidth;
    const centeredX = marginDots + Math.floor((printableWidth - lineWidth) / 2);
    const x = Math.max(marginDots, centeredX);

    parts.push(`^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FD${line}^FS`);
  });

  parts.push('^XZ');
  return parts.join('\n') + '\n';
}
