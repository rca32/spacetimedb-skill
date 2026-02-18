#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type ProbeReport = {
  capturedAt: string
  url: string
  session: string
  durationMs: number
  samples: number
  avgFrameMs: number
  p95FrameMs: number
  approxFps: number
  drawCallsDuringProbe: number
  triangleEstimateDuringProbe: number
  jsHeapUsedBytes: number | null
  domNodeCount: number
  canvasCount: number
}

type CliOptions = {
  url: string
  session: string
  durationMs: number
  warmupMs: number
  output: string
}

const defaults: CliOptions = {
  url: 'http://127.0.0.1:5173',
  session: `render-perf-${Date.now()}`,
  durationMs: 15000,
  warmupMs: 4000,
  output: `/tmp/render-perf-${Date.now()}.json`,
}

function usage(): string {
  return `Render perf probe (agent-browser + in-page rAF sampling)\n\nUsage:\n  bun run scripts/render_perf_probe.ts [options]\n\nOptions:\n  --url <url>            Target web-client URL (default: ${defaults.url})\n  --session <name>       agent-browser session name (default: auto timestamp)\n  --duration-ms <ms>     Probe duration in ms (default: ${defaults.durationMs})\n  --warmup-ms <ms>       Warmup wait after network idle (default: ${defaults.warmupMs})\n  --output <path>        Output JSON path (default: ${defaults.output})\n  -h, --help             Show this help\n`
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...defaults }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case '--url':
        options.url = argv[++i] ?? ''
        break
      case '--session':
        options.session = argv[++i] ?? ''
        break
      case '--duration-ms':
        options.durationMs = Number(argv[++i] ?? '')
        break
      case '--warmup-ms':
        options.warmupMs = Number(argv[++i] ?? '')
        break
      case '--output':
        options.output = argv[++i] ?? ''
        break
      case '-h':
      case '--help':
        process.stdout.write(usage())
        process.exit(0)
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!Number.isFinite(options.durationMs) || options.durationMs < 1000) {
    throw new Error('duration-ms must be a number >= 1000')
  }
  if (!Number.isFinite(options.warmupMs) || options.warmupMs < 0) {
    throw new Error('warmup-ms must be a number >= 0')
  }
  if (!options.url) {
    throw new Error('url must not be empty')
  }
  if (!options.session) {
    throw new Error('session must not be empty')
  }
  if (!options.output) {
    throw new Error('output must not be empty')
  }

  return options
}

function runAgent(session: string, args: string[], stdin?: string): string {
  const fullArgs = ['--session', session, ...args]
  const result = spawnSync('agent-browser', fullArgs, {
    input: stdin,
    encoding: 'utf8',
  })

  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  const merged = `${stdout}${stderr}`

  if (result.status !== 0) {
    throw new Error(`agent-browser failed: agent-browser ${fullArgs.join(' ')}\n${merged}`)
  }

  return merged
}

function extractProbeReport(consoleDump: string): ProbeReport {
  const lines = consoleDump.split(/\r?\n/).map((line) => line.trim())
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]
    const markerIndex = line.indexOf('__PERF__')
    if (markerIndex < 0) {
      continue
    }

    const jsonStart = line.indexOf('{', markerIndex)
    const jsonEnd = line.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < jsonStart) {
      continue
    }

    const payload = line.slice(jsonStart, jsonEnd + 1)
    try {
      return JSON.parse(payload) as ProbeReport
    } catch {
      // Keep scanning older lines.
    }
  }

  throw new Error('Could not find __PERF__ marker in agent-browser console output')
}

