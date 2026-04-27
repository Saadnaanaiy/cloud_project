# ============================================================
# 🚀 Cloud Native Platform — Makefile
# ============================================================
# Quick reference for local development, Docker, K8s, and GCP
# ============================================================

.PHONY: help build up down logs backend-logs frontend-logs db-logs \
        tf-init tf-plan tf-apply tf-destroy \
        k8s-build k8s-namespace k8s-config k8s-deploy k8s-delete \
	k8s-status k8s-logs-backend k8s-logs-frontend k8s-logs-mysql k8s-restart \
	k8s-gke-edge k8s-deploy-gke k8s-deploy-gke-secure k8s-external-secrets-install k8s-external-secrets-apply \
        lint-backend lint-frontend test-backend scan-images

# ─── Default ───────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Docker Compose (Local Dev) ────────────────────────────
build: ## Build all Docker images
	docker-compose build

up: ## Start all services (detached)
	docker-compose up -d

down: ## Stop and remove all containers
	docker-compose down -v

logs: ## Tail all container logs
	docker-compose logs -f

backend-logs: ## Tail backend logs
	docker-compose logs -f backend

frontend-logs: ## Tail frontend logs
	docker-compose logs -f frontend

db-logs: ## Tail database logs
	docker-compose logs -f db

# ─── Lint & Test ───────────────────────────────────────────
lint-backend: ## Lint backend code
	cd backend && npm run lint

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

test-backend: ## Run backend unit tests
	cd backend && npm test

# ─── Security Scanning ─────────────────────────────────────
scan-backend: ## Scan backend image with Trivy
	docker build -t employee-platform/backend:latest ./backend
	trivy image employee-platform/backend:latest

scan-frontend: ## Scan frontend image with Trivy
	docker build -t employee-platform/frontend:latest ./frontend
	trivy image employee-platform/frontend:latest

scan-images: scan-backend scan-frontend ## Scan all images

# ─── Terraform ─────────────────────────────────────────────
tf-init: ## Initialize Terraform
	cd infrastructure && terraform init

tf-plan: ## Plan Terraform changes
	cd infrastructure && terraform plan -var-file="terraform.tfvars"

tf-apply: ## Apply Terraform changes
	cd infrastructure && terraform apply -var-file="terraform.tfvars"

tf-destroy: ## Destroy Terraform infrastructure
	cd infrastructure && terraform destroy -var-file="terraform.tfvars"

# ─── Docker Desktop Kubernetes ─────────────────────────────
k8s-build: ## Build Docker images for K8s (local)
	docker build -t employee-platform/backend:latest ./backend
	docker build -t employee-platform/frontend:latest \
	  --build-arg VITE_API_URL=http://localhost:30001 \
	  --build-arg VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI \
	  ./frontend

k8s-namespace: ## Create Kubernetes namespace
	kubectl apply -f k8s/00-namespace.yaml

k8s-config: ## Apply ConfigMap and Secret
	kubectl apply -f k8s/01-configmap.yaml
	kubectl apply -f k8s/02-secret.yaml

k8s-deploy: ## Deploy everything to K8s (full pipeline)
	@echo "🔨 Building Docker images..."
	$(MAKE) k8s-build
	@echo "📦 Creating namespace..."
	kubectl apply -f k8s/00-namespace.yaml
	@echo "⚙️  Applying config and secrets..."
	kubectl apply -f k8s/01-configmap.yaml
	kubectl apply -f k8s/02-secret.yaml
	@echo "🚀 Deploying services..."
	kubectl apply -f k8s/03-mysql.yaml
	kubectl apply -f k8s/04-backend.yaml
	kubectl apply -f k8s/05-frontend.yaml
	kubectl apply -f k8s/06-backend-nodeport.yaml
	kubectl apply -f k8s/07-hpa.yaml
	@echo ""
	@echo "✅ Deployed! Access the app:"
	@echo "   Frontend : http://localhost:30080"
	@echo "   Backend  : http://localhost:30001"
	@echo "   Swagger  : http://localhost:30001/api"

k8s-delete: ## Delete all Kubernetes resources
	kubectl delete -f k8s/ --ignore-not-found

k8s-status: ## Show K8s pod status
	kubectl get all -n employee-platform

k8s-logs-backend: ## Show backend pod logs
	kubectl logs -l app=backend -n employee-platform --tail=100 -f

