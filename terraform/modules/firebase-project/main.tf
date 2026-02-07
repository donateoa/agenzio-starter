terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# 1. Create the Google Cloud Project
resource "google_project" "default" {
  provider        = google-beta
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  labels = {
    "firebase" = "enabled"
  }
}

# 2. Enable Required APIs
resource "google_project_service" "default" {
  provider = google-beta
  for_each = toset([
    "cloudbilling.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "cloudfunctions.googleapis.com",
    "iam.googleapis.com",
    "sts.googleapis.com",             # Required for WIF
    "iamcredentials.googleapis.com",
    "identitytoolkit.googleapis.com", # Required for Firebase Auth
  ])
  project            = google_project.default.project_id
  service            = each.key
  disable_on_destroy = false
}

# 3. Initialize Firebase for the project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = google_project.default.project_id

  depends_on = [
    google_project_service.default
  ]
}

# 4. Initialize Firestore
resource "google_firestore_database" "default" {
  count       = var.enable_firestore ? 1 : 0
  provider    = google-beta
  project     = google_project.default.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [
    google_firebase_project.default
  ]
}

# 5. Create a Web App in Firebase
resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = google_project.default.project_id
  display_name = "${var.project_name} Web App"

  depends_on = [
    google_firebase_project.default
  ]
}

# 6. Get the Web App SDK config
data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = google_project.default.project_id
  web_app_id = google_firebase_web_app.default.app_id
}

# 7. Configure Firebase Authentication (Identity Platform)
resource "google_identity_platform_config" "default" {
  count    = var.enable_auth ? 1 : 0
  provider = google-beta
  project  = google_project.default.project_id

  # Enable Email/Password sign-in
  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = var.auth_email_password
      password_required = true
    }
  }

  # Authorized domains for OAuth redirects
  authorized_domains = [
    "localhost",
    "${google_project.default.project_id}.firebaseapp.com",
    "${google_project.default.project_id}.web.app",
  ]

  depends_on = [
    google_project_service.default,
    google_firebase_project.default
  ]
}

# 8. Configure Google Sign-In Provider
resource "google_identity_platform_default_supported_idp_config" "google" {
  count    = var.enable_auth && var.auth_google != null ? 1 : 0
  provider = google-beta
  project  = google_project.default.project_id

  idp_id        = "google.com"
  client_id     = var.auth_google.client_id
  client_secret = var.auth_google.client_secret
  enabled       = true

  depends_on = [
    google_identity_platform_config.default
  ]
}

output "project_id" {
  value = google_project.default.project_id
}

output "project_number" {
  value = google_project.default.number
}

output "web_app_id" {
  description = "Firebase Web App ID"
  value       = google_firebase_web_app.default.app_id
}

output "firebase_config" {
  description = "Firebase SDK configuration for frontend"
  value = {
    apiKey            = data.google_firebase_web_app_config.default.api_key
    authDomain        = "${google_project.default.project_id}.firebaseapp.com"
    projectId         = google_project.default.project_id
    storageBucket     = "${google_project.default.project_id}.firebasestorage.app"
    messagingSenderId = google_project.default.number
    appId             = google_firebase_web_app.default.app_id
  }
  sensitive = true
}

# Output that ensures all APIs are enabled before downstream modules use it
output "services_enabled" {
  description = "Marker that all required APIs are enabled"
  value       = [for s in google_project_service.default : s.service]
}

output "auth_enabled" {
  description = "Authentication providers enabled"
  value = {
    email_password = var.enable_auth && var.auth_email_password
    google         = var.enable_auth && var.auth_google != null
  }
}