function evalProbeScript(durationMs: number): string {
  return `(async () => {
  const durationMs = ${durationMs};

  const getHeapUsed = () => {
    const perf = performance;
    if (!('memory' in perf)) {
      return null;
    }
    const memory = perf.memory;
    return typeof memory?.usedJSHeapSize === 'number' ? memory.usedJSHeapSize : null;
  };

  const installDrawCounter = () => {
    const g = globalThis;
    if (g.__stitchDrawCounter) {
      return g.__stitchDrawCounter;
    }

    let drawCalls = 0;
    let triangleEstimate = 0;

    const classify = (mode, count) => {
      if (!Number.isFinite(mode) || !Number.isFinite(count) || count <= 0) {
        return;
      }
      if (mode === 4) {
        triangleEstimate += Math.floor(count / 3);
      } else if (mode === 5 || mode === 6) {
        triangleEstimate += Math.max(0, count - 2);
      }
    };

    const wrap = (proto, fnName, countIndex) => {
      if (!proto || typeof proto[fnName] !== 'function') {
        return;
      }
      const original = proto[fnName];
      if (original && original.__stitchWrapped) {
        return;
      }

      const wrapped = function (...args) {
        drawCalls += 1;
        const mode = Number(args[0] ?? 0);
        const count = Number(args[countIndex] ?? 0);
        classify(mode, count);
        return original.apply(this, args);
      };
      Object.defineProperty(wrapped, '__stitchWrapped', {
        value: true,
        configurable: false,
        writable: false,
      });

      proto[fnName] = wrapped;
    };

    wrap(globalThis.WebGLRenderingContext?.prototype, 'drawArrays', 2);
    wrap(globalThis.WebGLRenderingContext?.prototype, 'drawElements', 1);
    wrap(globalThis.WebGL2RenderingContext?.prototype, 'drawArrays', 2);
    wrap(globalThis.WebGL2RenderingContext?.prototype, 'drawElements', 1);

    g.__stitchDrawCounter = {
      getDrawCalls: () => drawCalls,
      getTriangleEstimate: () => triangleEstimate,
    };

    return g.__stitchDrawCounter;
  };

  const counter = installDrawCounter();
  const drawStart = counter.getDrawCalls();
  const triStart = counter.getTriangleEstimate();

  const samples = [];
  const startedAt = performance.now();
  let previous = startedAt;

  await new Promise((resolve) => {
    const tick = (now) => {
      samples.push(now - previous);
      previous = now;
      if (now - startedAt >= durationMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const elapsed = Math.max(1, performance.now() - startedAt);
  const sorted = [...samples].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * 0.95)));

  const drawEnd = counter.getDrawCalls();
  const triEnd = counter.getTriangleEstimate();

  const report = {
    capturedAt: new Date().toISOString(),
    url: location.href,
    session: '',
    durationMs,
    samples: samples.length,
    avgFrameMs: samples.length ? samples.reduce((acc, x) => acc + x, 0) / samples.length : 0,
    p95FrameMs: samples.length ? sorted[p95Index] : 0,
    approxFps: samples.length ? (samples.length * 1000) / elapsed : 0,
    drawCallsDuringProbe: Math.max(0, drawEnd - drawStart),
    triangleEstimateDuringProbe: Math.max(0, triEnd - triStart),
    jsHeapUsedBytes: getHeapUsed(),
    domNodeCount: document.querySelectorAll('*').length,
    canvasCount: document.querySelectorAll('canvas').length,
  };

  console.log('__PERF__' + JSON.stringify(report));
  return true;
})();`
}

function main(): void {
  const options = parseArgs(process.argv.slice(2))

  let opened = false
  try {
    runAgent(options.session, ['open', options.url])
    opened = true
    runAgent(options.session, ['wait', '--load', 'networkidle'])
    runAgent(options.session, ['wait', String(options.warmupMs)])
    runAgent(options.session, ['console', '--clear'])

    const script = evalProbeScript(options.durationMs)
    runAgent(options.session, ['eval', '--stdin'], script)

    const consoleDump = runAgent(options.session, ['console'])
    const report = extractProbeReport(consoleDump)
    report.session = options.session

    const outputPath = resolve(options.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    process.stdout.write(`[render-perf] wrote ${outputPath}\n`)
    process.stdout.write(
      `[render-perf] avgFrameMs=${report.avgFrameMs.toFixed(3)} p95FrameMs=${report.p95FrameMs.toFixed(3)} fps=${report.approxFps.toFixed(2)} drawCalls=${report.drawCallsDuringProbe} triangles=${report.triangleEstimateDuringProbe} heap=${report.jsHeapUsedBytes ?? 'n/a'}\n`,
    )
  } finally {
    if (opened) {
      try {
        runAgent(options.session, ['close'])
      } catch {
        // Best-effort session cleanup.
      }
    }
  }
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[render-perf] error: ${message}\n`)
  process.exit(1)
}
