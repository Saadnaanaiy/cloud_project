# Stage Final Validation Checklist

Use this checklist as the final handover evidence for the cloud-native stage project.

## 1. Infrastructure (Phase 3)
- [ ] Terraform backend uses remote GCS state via infrastructure/backend.hcl
- [ ] terraform validate passes
- [ ] terraform plan shows expected resources only
- [ ] terraform apply completed without errors
- [ ] Outputs captured (cluster name, endpoint, registry)

Evidence:
- [ ] Paste command outputs in your report
- [ ] Screenshot of created VPC, GKE, and Artifact Registry

## 2. Kubernetes Deployment (Phase 5)
- [ ] Namespace employee-platform exists
- [ ] Backend, frontend, and mysql pods are Running
- [ ] HPA is active and reporting metrics
- [ ] Ingress created with public ADDRESS
- [ ] Managed certificate status is Active

Validation commands:
- kubectl get all -n employee-platform
- kubectl get hpa -n employee-platform
- kubectl get ingress -n employee-platform
- kubectl describe managedcertificate employee-platform-cert -n employee-platform

## 3. CI/CD (Phase 6)
- [ ] CI workflow builds and pushes both images to Artifact Registry
- [ ] CD workflow deploys to GKE on main branch
- [ ] Deployment uses image tag matching commit SHA
- [ ] Rollout status succeeds for backend and frontend

Evidence:
- [ ] Link to successful CI run
- [ ] Link to successful CD run
- [ ] Screenshot of image tags in Artifact Registry

## 4. Monitoring & Alerting (Phase 7)
- [ ] kube-prometheus-stack is installed in monitoring namespace
- [ ] Grafana is reachable
- [ ] Employee Platform dashboard is loaded
- [ ] Custom alerts are visible in Prometheus rules

Validation commands:
- kubectl get pods -n monitoring
- kubectl get configmap employee-platform-dashboard -n monitoring

## 5. Security (Phase 8)
- [ ] External Secrets Operator installed
- [ ] SecretStore gcp-secret-manager is Ready
- [ ] ExternalSecret employee-platform-secret is synced
- [ ] No real secrets committed in Git

Validation commands:
- kubectl get pods -n external-secrets
- kubectl get secretstore -n employee-platform
- kubectl get externalsecret -n employee-platform

## 6. Load Test & Resilience (Phase 9)
- [ ] k6 test executed against API endpoint
- [ ] HPA scales during load test
- [ ] Application remains available during scale events

Validation command example:
- k6 run --env API_URL=https://api.employee-platform.example tests/load-test.js

## 7. Final Handover
- [ ] README updated with deployment/runbook steps
- [ ] Architecture diagram included in report
- [ ] Known limitations and next improvements documented
- [ ] Demo script prepared (5-10 minutes)

## Sign-off
- Project owner:
- Reviewer:
- Date:
- Result: PASS / CONDITIONAL PASS / FAIL
