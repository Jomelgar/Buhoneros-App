# PHP ZPL utilities (no framework)

This folder contains a tiny PHP 8+ HTTP endpoint and CLI scripts to:
- Receive `invoiceData` (JSON)
- Validate + sanitize fields
- Generate ZPL for a 4" Zebra printer (default width 812 dots @ 203dpi)
- Optionally send ZPL over TCP/IP (port 9100)

## Run the HTTP endpoint

From the repo root:

```bash
php -S 127.0.0.1:8080 -t php php/index.php
```

Then POST to:

- `POST http://127.0.0.1:8080/invoice/zpl`

## Run the TCP/IP print script

```bash
php php/print_invoice.php --ip=192.168.1.50 --port=9100 --file=php/example_invoice.json
```

(Or pipe JSON via stdin)

```bash
cat php/example_invoice.json | php php/print_invoice.php --ip=192.168.1.50
```
