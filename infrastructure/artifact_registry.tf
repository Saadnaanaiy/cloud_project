resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "${var.environment}-${var.artifact_registry_repo}"
  description   = "Docker repository for employee platform"
  format        = "DOCKER"
}
