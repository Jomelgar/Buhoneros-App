<?php

declare(strict_types=1);

require_once __DIR__ . '/ZplSanitize.php';

final class ZplRenderer
{
    /**
     * Renders a simple 4" invoice ZPL (ZQ521 compatible).
     *
     * Default width: 812 dots (@203dpi).
     *
     * NOTE: If you have your own ZPL block/template, you can replace the template
     * below with yours and keep the placeholders.
     */
    public static function renderInvoiceToZpl(array $invoice, int $printWidthDots = 812): string
    {
        $printWidthDots = $printWidthDots > 0 ? $printWidthDots : 812;

        $business = $invoice['business'] ?? [];
        $customer = $invoice['customer'] ?? [];
        $totals = $invoice['totals'] ?? [];
        $items = is_array($invoice['items'] ?? null) ? $invoice['items'] : [];

        $businessName = ZplSanitize::truncate((string)($business['name'] ?? ''), 32);
        $addr = $business['addressLines'] ?? [];
        $addrLine = is_array($addr) ? implode(' | ', array_map(fn($l) => ZplSanitize::clean((string)$l), $addr)) : '';
        $phone = ZplSanitize::truncate((string)($business['phone'] ?? ''), 32);

        $customerName = ZplSanitize::truncate((string)($customer['name'] ?? ''), 32);
        $customerId = ZplSanitize::truncate((string)($customer['id'] ?? ''), 32);

        $invoiceNumber = ZplSanitize::truncate((string)($invoice['invoiceNumber'] ?? ''), 32);
        $issuedAt = ZplSanitize::truncate((string)($invoice['issuedAtISO'] ?? ''), 40);
        $currency = ZplSanitize::truncate((string)($invoice['currency'] ?? ''), 8);

        $subtotal = self::money((int)($totals['subtotalCents'] ?? 0), $currency);
        $tax = self::money((int)($totals['taxCents'] ?? 0), $currency);
        $discount = self::money((int)($totals['discountCents'] ?? 0), $currency);
        $total = self::money((int)($totals['totalCents'] ?? 0), $currency);

        $notes = ZplSanitize::truncate((string)($invoice['notes'] ?? ''), 80);
        $qrValue = ZplSanitize::clean((string)($invoice['qrValue'] ?? ''));

        $template = "^XA\n"
            . "^PW812\n"
            . "^LL700\n"
            . "^LH0,0\n"
            . "^FO30,20^A0N,50,50^FD{{TITLE}}^FS\n"
            . "^FO30,80^A0N,28,28^FDFolio: {{INVOICE_NUMBER}}^FS\n"
            . "^FO450,80^A0N,28,28^FDFecha: {{DATE_YYYY_MM_DD}}^FS\n"
            . "^FO30,120^A0N,28,28^FDEmpresa: {{BUSINESS_NAME}}^FS\n"
            . "^FO30,155^A0N,28,28^FDCliente: {{CUSTOMER_NAME}}^FS\n"
            . "^FO30,195^GB750,3,3^FS\n"
            . "^FO30,215^A0N,28,28^FDDesc^FS\n"
            . "^FO520,215^A0N,28,28^FDQty^FS\n"
            . "^FO620,215^A0N,28,28^FDPrecio^FS\n"
            . "^FO720,215^A0N,28,28^FDSub^FS\n"
            . "{{ITEMS_ZPL}}\n"
            . "^FO30,360^GB750,3,3^FS\n"
            . "^FO500,385^A0N,28,28^FDSubtotal:^FS\n"
            . "^FO680,385^A0N,28,28^FD{{SUBTOTAL}}^FS\n"
            . "^FO500,420^A0N,28,28^FDIVA:^FS\n"
            . "^FO700,420^A0N,28,28^FD{{TAX}}^FS\n"
            . "^FO500,460^A0N,35,35^FDTotal:^FS\n"
            . "^FO660,460^A0N,35,35^FD{{TOTAL}}^FS\n"
            . "^FO30,520^A0N,28,28^FD{{NOTES}}^FS\n"
            . "^FO30,560^A0N,24,24^FDImpresion Zebra ZQ521 (ZPL)^FS\n"
            . "^XZ\n";

        $itemsZpl = self::renderItemsZpl($items, 28);

        $repl = [
            '{{TITLE}}' => 'Factura',
            '{{INVOICE_NUMBER}}' => $invoiceNumber,
            '{{DATE_YYYY_MM_DD}}' => self::dateYmd($issuedAtISO),
            '{{BUSINESS_NAME}}' => $businessName,
            '{{CUSTOMER_NAME}}' => $customerName,
            '{{SUBTOTAL}}' => self::moneyPlain((int)($totals['subtotalCents'] ?? 0)),
            '{{TAX}}' => self::moneyPlain((int)($totals['taxCents'] ?? 0)),
            '{{TOTAL}}' => self::moneyPlain((int)($totals['totalCents'] ?? 0)),
            '{{NOTES}}' => $notes !== '' ? ZplSanitize::truncate($notes, 40) : 'Gracias por su compra.',
            '{{ITEMS_ZPL}}' => $itemsZpl,
        ];

        $zpl = strtr($template, $repl);
        // Ensure print width override
        $zpl = preg_replace('/\^PW\d+/', '^PW' . $printWidthDots, $zpl) ?? $zpl;
        return $zpl;
    }

