resource "google_container_cluster" "main" {
  name     = "${local.name_prefix}-${var.gke_cluster_name}"
  location = var.region

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.gke.id

  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  depends_on = [google_compute_router_nat.nat]
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "${local.name_prefix}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.main.name
  node_count = var.gke_node_count

  node_config {
    machine_type = var.gke_machine_type
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.environment
    }

    tags = ["gke-node", var.environment]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
