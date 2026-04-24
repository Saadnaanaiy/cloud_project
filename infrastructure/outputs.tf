output "vpc_name" {
  value       = google_compute_network.main.name
  description = "Created VPC name"
}

output "subnet_name" {
  value       = google_compute_subnetwork.gke.name
  description = "Created GKE subnet name"
}

output "artifact_registry_repo" {
  value       = google_artifact_registry_repository.docker_repo.id
  description = "Artifact Registry repository ID"
}

output "gke_cluster_name" {
  value       = google_container_cluster.main.name
  description = "GKE cluster name"
}

output "gke_cluster_endpoint" {
  value       = google_container_cluster.main.endpoint
  description = "GKE cluster endpoint"
}
