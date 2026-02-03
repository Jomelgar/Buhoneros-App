$body = Get-Content -Raw -Path "php/example_invoice.json"
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8080/invoice/zpl?width=812" -ContentType "application/json" -Body $body |
  Out-File -Encoding ascii -FilePath "php/out.zpl"

Write-Host "Saved php/out.zpl"
