variable "project_id" {
  description = "The project ID where WIF will be configured"
  type        = string
}

variable "github_repo" {
  description = "The GitHub repository in 'owner/repo' format"
  type        = string
}

variable "pool_id" {
  description = "The ID of the Workload Identity Pool"
  type        = string
  default     = "github-pool"
}

variable "provider_id" {
  description = "The ID of the Workload Identity Provider"
  type        = string
  default     = "github-provider"
}
