<?php

declare(strict_types=1);

final class ZebraTcp
{
    /**
     * Sends ZPL to a Zebra printer over TCP/IP (9100 by default).
     * Returns true on success.
     */
    public static function sendZplToZebra(string $ip, int $port, string $zpl, float $timeoutSeconds = 5.0): bool
    {
        $ip = trim($ip);
        if ($ip === '') {
            throw new InvalidArgumentException('IP is required');
        }
        if ($port <= 0 || $port > 65535) {
            throw new InvalidArgumentException('Invalid port');
        }

        $errno = 0;
        $errstr = '';
        $fp = @fsockopen($ip, $port, $errno, $errstr, $timeoutSeconds);
        if ($fp === false) {
            throw new RuntimeException("Connection failed: {$errstr} ({$errno})");
        }

        try {
            stream_set_timeout($fp, (int)ceil($timeoutSeconds));
            stream_set_blocking($fp, true);

            $bytes = fwrite($fp, $zpl);
            if ($bytes === false || $bytes === 0) {
                throw new RuntimeException('Write failed (0 bytes).');
            }

            fflush($fp);

            $meta = stream_get_meta_data($fp);
            if (!empty($meta['timed_out'])) {
                throw new RuntimeException('Write timed out.');
            }

            return true;
        } finally {
            fclose($fp);
        }
    }
}
