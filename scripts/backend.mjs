// Cross-platform helper for the Python backend.
//   node scripts/backend.mjs setup   -> create .venv and install requirements
//   node scripts/backend.mjs start   -> run the API on 0.0.0.0:8000
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = join(root, 'backend')
const venvDir = join(root, '.venv')
const isWindows = process.platform === 'win32'
const venvPython = join(venvDir, isWindows ? 'Scripts/python.exe' : 'bin/python')
const port = process.env.PORT || '8000'

function findSystemPython() {
  for (const cmd of isWindows ? ['python', 'py'] : ['python3', 'python']) {
    const probe = spawnSync(cmd, ['--version'], { encoding: 'utf8' })
    if (probe.status === 0) return cmd
  }
  console.error('Python 3.10+ was not found. Install it from https://www.python.org/downloads/')
  process.exit(1)
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const command = process.argv[2] ?? 'start'

if (command === 'setup') {
  if (!existsSync(venvPython)) {
    console.log('Creating Python virtual environment in .venv ...')
    run(findSystemPython(), ['-m', 'venv', venvDir])
  }
  console.log('Installing backend requirements (ultralytics pulls in PyTorch, so this can take a few minutes) ...')
  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'])
  run(venvPython, ['-m', 'pip', 'install', '-r', join(backendDir, 'requirements.txt')])
  console.log('\nBackend ready. Start everything with: npm run dev:all')
} else if (command === 'start') {
  const python = existsSync(venvPython) ? venvPython : findSystemPython()
  if (python !== venvPython) {
    console.warn('No .venv found; using the system Python. Run `npm run setup:backend` first if imports fail.')
  }
  const server = spawn(python, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', port], {
    cwd: backendDir,
    stdio: 'inherit',
  })
  server.on('exit', (code) => process.exit(code ?? 0))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
} else {
  console.error(`Unknown command "${command}". Use "setup" or "start".`)
  process.exit(1)
}
