#! /bin/bash

ng build --configuration development

BUCKET_NAME="f2-bucket-951bb7982507d4863117e86a91e510f8-dev"
BUCKET_FOLDER="/cx-channels/f2-dev-default"
PROFILE_NAME="f2-dev"
DISTRIBUTION_ID="EYXYMFPE1M15W"
BUILD_FOLDER="new-engine-widget/browser"

aws configure set s3.multipart_threshold 128MB --profile ${PROFILE_NAME}
aws s3 rm s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --profile ${PROFILE_NAME}
aws s3 cp dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*.js" --exclude "*.json"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/javascript dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*" --include "*.js"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/json dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*" --include "*.json"  --profile ${PROFILE_NAME}
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths '/*' --profile ${PROFILE_NAME}
