#!/usr/bin/env node
/**
 * Script to update frontend environment files with Firebase config from Terraform output
 *
 * Usage:
 *   node update-firebase-config.js <app-name> <environment> [region]
 *
 * Examples:
 *   node update-firebase-config.js my-app staging              # Uses default region europe-west1
 *   node update-firebase-config.js my-app production us-west1  # Uses us-west1 region
 *   node update-firebase-config.js my-app all                  # Updates both files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appName = process.argv[2];
const environment = process.argv[3] || 'staging';
const region = process.argv[4] || 'europe-west1';

if (!appName) {
  console.error('Usage: node update-firebase-config.js <app-name> [staging|production|all] [region]');
  console.error('');
  console.error('Arguments:');
  console.error('  app-name     The name of your app (used to find terraform environment)');
  console.error('  environment  One of: staging, production, all (default: staging)');
  console.error('  region       GCP region (default: europe-west1)');
  process.exit(1);
}

function updateEnvironmentFile(appName, env) {
  // Paths relative to where the generated app is located (current working directory)
  const terraformDir = path.join(process.cwd(), 'terraform', 'environments', `${appName}-${env}`);
  const envFile = env === 'production'
    ? path.join(process.cwd(), 'frontend', 'src', 'environments', 'environment.prod.ts')
    : path.join(process.cwd(), 'frontend', 'src', 'environments', 'environment.ts');

  // Check if terraform directory exists
  if (!fs.existsSync(terraformDir)) {
    console.error(`  Terraform directory not found: ${terraformDir}`);
    return false;
  }

  console.log(`\nFetching Firebase config from Terraform (${env})...`);

  try {
    // Get terraform output
    const output = execSync('terraform output -json firebase_config', {
      cwd: terraformDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const config = JSON.parse(output);

    console.log('  Firebase config retrieved:');
    console.log(`    projectId: ${config.projectId}`);
    console.log(`    appId: ${config.appId}`);
    console.log(`    authDomain: ${config.authDomain}`);

    // Read existing environment file
    if (!fs.existsSync(envFile)) {
      console.error(`  Environment file not found: ${envFile}`);
      return false;
    }

    let envContent = fs.readFileSync(envFile, 'utf8');

    // Update the firebase config values
    envContent = envContent.replace(/apiKey:\s*['"][^'"]*['"]/g, `apiKey: '${config.apiKey}'`);
    envContent = envContent.replace(/appId:\s*['"][^'"]*['"]/g, `appId: '${config.appId}'`);
    envContent = envContent.replace(/authDomain:\s*['"][^'"]*['"]/g, `authDomain: '${config.authDomain}'`);
    envContent = envContent.replace(/messagingSenderId:\s*['"][^'"]*['"]/g, `messagingSenderId: '${config.messagingSenderId}'`);
    envContent = envContent.replace(/storageBucket:\s*['"][^'"]*['"]/g, `storageBucket: '${config.storageBucket}'`);
    envContent = envContent.replace(/projectId:\s*['"][^'"]*['"]/g, `projectId: '${config.projectId}'`);

    // Update apiUrl for the correct project
    const apiUrl = env === 'production'
      ? `https://${region}-${config.projectId}.cloudfunctions.net/api`
      : `http://localhost:5001/${config.projectId}/${region}/api`;
    envContent = envContent.replace(/apiUrl:\s*['"][^'"]*['"]/g, `apiUrl: '${apiUrl}'`);

    // Remove TODO comments
    envContent = envContent.replace(/\s*\/\/\s*TODO:.*$/gm, '');

    // Write back
    fs.writeFileSync(envFile, envContent);

    console.log(`  Updated: ${envFile}`);
    return true;

  } catch (error) {
    console.error(`  Error: ${error.message}`);
    console.error('  Make sure you have run "terraform apply" first.');
    return false;
  }
}

// Main execution
console.log(`Updating Firebase config for: ${appName}`);
console.log(`Region: ${region}`);

let success = true;

if (environment === 'all') {
  // Update both environments
  const stagingResult = updateEnvironmentFile(appName, 'staging');
  const prodResult = updateEnvironmentFile(appName, 'production');
  success = stagingResult || prodResult;
} else if (environment === 'staging' || environment === 'production') {
  success = updateEnvironmentFile(appName, environment);
} else {
  console.error(`Invalid environment: ${environment}. Use 'staging', 'production', or 'all'.`);
  process.exit(1);
}

if (success) {
  console.log('\nFirebase configuration successfully applied!');
} else {
  console.error('\nFailed to update some environment files.');
  process.exit(1);
}
