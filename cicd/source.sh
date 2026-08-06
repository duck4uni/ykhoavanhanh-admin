#!/usr/bin/env bash

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

echo "=== Verifying Docker availability ==="
docker version

echo "=== Gathering traceability information ==="
GIT_COMMIT_SHA="${CI_COMMIT_SHA:-$(git rev-parse HEAD)}"
APP_VERSION="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}"
IMAGE_TAG="${environment_name}"
CI_PIPELINE_ID="${CI_PIPELINE_ID:-}"
CI_JOB_URL="${CI_JOB_URL:-}"

echo "=== Gathering timing information ==="
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DEPLOY_TIME=""

echo "=== Gathering artifact identity ==="
IMAGE_REF="${image_name}:${IMAGE_TAG}"

echo "=== Gathering environment context ==="
CI_COMMIT_REF_NAME="${CI_COMMIT_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
CI_COMMIT_MESSAGE="${CI_COMMIT_MESSAGE:-$(git log -1 --pretty=%s)}"
CI_COMMIT_MESSAGE="${CI_COMMIT_MESSAGE//$'\n'/ }"
CI_PROJECT_URL="${CI_PROJECT_URL:-}"

echo "=== Gathering security & compliance information ==="
GITLAB_USER_LOGIN="${GITLAB_USER_LOGIN:-}"

echo "=== Generating release metadata ==="
cat > cicd-release.env <<EOF
# Traceability
GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
APP_VERSION=${APP_VERSION}
IMAGE_TAG=${IMAGE_TAG}
CI_PIPELINE_ID=${CI_PIPELINE_ID}
CI_JOB_URL=${CI_JOB_URL}

# Timing
BUILD_TIME=${BUILD_TIME}
DEPLOY_TIME=${DEPLOY_TIME}

# Artifact Identity
IMAGE_REF=${IMAGE_REF}

# Environment Context
CI_COMMIT_REF_NAME=${CI_COMMIT_REF_NAME}
CI_COMMIT_MESSAGE="${CI_COMMIT_MESSAGE}"
CI_PROJECT_URL=${CI_PROJECT_URL}

# Security & Compliance
GITLAB_USER_LOGIN=${GITLAB_USER_LOGIN}
EOF

echo "Release metadata:"
cat cicd-release.env