    /** @param array<int,mixed> $items */
    private static function renderItemsZpl(array $items, int $maxItemNameChars): string
    {
        $xDesc = 30;
        $xQty = 540;
        $xPrice = 610;
        $xSub = 710;
        $startY = 250;
        $rowHeight = 35;
        $maxRows = 3;

        $rows = array_slice($items, 0, $maxRows);
        $parts = [];

        for ($i = 0; $i < count($rows); $i++) {
            $it = $rows[$i];
            if (!is_array($it)) continue;

            $y = $startY + $i * $rowHeight;
            $name = ZplSanitize::truncate((string)($it['name'] ?? ''), $maxItemNameChars);
            $qty = ZplSanitize::truncate((string)($it['qty'] ?? ''), 6);
            $unit = (int)($it['unitPriceCents'] ?? 0);
            $price = self::moneyPlain($unit);
            $sub = self::moneyPlain(((int)($it['qty'] ?? 0)) * $unit);

            $parts[] = "^FO{$xDesc},{$y}^A0N,28,28^FD" . ZplSanitize::clean($name) . '^FS';
            $parts[] = "^FO{$xQty},{$y}^A0N,28,28^FD" . ZplSanitize::clean($qty) . '^FS';
            $parts[] = "^FO{$xPrice},{$y}^A0N,28,28^FD" . ZplSanitize::clean($price) . '^FS';
            $parts[] = "^FO{$xSub},{$y}^A0N,28,28^FD" . ZplSanitize::clean($sub) . '^FS';
        }

        if (count($items) > $maxRows) {
            $y = $startY + ($maxRows - 1) * $rowHeight;
            $remaining = count($items) - ($maxRows - 1);
            $msg = ZplSanitize::truncate('+' . $remaining . ' más...', $maxItemNameChars);
            // Replace last row
            $parts = array_slice($parts, 0, max(0, count($parts) - 4));
            $parts[] = "^FO{$xDesc},{$y}^A0N,28,28^FD" . ZplSanitize::clean($msg) . '^FS';
            $parts[] = "^FO{$xQty},{$y}^A0N,28,28^FD^FS";
            $parts[] = "^FO{$xPrice},{$y}^A0N,28,28^FD^FS";
            $parts[] = "^FO{$xSub},{$y}^A0N,28,28^FD^FS";
        }

        return implode("\n", $parts);
    }

    private static function moneyPlain(int $cents): string
    {
        return number_format(($cents ?? 0) / 100, 2, '.', '');
    }

    private static function dateYmd(string $iso): string
    {
        $t = strtotime($iso);
        if ($t === false) return ZplSanitize::truncate($iso, 40);
        return date('Y-m-d', $t);
    }
}
