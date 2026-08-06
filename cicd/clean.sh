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

set -eu

checkimage="$(docker images -a | grep none || true)"
if [ -z "$checkimage" ]; then
  echo "No dangling images"
  exit 0
fi

for image_id in $(docker images -a | grep none | awk '{ print $3; }'); do
  used_container="$(docker ps -a --filter ancestor="$image_id" -q)"
  if [ -z "$used_container" ]; then
    echo "remove image $image_id"
    docker rmi "$image_id" || echo "skip image $image_id (rmi failed)"
  else
    echo "skip image $image_id (in use)"
  fi
done

exit 0
