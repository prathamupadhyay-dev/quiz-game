/**
 * ZYNC Master Unified Frontend Build Script
 * Builds all 5 frontends into a single coordinated static distribution tree:
 *   /           -> Student Pad (User Portal)
 *   /admin      -> Admin Control Center
 *   /creator    -> Creator (Principal) Studio
 *   /presentor  -> Presentor (Teacher) Arena
 *   /presenter  -> Presentor Alias
 *   /moderator  -> Moderator Deck
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('✨ [BUILD] Starting ZYNC Master Unified Build...\n');

// 1. Ensure clean dist directory
if (fs.existsSync(DIST_DIR)) {
  console.log('🧹 [BUILD] Cleaning existing dist directory...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

const APPS = [
  { name: 'student', dir: 'student/client', base: '/', outDir: '../../dist' },
  { name: 'admin', dir: 'admin/client', base: '/admin/', outDir: '../../dist/admin' },
  { name: 'creator', dir: 'principal/client', base: '/creator/', outDir: '../../dist/creator' },
  { name: 'presentor', dir: 'teacher/client', base: '/presentor/', outDir: '../../dist/presentor' },
  { name: 'moderator', dir: 'moderator/client', base: '/moderator/', outDir: '../../dist/moderator' }
];

for (const app of APPS) {
  console.log(`\n🚀 [BUILD] Preparing ${app.name.toUpperCase()} (base: ${app.base})...`);
  const appPath = path.join(ROOT_DIR, app.dir);

  // Auto-install dependencies if not already installed (e.g. in cloud CI like Vercel)
  const viteBin = path.join(appPath, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
  if (!fs.existsSync(viteBin)) {
    console.log(`📦 [BUILD] Installing dependencies for ${app.name.toUpperCase()}...`);
    execSync('npm install --no-audit --prefer-offline', {
      cwd: appPath,
      stdio: 'inherit',
      shell: true
    });
  }

  console.log(`🔨 [BUILD] Compiling ${app.name.toUpperCase()}...`);
  execSync(`npm run build -- --base ${app.base} --outDir ${app.outDir}`, {
    cwd: appPath,
    stdio: 'inherit',
    shell: true
  });
  console.log(`✅ [BUILD] ${app.name.toUpperCase()} built successfully!`);
}

// Create presenter alias
const presentorDir = path.join(DIST_DIR, 'presentor');
const presenterDir = path.join(DIST_DIR, 'presenter');
if (fs.existsSync(presentorDir)) {
  console.log('\n🔗 [BUILD] Creating /presenter alias mirror...');
  fs.cpSync(presentorDir, presenterDir, { recursive: true });
  console.log('✅ [BUILD] /presenter alias ready!');
}

console.log('\n🎉 [BUILD] All 5 portals built successfully into /dist!');
