<?php

declare(strict_types=1);

require_once __DIR__ . '/ZebraTcp.php';

$ip = '192.168.1.50';
$port = 9100;

$zpl = "^XA\n^PW812\n^FO20,20^A0N,40,40^FDZebra Test^FS\n^FO20,80^A0N,24,24^FDFactura: F-000123^FS\n^XZ\n";

try {
    $ok = ZebraTcp::sendZplToZebra($ip, $port, $zpl, 5.0);
    echo $ok ? "Sent\n" : "Failed\n";
} catch (Throwable $e) {
    echo "ERROR: {$e->getMessage()}\n";
}
