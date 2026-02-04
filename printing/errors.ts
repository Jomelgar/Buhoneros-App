export type PrinterErrorCode =
  | 'UNSUPPORTED_PLATFORM'
  | 'BLUETOOTH_UNAVAILABLE'
  | 'BLUETOOTH_DISABLED'
  | 'BLUETOOTH_ERROR'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_TIMEOUT'
  | 'DEVICE_NOT_FOUND'
  | 'CONNECTION_FAILED'
  | 'NOT_CONNECTED'
  | 'WRITE_FAILED'
  | 'TEMPLATE_MISSING'
  | 'PRINTER_INCOMPATIBLE';

export class PrinterError extends Error {
  readonly code: PrinterErrorCode;
  readonly cause?: unknown;

  constructor(code: PrinterErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PrinterError';
    this.code = code;
    this.cause = cause;
  }
}
