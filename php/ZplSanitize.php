<?php

declare(strict_types=1);

final class ZplSanitize
{
    public static function clean(string $s): string
    {
        // Remove non-printable (keep CR/LF/TAB)
        $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
        // Avoid ZPL control chars in user text
        $s = str_replace(['^', '~'], ' ', $s);
        // Normalize newlines
        $s = str_replace(["\r\n", "\r"], "\n", $s);
        return trim($s);
    }

    public static function truncate(string $s, int $max): string
    {
        $s = self::clean($s);
        if ($max <= 0) return '';
        if (mb_strlen($s) <= $max) return $s;
        if ($max === 1) return mb_substr($s, 0, 1);
        return mb_substr($s, 0, $max - 1) . '…';
    }

    /** @return string[] */
    public static function wrap(string $s, int $max): array
    {
        $s = self::clean($s);
        if ($s === '') return [''];
        if ($max <= 0) return [''];

        $s = preg_replace('/\s+/u', ' ', $s) ?? '';
        $words = explode(' ', trim($s));

        $lines = [];
        $current = '';
        foreach ($words as $w) {
            $next = $current === '' ? $w : ($current . ' ' . $w);
            if (mb_strlen($next) <= $max) {
                $current = $next;
                continue;
            }
            if ($current !== '') $lines[] = $current;
            if (mb_strlen($w) <= $max) {
                $current = $w;
            } else {
                // hard split very long words
                $rest = $w;
                while (mb_strlen($rest) > $max) {
                    $lines[] = mb_substr($rest, 0, $max);
                    $rest = mb_substr($rest, $max);
                }
                $current = $rest;
            }
        }
        if ($current !== '') $lines[] = $current;
        return count($lines) ? $lines : [''];
    }
}
