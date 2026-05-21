#! /bin/bash

ng build --configuration development

BUCKET_NAME="f2-platform-a70c32f0-3290-11f1-8723-02dcccd10d3b-stage"
BUCKET_FOLDER="/cx-channels/f2-stage-channel"
PROFILE_NAME="f2-stage"
DISTRIBUTION_ID="E1NEF5FPOXC2LJ"
BUILD_FOLDER="new-engine-widget/browser"

aws configure set s3.multipart_threshold 128MB --profile ${PROFILE_NAME}
aws s3 rm s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --profile ${PROFILE_NAME}
aws s3 cp dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*.js" --exclude "*.json"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/javascript dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*" --include "*.js"  --profile ${PROFILE_NAME}
aws s3 cp --content-type application/json dist/${BUILD_FOLDER} s3://${BUCKET_NAME}${BUCKET_FOLDER} --recursive --metadata-directive REPLACE --exclude "*" --include "*.json"  --profile ${PROFILE_NAME}
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths '/*' --profile ${PROFILE_NAME}