k8s-logs-frontend: ## Show frontend pod logs
	kubectl logs -l app=frontend -n employee-platform --tail=100 -f

k8s-logs-mysql: ## Show MySQL pod logs
	kubectl logs -l app=mysql -n employee-platform --tail=100 -f

k8s-restart: ## Restart all deployments
	kubectl rollout restart deployment -n employee-platform

k8s-gke-edge: ## Apply GKE edge resources (CDN + cert + ingress)
	kubectl apply -f k8s/12-frontend-backendconfig.yaml
	kubectl apply -f k8s/10-managed-certificate.yaml
	kubectl apply -f k8s/11-ingress.yaml

k8s-deploy-gke: ## Deploy app to GKE (without local NodePort assumptions)
	kubectl apply -f k8s/00-namespace.yaml
	kubectl apply -f k8s/01-configmap.yaml
	kubectl apply -f k8s/02-secret.yaml
	kubectl apply -f k8s/03-mysql.yaml
	kubectl apply -f k8s/12-frontend-backendconfig.yaml
	kubectl apply -f k8s/04-backend.yaml
	kubectl apply -f k8s/05-frontend.yaml
	kubectl apply -f k8s/07-hpa.yaml
	kubectl apply -f k8s/09-network-policy.yaml
	kubectl apply -f k8s/10-managed-certificate.yaml
	kubectl apply -f k8s/11-ingress.yaml

k8s-external-secrets-install: ## Install External Secrets Operator on cluster
	helm repo add external-secrets https://charts.external-secrets.io
	helm repo update
	helm upgrade --install external-secrets external-secrets/external-secrets \
	  --namespace external-secrets --create-namespace

k8s-external-secrets-apply: ## Apply GCP Secret Manager integration manifests
	kubectl apply -f k8s/13-external-secrets-serviceaccount.yaml
	kubectl apply -f k8s/14-secretstore-gcp.yaml
	kubectl apply -f k8s/15-externalsecret-employee-platform.yaml

k8s-deploy-gke-secure: ## Deploy to GKE using External Secrets (no static Kubernetes Secret)
	kubectl apply -f k8s/00-namespace.yaml
	kubectl apply -f k8s/01-configmap.yaml
	$(MAKE) k8s-external-secrets-install
	kubectl apply -f k8s/13-external-secrets-serviceaccount.yaml
	kubectl apply -f k8s/14-secretstore-gcp.yaml
	kubectl apply -f k8s/15-externalsecret-employee-platform.yaml
	kubectl apply -f k8s/03-mysql.yaml
	kubectl apply -f k8s/12-frontend-backendconfig.yaml
	kubectl apply -f k8s/04-backend.yaml
	kubectl apply -f k8s/05-frontend.yaml
	kubectl apply -f k8s/07-hpa.yaml
	kubectl apply -f k8s/09-network-policy.yaml
	kubectl apply -f k8s/10-managed-certificate.yaml
	kubectl apply -f k8s/11-ingress.yaml

# ─── Monitoring (Helm) ─────────────────────────────────────
monitoring-install: ## Install Prometheus + Grafana stack
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo update
	helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
	  --namespace monitoring --create-namespace \
	  -f monitoring/values.yaml
	kubectl apply -f monitoring/grafana-dashboard.yaml
	@echo ""
	@echo "✅ Monitoring installed!"
	@echo "   Grafana : http://localhost:30300"
	@echo "   Login   : admin / admin123"

monitoring-uninstall: ## Uninstall monitoring stack
	helm uninstall monitoring -n monitoring
	kubectl delete namespace monitoring --ignore-not-found

monitoring-portforward: ## Port-forward Grafana locally (alternative)
	kubectl port-forward svc/monitoring-grafana 8080:80 -n monitoring

# ─── Ansible ───────────────────────────────────────────────
ansible-setup: ## Run Ansible environment check playbook
	cd ansible && ansible-playbook -i inventory.ini setup-env.yml

# ─── Load Testing ──────────────────────────────────────────
load-test-local: ## Run k6 load test against docker-compose backend
	k6 run --env API_URL=http://localhost:3001 tests/load-test.js

load-test-k8s: ## Run k6 load test against K8s backend
	k6 run --env API_URL=http://localhost:30001 tests/load-test.js

