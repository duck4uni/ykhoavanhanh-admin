#!/bin/bash

# ==========================================
# Author:         Duong Nhat Khoa
# Email:          nhatkhoa.working@gmail.com
# Phone:          +84 828 505 090
# -----------------------------------
# Created:        2026-05-09
# LastEditTime:   2026-05-11
# Version:        1.0
# Status:         Updated
# ==========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/env-param.sh"

export APP_IMAGE="${IMAGE_REF}"

echo "=== Deploying ${IMAGE_REF} to ${environment_name} ==="

echo "--- Logging in to GitLab Container Registry ---"
docker logout registry.gitlab.com
echo "$CI_PERMISSION" | docker login registry.gitlab.com \
    -u "$REGISTRY_USER" --password-stdin

echo "--- Capturing current running image (for reference) ---"
PREVIOUS_IMAGE="$(
    docker compose ps -q app \
    | xargs -r docker inspect --format='{{.Config.Image}}' 2>/dev/null || true
)"
echo "Previous image: ${PREVIOUS_IMAGE:-<none running>}"

echo "--- Pulling new image ---"
docker compose pull app

echo "--- Starting new container ---"
docker compose up -d --remove-orphans app

echo "--- Container start command submitted ---"
docker compose ps app || true

echo "--- Cleaning up dangling images ---"
docker image prune -f || true

echo "=== Deployment successful: ${IMAGE_REF} ==="
