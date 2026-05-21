#! /bin/bash

ng build --configuration production

BUCKET_NAME="f2-core-7cb274965a4412e17f5a11a5f109e047-prod/chat-bot-widget"
PROFILE_NAME="f2-prod"
DISTRIBUTION_ID="E3UJ362360NM74"
BUILD_FOLDER="new-engine-widget/browser"

aws configure set s3.multipart_threshold 128MB --profile ${PROFILE_NAME}
aws s3 rm s3://${BUCKET_NAME} --recursive --profile ${PROFILE_NAME}
aws s3 cp dist/${BUILD_FOLDER} s3://${BUCKET_NAME} --recursive --metadata-directive REPLACE --exclude "*.js" --exclude "*.json"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/javascript dist/${BUILD_FOLDER} s3://${BUCKET_NAME} --recursive --metadata-directive REPLACE --exclude "*" --include "*.js"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/json dist/${BUILD_FOLDER} s3://${BUCKET_NAME} --recursive --metadata-directive REPLACE --exclude "*" --include "*.json"  --profile ${PROFILE_NAME}
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths '/*' --profile ${PROFILE_NAME}
