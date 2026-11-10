// Frees a TCP port before `npm run dev`. Works on Windows, macOS and Linux.
const { execSync } = require('child_process');

const port = Number(process.argv[2] || process.env.PORT || 8000);

try {
  let pids = [];
  if (process.platform === 'win32') {
    const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf8' });
    pids = out
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter((cols) => cols[1] && cols[1].endsWith(`:${port}`) && cols[3] === 'LISTENING')
      .map((cols) => cols[4]);
  } else {
    pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).split('\n');
  }

  [...new Set(pids.filter((pid) => pid && pid !== '0' && Number(pid) !== process.pid))].forEach((pid) => {
    try {
      process.kill(Number(pid), 'SIGKILL');
      console.log(`Freed port ${port} (killed PID ${pid})`);
    } catch {}
  });
} catch {
  // Nothing is listening on the port
}
