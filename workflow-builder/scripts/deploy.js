#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist/ directory not found. Run `npm run build` first.');
  process.exit(1);
}

try {
  console.log('📦 Deploying to gh-pages...');

  // Create or switch to gh-pages branch
  try {
    execSync('git show-ref --verify --quiet refs/heads/gh-pages');
  } catch {
    console.log('Creating gh-pages branch...');
    execSync('git checkout --orphan gh-pages');
    execSync('git rm -rf .');
  }

  // Use git subtree to push dist to gh-pages
  console.log('Pushing dist/ to gh-pages branch...');
  execSync('git subtree push --prefix workflow-builder/dist origin gh-pages', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });

  console.log('✅ Deployment complete!');
  console.log('📍 Your site is available at: https://junaid-kameleoon.github.io/Claude/workflow-builder/');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
