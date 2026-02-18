$output = npx tsx test_exact_error.ts 2>&1 | Out-String
$output | Out-File -Encoding UTF8 -FilePath "debug_output.txt"
Write-Host $output
