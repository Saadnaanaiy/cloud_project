variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Primary GCP region"
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "Primary GCP zone"
  type        = string
  default     = "europe-west1-b"
}

variable "environment" {
  description = "Environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_name" {
  description = "VPC name"
  type        = string
  default     = "cloud-native-vpc"
}

variable "subnet_name" {
  description = "GKE subnet name"
  type        = string
  default     = "gke-private-subnet"
}

variable "subnet_cidr" {
  description = "Primary subnet CIDR"
  type        = string
  default     = "10.10.0.0/20"
}

variable "pods_secondary_cidr" {
  description = "Secondary range for GKE pods"
  type        = string
  default     = "10.20.0.0/16"
}

variable "services_secondary_cidr" {
  description = "Secondary range for GKE services"
  type        = string
  default     = "10.30.0.0/20"
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "employee-platform"
}

variable "gke_cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "employee-gke"
}

variable "gke_node_count" {
  description = "Initial node count in node pool"
  type        = number
  default     = 1
}

variable "gke_machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-standard-2"
}
