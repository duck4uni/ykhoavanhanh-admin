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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/env-param.sh"

if [ -f "$env_file" ]; then
    echo "=== Loading frontend build environment from ${env_file} ==="
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
else
    echo "ERROR: frontend env file not found: ${env_file}" >&2
    exit 1
fi

required_vars="NEXT_PUBLIC_API_URL NEXT_PUBLIC_KEY_BUFFER NEXT_PUBLIC_KEY_SECRET"
for var_name in $required_vars; do
    if [ -z "${!var_name:-}" ]; then
        echo "ERROR: required build variable is missing: ${var_name}" >&2
        exit 1
    fi
done

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
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
    --build-arg "NEXT_PUBLIC_KEY_BUFFER=${NEXT_PUBLIC_KEY_BUFFER}" \
    --build-arg "NEXT_PUBLIC_KEY_SECRET=${NEXT_PUBLIC_KEY_SECRET}" \
    -t "${IMAGE_REF}" \
    .

echo "=== Pushing image to registry ==="
docker push "${IMAGE_REF}"

echo "Docker image pushed successfully: ${IMAGE_REF}"
