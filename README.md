# Agenzio Starter

A generator that creates production-ready Firebase applications with Angular Ionic frontend, Cloud Functions backend, and Terraform infrastructure.

## What is Agenzio Starter

Agenzio Starter is a code generator. It produces a complete, deployable Firebase application structure that you own and control.

**It is not:**
- A framework. The generated code uses standard Angular, Ionic, and Firebase patterns.
- A managed service. There are no accounts, dashboards, or vendor dependencies.
- A SaaS product. You run everything on your own GCP project.

The generator creates files. You modify and deploy them. That is the extent of what this repository does.

## Quickstart

### Prerequisites

- Node.js 22 or later
- GCP account with billing enabled
- Terraform 1.0 or later
- Firebase CLI (`npm install -g firebase-tools`)
- gcloud CLI authenticated (`gcloud auth application-default login`)
- GitHub repository (empty, existing, or planned for the new app)

### Generate an Application

```bash
# Clone this repository
git clone https://github.com/donateoa/agenzio-starter.git
cd agenzio-starter

# Install generator dependencies
cd generator && npm install && cd ..

# Create a directory for your new app
mkdir ../my-app && cd ../my-app

# Run the generator
npx --yes file:../agenzio-starter/generator
```

The generator will prompt for:
- App name (kebab-case)
- Display name
- GitHub repository (owner/repo)
- Domain for emails and documentation
- GCP billing account ID
- GCP region
- Optional integrations (Stripe, Gemini AI)

### After Generation

```bash
# 1. Initialize and apply Terraform (creates GCP project and Firebase)
cd terraform/environments/my-app-staging
terraform init
terraform apply

# 2. Update environment files with Firebase config
cd ../../..
npx --yes file:../agenzio-starter/generator/../generator/scripts/update-firebase-config.js my-app staging

# 3. Install dependencies and start development
cd frontend && npm install && npm start
```

## Three Paths

### Development-first

Generate the app and start development. Suitable for rapid prototyping or when you prefer conversational development.

### Infra-first

Apply Terraform first to create the GCP infrastructure. Develop against real Firebase services from the start. Suitable for enterprise environments or when you need to validate infrastructure early.

### Workflow-first

Set up your GitHub repository with secrets and branch protection first. Let CI/CD handle deployments. Suitable for teams with established DevOps practices.

## Design Principles

**Reduce early risk.** The generator creates working infrastructure and code. You start with something that runs, not a blank canvas.

**Clear architectural boundaries.** Frontend, backend, and infrastructure are separated. Each can be modified or replaced independently.

**Human-in-the-loop.** The generator produces files; it does not deploy them. You review and apply changes. Terraform requires explicit approval.

## Frontend Component Requirements

The generated frontend includes page templates that reference UI components you will need to implement or source:

**Required Components (TODO after generation):**
- `PublicHeaderComponent` - Header for public pages
- `PrivateHeaderComponent` - Header for authenticated pages
- `PrivateSidemenuComponent` - Sidemenu for authenticated area
- `OrganizationSwitcherComponent` - Organization selection modal
- `OrganizationCreateComponent` - Organization creation form
- `FooterComponent` - Page footer

**Required Services:**
- `UserContextService` - The generated stub needs implementation
- `OrganizationService` - API service for organizations
- `PractitionerRoleService` - API service for roles

The generated templates include import statements for these components. After generation, you should either:
1. Create your own implementations of these components
2. Use a UI component library and adapt the templates
3. Simplify the templates to remove unused functionality

The backend API routes are fully standalone and work without additional dependencies.

## What This Repository is Not

This repository does not:
- Build your product for you
- Guarantee that generated code is suitable for your use case
- Provide uptime guarantees or SLAs
- Include support for all Firebase or GCP features
- Maintain backwards compatibility across major versions

The generated code is a starting point. Production applications require additional work: security hardening, testing, monitoring, and domain-specific logic.

## Support Policy

Support is provided on a best-effort basis.

- Bug reports require reproducible steps
- Feature requests may or may not be implemented
- Private consulting is not available via GitHub issues
- Pull requests are welcome if focused and motivated

See [SUPPORT.md](SUPPORT.md) for details.

## License

MIT License. See [LICENSE](LICENSE).

## Future Direction

The generator may be extracted into a separate repository in the future. This repository intentionally keeps the generator and templates together for simplicity during initial development.
