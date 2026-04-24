# Phase 3 Terraform (GCP)

This folder contains Terraform code for the next roadmap phase:
- VPC + subnet + Cloud NAT
- Artifact Registry (Docker)
- Private GKE cluster + managed node pool
- Remote state through GCS backend

## Prerequisites

- Terraform >= 1.6
- gcloud CLI authenticated
- GCP project with required APIs enabled:
  - compute.googleapis.com
  - container.googleapis.com
  - artifactregistry.googleapis.com

## Quick Start

1. Create your remote state bucket (one-time):

   gsutil mb -l europe-west1 gs://YOUR_TF_STATE_BUCKET

2. Prepare local config files:

   - Copy terraform.tfvars.example to terraform.tfvars and fill values
   - Copy backend.hcl.example to backend.hcl and fill bucket/prefix

3. Initialize and plan:

   terraform init -backend-config=backend.hcl
   terraform validate
   terraform plan

4. Apply:

   terraform apply

## Notes

- This is a solid phase-3 baseline, not a full production hardening setup.
- For prod, add stricter IAM roles, authorized networks, policy guardrails, and workload separation by environment.
