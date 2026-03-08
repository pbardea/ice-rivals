#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load secrets from .env.deploy if it exists (local usage)
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  source "$SCRIPT_DIR/.env.deploy"
  set +a
fi

# Expand ~ in SSH key path
HETZNER_SSH_KEY="${HETZNER_SSH_KEY/#\~/$HOME}"

: "${HETZNER_HOST:?Set HETZNER_HOST}"
: "${HETZNER_USER:?Set HETZNER_USER}"
: "${HETZNER_SSH_KEY:?Set HETZNER_SSH_KEY}"

SSH_OPTS="-i $HETZNER_SSH_KEY -o StrictHostKeyChecking=accept-new"
REMOTE="${HETZNER_USER}@${HETZNER_HOST}"

echo "==> Building server..."
cd "$SCRIPT_DIR"
npm run build --workspace=server

echo "==> Uploading build artifacts..."
ssh $SSH_OPTS "$REMOTE" "mkdir -p /tmp/ice-rivals-build/dist"
rsync -avz --delete -e "ssh $SSH_OPTS" \
  server/dist/ "$REMOTE:/tmp/ice-rivals-build/dist/"
rsync -avz -e "ssh $SSH_OPTS" \
  server/package.json server/Dockerfile \
  "$REMOTE:/tmp/ice-rivals-build/"

echo "==> Building Docker image and deploying to k8s..."
rsync -avz -e "ssh $SSH_OPTS" \
  k8s/ "$REMOTE:/tmp/ice-rivals-build/k8s/"

ssh $SSH_OPTS "$REMOTE" "
  set -euo pipefail
  cd /tmp/ice-rivals-build

  # Build Docker image using k3s's containerd
  # Use nerdctl if available, otherwise ctr
  if command -v nerdctl &>/dev/null; then
    nerdctl -n k8s.io build -t ice-rivals:latest .
  else
    # Build with docker if available, then import
    docker build -t ice-rivals:latest .
    docker save ice-rivals:latest | ctr -n k8s.io images import -
  fi

  # Apply k8s manifests
  kubectl apply -f k8s/namespace.yml
  kubectl apply -f k8s/service.yml
  kubectl apply -f k8s/ingress.yml
  kubectl apply -f k8s/deployment.yml

  # Restart the deployment to pick up new image
  kubectl rollout restart deployment/ice-rivals -n ice-rivals
  kubectl rollout status deployment/ice-rivals -n ice-rivals --timeout=60s

  echo 'Deployment complete!'
  kubectl get pods -n ice-rivals
"

echo "==> Done! Backend deploying at https://api.icerivals.com"
