<?php

declare(strict_types=1);

final class InvoiceValidator
{
    /** @return array{ok:bool, errors:string[], invoice?:array} */
    public static function validate(array $data): array
    {
        $errors = [];

        $invoiceNumber = self::getString($data, 'invoiceNumber');
        if ($invoiceNumber === '') $errors[] = 'invoiceNumber is required';

        $issuedAtISO = self::getString($data, 'issuedAtISO');
        if ($issuedAtISO === '') $errors[] = 'issuedAtISO is required';

        $currency = self::getString($data, 'currency');
        if ($currency === '') $errors[] = 'currency is required';

        $business = self::getArray($data, 'business');
        if (!$business) {
            $errors[] = 'business is required';
        } else {
            $bn = self::getString($business, 'name');
            if ($bn === '') $errors[] = 'business.name is required';
        }

        $items = self::getArray($data, 'items');
        if (!is_array($items) || count($items) === 0) {
            $errors[] = 'items must be a non-empty array';
        } else {
            foreach ($items as $i => $item) {
                if (!is_array($item)) {
                    $errors[] = "items[$i] must be an object";
                    continue;
                }
                if (self::getString($item, 'name') === '') $errors[] = "items[$i].name is required";
                if (!isset($item['qty']) || !is_numeric($item['qty'])) $errors[] = "items[$i].qty must be numeric";
                if (!isset($item['unitPriceCents']) || !is_numeric($item['unitPriceCents'])) $errors[] = "items[$i].unitPriceCents must be numeric";
            }
        }

        $totals = self::getArray($data, 'totals');
        if (!$totals) {
            $errors[] = 'totals is required';
        } else {
            foreach (['subtotalCents', 'totalCents'] as $k) {
                if (!isset($totals[$k]) || !is_numeric($totals[$k])) $errors[] = "totals.$k must be numeric";
            }
            foreach (['taxCents', 'discountCents'] as $k) {
                if (isset($totals[$k]) && !is_numeric($totals[$k])) $errors[] = "totals.$k must be numeric";
            }
        }

        if (count($errors) > 0) {
            return ['ok' => false, 'errors' => $errors];
        }

        return ['ok' => true, 'errors' => [], 'invoice' => $data];
    }

    private static function getString(array $a, string $k): string
    {
        $v = $a[$k] ?? '';
        return is_string($v) ? trim($v) : '';
    }

    private static function getArray(array $a, string $k): ?array
    {
        $v = $a[$k] ?? null;
        return is_array($v) ? $v : null;
    }
}
