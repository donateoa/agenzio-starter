#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

// Path to the plop executable within this package
const plopPath = require.resolve('plop/bin/plop');
// Path to the plopfile.js in the parent directory
const plopfilePath = path.join(__dirname, '../plopfile.js');

// Prepare arguments for plop
// We pass --plopfile to ensure it uses our plopfile.js regardless of CWD
const args = [plopPath, '--plopfile', plopfilePath];

// Forward any additional arguments passed to the generator
const extraArgs = process.argv.slice(2);
if (extraArgs.length > 0) {
    args.push(...extraArgs);
} else {
    // Default to the 'app' generator if no specific generator is named
    args.push('app');
}

// Execute plop
const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    cwd: process.cwd()
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
