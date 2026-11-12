/**
 * ZYNC Health and Database Connectivity Verification
 */

const { execSync } = require('child_process');
const path = require('path');

const SERVERS = ['admin', 'student', 'teacher', 'moderator', 'principal'];
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('Verifying all 5 ZYNC servers database connectivity...\n');

let allPassed = true;

for (const s of SERVERS) {
  process.stdout.write(`Testing [${s}/server] ... `);
  try {
    const cwd = path.resolve(__dirname, s, 'server');
    execSync(`${npmCmd} run check`, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    console.log('\x1b[32mPASS\x1b[0m');
  } catch (err) {
    console.log('\x1b[31mFAIL\x1b[0m');
    console.error(`  Error in ${s}/server:\n  ${err.stdout || err.message}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n\x1b[32mAll 5 servers successfully verified and connected to database "zync"!\x1b[0m');
  process.exit(0);
} else {
  console.error('\n\x1b[31mOne or more servers failed verification.\x1b[0m');
  process.exit(1);
}
