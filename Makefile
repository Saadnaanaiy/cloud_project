# ============================================================
# 🚀 Cloud Native Platform — Makefile
# ============================================================
# Quick reference for local development, Docker, K8s, and GCP
# ============================================================

.PHONY: help build up down logs backend-logs frontend-logs db-logs \
        tf-init tf-plan tf-apply tf-destroy k8s-apply k8s-delete \
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

# ─── Kubernetes ────────────────────────────────────────────
k8s-namespace: ## Create Kubernetes namespace
	kubectl apply -f k8s/00-namespace.yaml

k8s-config: ## Apply ConfigMap and Secret
	kubectl apply -f k8s/01-configmap.yaml
	kubectl apply -f k8s/02-secret.yaml

k8s-deploy: ## Apply all Kubernetes manifests
	kubectl apply -f k8s/

k8s-delete: ## Delete all Kubernetes resources
	kubectl delete -f k8s/

k8s-status: ## Show K8s pod status
	kubectl get pods -n employee-platform

k8s-logs-backend: ## Show backend pod logs
	kubectl logs -l app=backend -n employee-platform --tail=100 -f

k8s-logs-frontend: ## Show frontend pod logs
	kubectl logs -l app=frontend -n employee-platform --tail=100 -f

# ─── Monitoring (Helm) ─────────────────────────────────────
monitoring-install: ## Install kube-prometheus-stack
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo update
	helm install monitoring prometheus-community/kube-prometheus-stack \
	  --namespace monitoring --create-namespace

monitoring-portforward: ## Port-forward Grafana locally
	kubectl port-forward svc/monitoring-grafana 8080:80 -n monitoring

# ─── Load Testing ──────────────────────────────────────────
load-test-local: ## Run k6 load test against local backend
	k6 run --env API_URL=http://localhost:3001 tests/load-test.js

load-test-k8s: ## Run k6 load test against K8s ingress
	k6 run --env API_URL=https://api.yourdomain.com tests/load-test.js
