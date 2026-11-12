/**
 * ZYNC Master Orchestration Runner
 * Launches all 5 servers and 5 client applications concurrently with unified process management.
 */

const { spawn } = require('child_process');
const path = require('path');

const SERVICES = [
  // Backend API Servers
  { name: 'admin-srv', dir: 'admin/server', cmd: 'node', args: ['index.js'], port: 5001, color: '\x1b[35m' },
  { name: 'student-srv', dir: 'student/server', cmd: 'node', args: ['index.js'], port: 5002, color: '\x1b[36m' },
  { name: 'teacher-srv', dir: 'teacher/server', cmd: 'node', args: ['index.js'], port: 5003, color: '\x1b[32m' },
  { name: 'moderator-srv', dir: 'moderator/server', cmd: 'node', args: ['index.js'], port: 5004, color: '\x1b[33m' },
  { name: 'principal-srv', dir: 'principal/server', cmd: 'node', args: ['index.js'], port: 5005, color: '\x1b[34m' },

  // Frontend Vite Clients
  { name: 'admin-ui', dir: 'admin/client', cmd: 'npx', args: ['vite', '--host', '--port', '5171'], port: 5171, color: '\x1b[95m' },
  { name: 'student-ui', dir: 'student/client', cmd: 'npx', args: ['vite', '--host', '--port', '5172'], port: 5172, color: '\x1b[96m' },
  { name: 'teacher-ui', dir: 'teacher/client', cmd: 'npx', args: ['vite', '--host', '--port', '5173'], port: 5173, color: '\x1b[92m' },
  { name: 'moderator-ui', dir: 'moderator/client', cmd: 'npx', args: ['vite', '--host', '--port', '5174'], port: 5174, color: '\x1b[93m' },
  { name: 'principal-ui', dir: 'principal/client', cmd: 'npx', args: ['vite', '--host', '--port', '5175'], port: 5175, color: '\x1b[94m' }
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const isWin = process.platform === 'win32';

console.log(`${BOLD}======================================================${RESET}`);
console.log(`${BOLD}🚀 STARTING ZYNC CONSOLIDATED PLATFORM (5 PORTALS)${RESET}`);
console.log(`${BOLD}======================================================${RESET}`);
console.log(`• Admin Portal:     http://localhost:5171  (API: 5001)`);
console.log(`• Student Pad:      http://localhost:5172  (API: 5002)`);
console.log(`• Teacher Arena:    http://localhost:5173  (API: 5003)`);
console.log(`• Moderator/Slides: http://localhost:5174  (API: 5004)`);
console.log(`• Principal Portal: http://localhost:5175  (API: 5005)`);
console.log(`${BOLD}======================================================${RESET}\n`);

const children = [];

function startService(service) {
  const cwd = path.resolve(__dirname, service.dir);
  const command = isWin && service.cmd === 'npx' ? 'npx.cmd' : service.cmd;

  const child = spawn(command, service.args, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWin
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${RESET} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${service.color}[${service.name}]${RESET} ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${service.color}[${service.name}]${RESET} exited with code ${code}`);
  });

  children.push(child);
}

// Start all services
SERVICES.forEach(startService);

// Handle clean shutdown on Ctrl+C or kill signals
function shutdown() {
  console.log(`\n${BOLD}Shutting down all ZYNC services...${RESET}`);
  children.forEach((child) => {
    try {
      if (isWin) {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGINT');
      }
    } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
