const path = require('path');
const fs = require('fs');

module.exports = function (plop) {
  // Handlebars helpers
  plop.setHelper('kebabCase', (text) =>
    text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  );

  plop.setHelper('pascalCase', (text) =>
    text.replace(/(^\w|-\w)/g, (m) => m.replace('-', '').toUpperCase())
  );

  plop.setHelper('camelCase', (text) => {
    const pascal = text.replace(/(^\w|-\w)/g, (m) => m.replace('-', '').toUpperCase());
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  });

  plop.setHelper('upperCase', (text) => text.toUpperCase());

  plop.setHelper('eq', (a, b) => a === b);

  plop.setHelper('currentYear', () => new Date().getFullYear());

  // App Generator
  plop.setGenerator('app', {
    description: 'Generate a new Firebase app with Angular Ionic frontend, Cloud Functions, and Terraform infrastructure',
    prompts: [
      {
        type: 'input',
        name: 'appName',
        message: 'App name (kebab-case, e.g., "my-app"):',
        validate: (value) => {
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'App name must be kebab-case (lowercase letters, numbers, and hyphens only, starting with a letter)';
          }
          if (value.length < 2) {
            return 'App name must be at least 2 characters';
          }
          if (value.length > 30) {
            return 'App name must be at most 30 characters';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name (e.g., "My App"):',
        validate: (value) => value.length > 0 || 'Display name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Short description:',
        default: 'A Firebase application'
      },
      {
        type: 'input',
        name: 'githubRepo',
        message: 'GitHub repository (owner/repo format, e.g., "myorg/my-app"):',
        validate: (value) => {
          if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(value)) {
            return 'GitHub repository must be in owner/repo format (e.g., myorg/my-app)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Domain for emails and docs (e.g., "myapp.com"):',
        validate: (value) => {
          if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/.test(value)) {
            return 'Please enter a valid domain (e.g., myapp.com)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'copyrightHolder',
        message: 'Copyright holder name:',
        default: (answers) => answers.displayName
      },
      {
        type: 'input',
        name: 'billingAccountId',
        message: 'GCP Billing Account ID (e.g., "XXXXXX-XXXXXX-XXXXXX"):',
        validate: (value) => {
          if (!/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(value)) {
            return 'Billing account ID must be in format XXXXXX-XXXXXX-XXXXXX';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'region',
        message: 'GCP Region:',
        default: 'europe-west1'
      },
      {
        type: 'confirm',
        name: 'includeStripe',
        message: 'Include Stripe payment integration?',
        default: false
      },
      {
        type: 'confirm',
        name: 'includeFIC',
        message: 'Include Fatture in Cloud integration? (Italian invoicing)',
        default: false,
        when: (answers) => answers.includeStripe
      },
      {
        type: 'confirm',
        name: 'includeGemini',
        message: 'Include Google Gemini AI integration?',
        default: false
      },
      {
        type: 'confirm',
        name: 'enableAuth',
        message: 'Enable Firebase Authentication?',
        default: true
      },
      {
        type: 'confirm',
        name: 'authEmailPassword',
        message: 'Enable Email/Password authentication?',
        default: true,
        when: (answers) => answers.enableAuth
      },
      {
        type: 'confirm',
        name: 'authGoogle',
        message: 'Prepare Google Sign-In? (requires OAuth credentials later)',
        default: false,
        when: (answers) => answers.enableAuth
      }
    ],
    actions: (data) => {
      // Ensure includeFIC defaults to false if not asked
      if (data.includeFIC === undefined) {
        data.includeFIC = false;
      }

      // Generate unique project IDs
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      data.stagingProjectId = `${data.appName}-stg-${randomSuffix}`;
      data.productionProjectId = `${data.appName}-prod-${randomSuffix}`;

      // Base path for templates and output
      const templateBase = path.join(__dirname, 'templates');
      const outputBase = process.cwd();
      const terraformBase = path.join(outputBase, 'terraform', 'environments');
      const workflowsBase = path.join(outputBase, '.github', 'workflows');

      const actions = [
        // ============ FRONTEND ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'package.json'),
          templateFile: path.join(templateBase, 'frontend', 'package.json.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', '.gitignore'),
          templateFile: path.join(templateBase, 'frontend', 'gitignore.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'angular.json'),
          templateFile: path.join(templateBase, 'frontend', 'angular.json.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'ionic.config.json'),
          templateFile: path.join(templateBase, 'frontend', 'ionic.config.json.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'tsconfig.json'),
          templateFile: path.join(templateBase, 'frontend', 'tsconfig.json')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'tsconfig.app.json'),
          templateFile: path.join(templateBase, 'frontend', 'tsconfig.app.json')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'main.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'main.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'index.html'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'index.html.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'global.scss'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'global.scss')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'polyfills.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'polyfills.ts')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'environments', 'environment.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'environments', 'environment.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'environments', 'environment.prod.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'environments', 'environment.prod.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'app.component.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'app.component.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'app.config.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'app.config.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'app.routes.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'app.routes.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'theme', 'variables.scss'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'theme', 'variables.scss')
        },
        // ============ FRONTEND - ASSETS ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'assets', 'logo.svg'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'assets', 'logo.svg.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'assets', 'favicon.svg'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'assets', 'favicon.svg')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'assets', 'icon', 'favicon.png'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'assets', 'icon', 'favicon.png')
        },

        // ============ FRONTEND - SERVICES ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'services', 'user-context.service.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'services', 'user-context.service.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'services', 'api', 'organization.service.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'services', 'api', 'organization.service.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'services', 'api', 'profile.service.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'services', 'api', 'profile.service.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'services', 'api', 'practitioner-role.service.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'services', 'api', 'practitioner-role.service.ts.hbs')
        },

        // ============ FRONTEND - LAYOUTS ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'layouts', 'private-layout', 'private-layout.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'layouts', 'private-layout', 'private-layout.page.ts.hbs')
        },

        // ============ FRONTEND - PUBLIC PAGES ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'public', 'home', 'home.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'public', 'home', 'home.page.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'public', 'privacy', 'privacy.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'public', 'privacy', 'privacy.page.ts.hbs')
        },

        // ============ FRONTEND - LOGIN ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'login', 'login.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'login', 'login.page.ts.hbs')
        },

        // ============ FRONTEND - PRIVATE PAGES ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'home', 'home.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'home', 'home.page.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'profile', 'profile.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'profile', 'profile.page.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'privacy', 'privacy.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'privacy', 'privacy.page.ts.hbs')
        },

        // ============ FRONTEND - ORG CONFIG PAGES ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'team', 'team.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'team', 'team.page.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'settings', 'settings.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'settings', 'settings.page.ts.hbs')
        },

        // ============ FRONTEND - INVITES ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'invites', 'accept', 'accept.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'invites', 'accept', 'accept.page.ts.hbs')
        },

        // ============ FRONTEND - LEGACY HOME (can be removed if not needed) ============
        {
          type: 'add',
          path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'home', 'home.page.ts'),
          templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'home', 'home.page.ts.hbs')
        },

        // ============ FUNCTIONS ============
        {
          type: 'add',
          path: path.join(outputBase, 'functions', '.gitignore'),
          templateFile: path.join(templateBase, 'functions', 'gitignore.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'package.json'),
          templateFile: path.join(templateBase, 'functions', 'package.json.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'tsconfig.json'),
          templateFile: path.join(templateBase, 'functions', 'tsconfig.json')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'src', 'index.ts'),
          templateFile: path.join(templateBase, 'functions', 'src', 'index.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'src', 'config.ts'),
          templateFile: path.join(templateBase, 'functions', 'src', 'config.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', '.env.example'),
          templateFile: path.join(templateBase, 'functions', '.env.example.hbs')
        },

        // ============ FUNCTIONS - ROUTES ============
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'src', 'routes', 'api', 'users.route.ts'),
          templateFile: path.join(templateBase, 'functions', 'src', 'routes', 'api', 'users.route.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'src', 'routes', 'api', 'organizations.route.ts'),
          templateFile: path.join(templateBase, 'functions', 'src', 'routes', 'api', 'organizations.route.ts.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'functions', 'src', 'routes', 'api', 'practitioner-roles.route.ts'),
          templateFile: path.join(templateBase, 'functions', 'src', 'routes', 'api', 'practitioner-roles.route.ts.hbs')
        },

        // ============ FIREBASE ============
        {
          type: 'add',
          path: path.join(outputBase, 'firebase.json'),
          templateFile: path.join(templateBase, 'firebase', 'firebase.json.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, '.firebaserc'),
          templateFile: path.join(templateBase, 'firebase', '.firebaserc.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'firestore.rules'),
          templateFile: path.join(templateBase, 'firebase', 'firestore.rules')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'firestore.indexes.json'),
          templateFile: path.join(templateBase, 'firebase', 'firestore.indexes.json')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'storage.rules'),
          templateFile: path.join(templateBase, 'firebase', 'storage.rules')
        },

        // ============ TERRAFORM ============
        {
          type: 'add',
          path: path.join(terraformBase, '{{appName}}-staging', 'main.tf'),
          templateFile: path.join(templateBase, 'terraform', 'staging', 'main.tf.hbs')
        },
        {
          type: 'add',
          path: path.join(terraformBase, '{{appName}}-production', 'main.tf'),
          templateFile: path.join(templateBase, 'terraform', 'production', 'main.tf.hbs')
        },

        // ============ WORKFLOWS ============
        {
          type: 'add',
          path: path.join(workflowsBase, '{{appName}}-stg.yml'),
          templateFile: path.join(templateBase, 'workflows', 'app-stg.yml.hbs')
        },
        {
          type: 'add',
          path: path.join(workflowsBase, '{{appName}}-prod.yml'),
          templateFile: path.join(templateBase, 'workflows', 'app-prod.yml.hbs')
        },

        // ============ DOCS ============
        {
          type: 'add',
          path: path.join(outputBase, 'docs', '_config.yml'),
          templateFile: path.join(templateBase, 'docs', '_config.yml.hbs')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'docs', 'Gemfile'),
          templateFile: path.join(templateBase, 'docs', 'Gemfile')
        },
        {
          type: 'add',
          path: path.join(outputBase, 'docs', 'index.md'),
          templateFile: path.join(templateBase, 'docs', 'index.md.hbs')
        },

        // ============ POST-GENERATION MESSAGE ============
        function printInstructions(answers) {
          console.log('\n');
          console.log('======================================================================');
          console.log('                     APP GENERATED SUCCESSFULLY                       ');
          console.log('======================================================================');
          console.log('');
          console.log(`  App: ${answers.displayName}`);
          console.log(`  Path: ${process.cwd()}`);
          console.log('');
          console.log('  FEATURES INCLUDED:');
          console.log('  - Public area with header/footer');
          console.log('  - Private area with sidemenu and organization switcher');
          console.log('  - Multi-tenant organization management');
          console.log('  - Invites and collaborators');
          if (answers.includeStripe) {
            console.log('  - Stripe: Subscriptions and Payments');
          }
          if (answers.includeFIC) {
            console.log('  - Fatture in Cloud: Italian invoicing');
          }
          if (answers.includeGemini) {
            console.log('  - Google Gemini AI integration');
          }
          console.log('');
          console.log('  NEXT STEPS:');
          console.log('');
          console.log('  1. TERRAFORM (create GCP + Firebase projects):');
          console.log(`     cd terraform/environments/${answers.appName}-staging`);
          console.log('     terraform init && terraform apply');
          console.log('');
          console.log('  2. UPDATE FIREBASE CONFIG (automatic):');
          console.log(`     npm run update-firebase-config ${answers.appName} staging`);
          console.log('');
          console.log('  3. INSTALL DEPENDENCIES AND START:');
          console.log('     npm install');
          console.log('     cd frontend && npm start');
          console.log('');
          console.log('  4. (Optional) FIREBASE RULES:');
          console.log('     firebase deploy --only firestore:rules,storage:rules');
          console.log('');
          console.log('======================================================================');
          console.log('\n');
          return 'Post-generation instructions displayed';
        }
      ];

      // ============ CONDITIONAL: STRIPE PAGES ============
      if (data.includeStripe) {
        actions.push(
          {
            type: 'add',
            path: path.join(outputBase, 'frontend', 'src', 'app', 'services', 'api', 'payments.service.ts'),
            templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'services', 'api', 'payments.service.ts.hbs')
          },
          {
            type: 'add',
            path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'subscription', 'subscription.page.ts'),
            templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'subscription', 'subscription.page.ts.hbs')
          },
          {
            type: 'add',
            path: path.join(outputBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'payments', 'payments.page.ts'),
            templateFile: path.join(templateBase, 'frontend', 'src', 'app', 'pages', 'private', 'org-config', 'payments', 'payments.page.ts.hbs')
          },
          {
            type: 'add',
            path: path.join(outputBase, 'functions', 'src', 'routes', 'api', 'payments.route.ts'),
            templateFile: path.join(templateBase, 'functions', 'src', 'routes', 'api', 'payments.route.ts.hbs')
          }
        );
      }

      return actions;
    }
  });
};
