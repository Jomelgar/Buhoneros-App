<?php

declare(strict_types=1);

require_once __DIR__ . '/InvoiceValidator.php';
require_once __DIR__ . '/ZplRenderer.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

function respond(int $status, string $body, string $contentType = 'text/plain; charset=utf-8'): void {
    http_response_code($status);
    header('Content-Type: ' . $contentType);
    echo $body;
    exit;
}

if ($path === '/health') {
    respond(200, "ok\n");
}

if ($path === '/invoice/zpl') {
    if ($method !== 'POST') {
        respond(405, "Method Not Allowed\n");
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        respond(400, "Empty body\n");
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, "Invalid JSON\n");
    }

    $width = 812;
    if (isset($_GET['width']) && is_numeric($_GET['width'])) {
        $width = (int)$_GET['width'];
    }

    $validation = InvoiceValidator::validate($data);
    if (!$validation['ok']) {
        respond(422, json_encode(['ok' => false, 'errors' => $validation['errors']], JSON_PRETTY_PRINT) . "\n", 'application/json; charset=utf-8');
    }

    $zpl = ZplRenderer::renderInvoiceToZpl($validation['invoice'], $width);
    respond(200, $zpl, 'text/plain; charset=utf-8');
}

respond(404, "Not Found\n");
