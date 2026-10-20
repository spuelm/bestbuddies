for ($i = 1; $i -le 10; $i++) {
    Write-Host "Durchlauf $i von 10 startet..."

    node .\scripts\02_get-humans_with_data.js

    Write-Host "ExitCode: $LASTEXITCODE"

    if ($i -lt 10) {
        Start-Sleep -Seconds 10
    }
}

Write-Host "Alle 10 Durchläufe abgeschlossen."