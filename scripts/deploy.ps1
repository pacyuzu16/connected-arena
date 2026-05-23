# deploy.ps1
# ----------
# Full deploy: SAM stack (backend) + frontend to S3 + CloudFront invalidation
# Run from the connected-arena root folder in PowerShell.
#
# Usage:
#   cd C:\Users\Administrator\Desktop\y3\THINGS\AWS\connected-arena
#   .\scripts\deploy.ps1

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

# ── 1. SAM build + deploy (backend Lambda + infra) ────────────────────────────
Write-Host "`n[1/4] Building SAM stack..." -ForegroundColor Cyan
Set-Location "$ROOT\infrastructure"
sam build --parallel

Write-Host "`n[2/4] Deploying SAM stack..." -ForegroundColor Cyan
sam deploy `
  --stack-name connected-arena `
  --region eu-central-1 `
  --capabilities CAPABILITY_IAM `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset

# ── 2. Get stack outputs ──────────────────────────────────────────────────────
Write-Host "`n[3/4] Fetching stack outputs..." -ForegroundColor Cyan
$bucket = aws cloudformation describe-stacks `
  --stack-name connected-arena `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
  --output text
Write-Host "  Bucket: $bucket"

# Get CloudFront distribution ID from the known domain
$cfDomain = "d1706ex99mjina.cloudfront.net"
$distId = aws cloudfront list-distributions `
  --query "DistributionList.Items[?DomainName=='$cfDomain'].Id" `
  --output text
Write-Host "  CF Dist: $distId"

# ── 3. Sync frontend ─────────────────────────────────────────────────────────
Write-Host "`n[4/4] Syncing frontend to S3..." -ForegroundColor Cyan
aws s3 sync "$ROOT\frontend\out" "s3://$bucket" --delete
Write-Host "  Sync complete."

# ── 4. CloudFront invalidation ────────────────────────────────────────────────
Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor Cyan
aws cloudfront create-invalidation --distribution-id $distId --paths "/*"

Write-Host "`n✅ Deploy complete!" -ForegroundColor Green
Write-Host "   https://d1706ex99mjina.cloudfront.net"
