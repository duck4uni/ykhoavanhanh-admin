# ==========================================
# Author:         DevOps Team
# Email:          infrashteam@meu-solutions.com
# Phone:          +84 0000000
# -----------------------------------
# Created:        2026-08-06
# LastEditTime:   2026-08-06
# Version:        1.0
# Status:         Created
# ==========================================

export project_name="vh-hospital-frontend"
export image_name="registry.gitlab.com/meu-solutions/vh-hospital-frontend"
export environment_name="production"

export port_mapping_app="8000"
export docker_network="meu-solutions-staging"

export mount_data_folder="/mnt/data"
export env_file="/home/gitlab-runner/vh-hospital/fe/.env"

export PROJECT_NAME="$project_name"
export ENVIRONMENT_NAME="$environment_name"

export PORT_APP="$port_mapping_app"
export DOCKER_NETWORK="$docker_network"

export MOUNT_DATA_FOLDER="$mount_data_folder"
export ENV_FILE="$env_file"
