#!/usr/bin/env bash
# deploy_frontend.sh
# ------------------
# Builds the React frontend and deploys it to S3 + invalidates CloudFront.
#
# Usage:
#   bash scripts/deploy_frontend.sh
#
# Prerequisites:
#   - AWS CLI configured
#   - SAM stack already deployed (so the S3 bucket and CloudFront exist)
#   - Node.js 18+ installed

set -euo pipefail

REGION="eu-central-1"
STACK_NAME="connected-arena"

echo "── Fetching stack outputs ──────────────────────────────────────"
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

CF_DIST=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendURL'].OutputValue" \
  --output text)

CF_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(DomainName, '$(echo $CF_DIST | sed s/https:\\/\\///)')].[Id]" \
  --output text)

WS_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketURL'].OutputValue" \
  --output text)

echo "  Bucket:       $BUCKET"
echo "  CloudFront:   $CF_DIST"
echo "  WebSocket:    $WS_URL"

echo ""
echo "── Writing .env ────────────────────────────────────────────────"
echo "REACT_APP_WS_URL=$WS_URL" > frontend/.env
echo "  Written frontend/.env"

echo ""
echo "── Building React app ──────────────────────────────────────────"
cd frontend
npm ci --silent
npm run build
cd ..

echo ""
echo "── Syncing to S3 ───────────────────────────────────────────────"
aws s3 sync frontend/build "s3://$BUCKET" \
  --region "$REGION" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# index.html must not be cached so deploys take effect immediately
aws s3 cp frontend/build/index.html "s3://$BUCKET/index.html" \
  --region "$REGION" \
  --cache-control "no-cache,no-store,must-revalidate"

echo ""
echo "── Invalidating CloudFront cache ───────────────────────────────"
aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  --output text

echo ""
echo "✅ Frontend deployed!"
echo "   $CF_DIST"
