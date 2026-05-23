#!/usr/bin/env python3
"""
upload_frontend.py
------------------
Upload frontend build to S3 and invalidate CloudFront
Requires AWS credentials to be configured
"""

import boto3
import os
from pathlib import Path

S3_BUCKET = "connected-arena-frontend"
DISTRIBUTION_ID = "E3FZFHQ0XYZ1AB"  # Replace with your CloudFront distribution ID
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "out"

def upload_to_s3():
    """Upload frontend build to S3"""
    s3 = boto3.client("s3")
    
    if not FRONTEND_BUILD_DIR.exists():
        print(f"❌ Build directory not found: {FRONTEND_BUILD_DIR}")
        return False
    
    print(f"📤 Uploading files from {FRONTEND_BUILD_DIR} to s3://{S3_BUCKET}")
    
    uploaded = 0
    for file_path in FRONTEND_BUILD_DIR.rglob("*"):
        if file_path.is_file():
            # Calculate S3 key (relative path)
            s3_key = str(file_path.relative_to(FRONTEND_BUILD_DIR)).replace("\\", "/")
            
            # Determine content type
            content_type = "text/html" if file_path.suffix == ".html" else "application/octet-stream"
            if file_path.suffix == ".js":
                content_type = "application/javascript"
            elif file_path.suffix == ".css":
                content_type = "text/css"
            elif file_path.suffix == ".json":
                content_type = "application/json"
            
            try:
                s3.upload_file(
                    str(file_path),
                    S3_BUCKET,
                    s3_key,
                    ExtraArgs={"ContentType": content_type}
                )
                print(f"  ✓ {s3_key}")
                uploaded += 1
            except Exception as e:
                print(f"  ✗ {s3_key}: {e}")
    
    print(f"\n✅ Uploaded {uploaded} files")
    return True

def invalidate_cloudfront():
    """Invalidate CloudFront cache"""
    cloudfront = boto3.client("cloudfront")
    
    try:
        response = cloudfront.create_invalidation(
            DistributionId=DISTRIBUTION_ID,
            InvalidationBatch={"Paths": {"Quantity": 1, "Items": ["/*"]}, "CallerReference": str(int(os.urandom(4).hex(), 16))}
        )
        print(f"✅ CloudFront invalidation created: {response['Invalidation']['Id']}")
        return True
    except Exception as e:
        print(f"❌ CloudFront invalidation failed: {e}")
        return False

if __name__ == "__main__":
    if upload_to_s3():
        invalidate_cloudfront()
