variable "project_id" {
  description = "The unique ID for the GCP/Firebase project"
  type        = string
}

variable "project_name" {
  description = "The display name for the project"
  type        = string
}

variable "billing_account" {
  description = "The billing account ID to associate with the project"
  type        = string
}

variable "region" {
  description = "The default region for resources"
  type        = string
  default     = "europe-west1"
}

variable "enable_firestore" {
  description = "Whether to enable and configure Firestore"
  type        = bool
  default     = true
}

variable "enable_storage" {
  description = "Whether to enable and configure Firebase Storage"
  type        = bool
  default     = true
}

# Authentication Configuration
variable "enable_auth" {
  description = "Whether to enable Firebase Authentication"
  type        = bool
  default     = true
}

variable "auth_email_password" {
  description = "Enable Email/Password authentication"
  type        = bool
  default     = true
}

variable "auth_google" {
  description = "Configuration for Google Sign-In (set to null to disable)"
  type = object({
    client_id     = string
    client_secret = string
  })
  default   = null
  sensitive = true
}
