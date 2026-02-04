<?php

declare(strict_types=1);

require_once __DIR__ . '/InvoiceValidator.php';
require_once __DIR__ . '/ZplRenderer.php';
require_once __DIR__ . '/ZebraTcp.php';

function usage(): void {
    $msg = <<<TXT
Usage:
  php php/print_invoice.php --ip=PRINTER_IP [--port=9100] [--width=812] (--file=path.json | < stdin)

Examples:
  php php/print_invoice.php --ip=192.168.1.50 --port=9100 --file=php/example_invoice.json
  cat php/example_invoice.json | php php/print_invoice.php --ip=192.168.1.50
TXT;
    fwrite(STDERR, $msg . "\n");
}

$options = getopt('', ['ip:', 'port::', 'width::', 'file::', 'timeout::']);
$ip = $options['ip'] ?? '';
if ($ip === '') {
    usage();
    exit(2);
}

$port = isset($options['port']) ? (int)$options['port'] : 9100;
$width = isset($options['width']) ? (int)$options['width'] : 812;
$timeout = isset($options['timeout']) ? (float)$options['timeout'] : 5.0;

$json = '';
if (isset($options['file'])) {
    $json = file_get_contents((string)$options['file']) ?: '';
} else {
    $json = stream_get_contents(STDIN) ?: '';
}

if (trim($json) === '') {
    fwrite(STDERR, "No JSON provided. Use --file or pipe stdin.\n");
    exit(2);
}

$data = json_decode($json, true);
if (!is_array($data)) {
    fwrite(STDERR, "Invalid JSON.\n");
    exit(2);
}

$validation = InvoiceValidator::validate($data);
if (!$validation['ok']) {
    fwrite(STDERR, "Validation failed:\n");
    foreach ($validation['errors'] as $e) {
        fwrite(STDERR, "- {$e}\n");
    }
    exit(2);
}

$zpl = ZplRenderer::renderInvoiceToZpl($validation['invoice'], $width);

try {
    ZebraTcp::sendZplToZebra($ip, $port, $zpl, $timeout);
    fwrite(STDOUT, "OK\n");
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "ERROR: {$e->getMessage()}\n");
    exit(1);
}
