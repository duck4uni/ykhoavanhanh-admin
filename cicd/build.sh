#!/bin/bash

# ==========================================
# Author:         Duong Nhat Khoa
# Email:          nhatkhoa.working@gmail.com
# Phone:          +84 828 505 090
# -----------------------------------
# Created:        2026-05-09
# LastEditTime:   2026-05-09
# Version:        1.0
# Status:         Updated
# ==========================================

set -euo pipefail

echo "=== Logging in to GitLab Container Registry ==="
docker logout registry.gitlab.com
echo "$CI_PERMISSION" | docker login registry.gitlab.com \
    -u "$REGISTRY_USER" --password-stdin

echo "=== Building Docker image: ${IMAGE_REF} ==="
docker build \
    --pull \
    --label "org.opencontainers.image.revision=${CI_COMMIT_SHA}" \
    --label "org.opencontainers.image.created=${BUILD_TIME}" \
    --label "org.opencontainers.image.source=${CI_PROJECT_URL}" \
    -t "${IMAGE_REF}" \
    .

echo "=== Pushing image to registry ==="
docker push "${IMAGE_REF}"

echo "Docker image pushed successfully: ${IMAGE_REF}"