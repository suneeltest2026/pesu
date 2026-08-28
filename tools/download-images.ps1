# PESU - download the product photography off the Shopify CDN.
# Run this BEFORE the Shopify store closes. Creates .\pesu-images\
# Usage: right-click this file -> Run with PowerShell
#   (if blocked: powershell -ExecutionPolicy Bypass -File download-images.ps1)
$base = "https://cdn.shopify.com/s/files/1/0769/8962/8589/files/"
$files = @(
  "IMG-8088.png",
  "IMG-8060.jpg",
  "IMG-8061.jpg",
  "IMG-8062.jpg",
  "IMG-8063.jpg",
  "IMG-8059.png",
  "IMG-8058.png",
  "IMG-8057.png",
  "IMG-8056.png",
  "IMG-8055.png",
  "IMG-8054.png",
  "IMG-8053.png",
  "IMG-8052.jpg",
  "IMG-8051.jpg",
  "IMG-8050.png",
  "IMG-8049.png",
  "kTcMELfR_C31DFRVVG2_2025-03-19_4.webp",
  "kTcMELfR_8ZNGJOKFMI_2025-03-19_3.webp",
  "kTcMELfR_ICMVLCFBU5_2025-03-19_2.webp",
  "kTcMELfR_LOV9P61VHQ_2025-03-19_1.webp",
  "HR6010134010200_1.jpg",
  "6010134010200_2.jpg",
  "6010134010200_3.jpg",
  "IMG-7931.jpg",
  "IMG-7932.jpg",
  "IMG-7933.jpg"
)
New-Item -ItemType Directory -Force -Path "pesu-images" | Out-Null
$ok = 0; $fail = 0
foreach ($f in $files) {
  try {
    Invoke-WebRequest -Uri ($base + $f) -OutFile ("pesu-images\" + $f) -UseBasicParsing
    Write-Host ("  saved " + $f); $ok++
  } catch {
    Write-Host ("  FAILED " + $f) -ForegroundColor Red; $fail++
  }
}
Write-Host ""
Write-Host ("$ok saved, $fail failed, in .\pesu-images")
Write-Host "Upload the contents to GitHub: suneeltest2026/pesu -> public/images"
Read-Host "Press Enter to close"
