import type { TextToZplOptions } from './textToZpl';
import { textToZpl } from './textToZpl';

/**
 * Generates ZPL from plain text and sends it RAW to a Zebra printer.
 *
 * - `sendRaw` must write the string/bytes as-is to the active connection.
 * - No base64, no images, no PDF.
 */
export async function printTextZebra(
  text: string,
  sendRaw: (data: string | Uint8Array) => Promise<void>,
  options?: TextToZplOptions
): Promise<void> {
  if (!text || !text.trim()) {
    throw new Error('El texto está vacío.');
  }

  const zpl = textToZpl(text, options);
  await sendRaw(zpl);
}
