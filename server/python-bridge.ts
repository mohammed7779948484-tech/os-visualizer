import { spawn } from "node:child_process"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin, PreviewServer, ViteDevServer } from "vite"

const MAX_REQUEST_BYTES = 64 * 1024
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024
const MAX_STDERR_BYTES = 64 * 1024
const MAX_PROCESSES = 100
const MAX_CONCURRENT_RUNNERS = 4
const PYTHON_TIMEOUT_MS = 10_000

function sendJson(response: ServerResponse, status: number, body: unknown) {
  if (response.writableEnded) return
  response.statusCode = status
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.end(JSON.stringify(body))
}

async function readBody(request: IncomingMessage) {
  request.setEncoding("utf8")
  let body = ""
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BYTES) throw new Error("REQUEST_TOO_LARGE")
  }
  return body
}

function validateResourceLimits(rawBody: string) {
  let request: unknown
  try {
    request = JSON.parse(rawBody) as unknown
  } catch {
    return null
  }

  if (typeof request !== "object" || request === null || !("processes" in request) || !Array.isArray(request.processes)) return null
  if (request.processes.length > MAX_PROCESSES) {
    return { code: "TOO_MANY_PROCESSES", message: `At most ${MAX_PROCESSES} processes are allowed per simulation.` }
  }
  const oversizedId = request.processes.some((process) =>
    typeof process === "object"
    && process !== null
    && "id" in process
    && typeof process.id === "string"
    && process.id.length > 64,
  )
  return oversizedId ? { code: "PROCESS_ID_TOO_LONG", message: "Process IDs must not exceed 64 characters." } : null
}

export function pythonBridge(): Plugin {
  let projectRoot = process.cwd()
  let activeRunners = 0

  const attachMiddleware = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use("/api/simulate", async (request, response, next) => {
      if (request.method !== "POST") {
        if (request.method === "OPTIONS") {
          response.statusCode = 204
          response.end()
          return
        }
        next()
        return
      }

      if (activeRunners >= MAX_CONCURRENT_RUNNERS) {
        sendJson(response, 503, {
          ok: false,
          error: { code: "BRIDGE_BUSY", message: "The local Python bridge is busy. Try again shortly." },
        })
        return
      }
      activeRunners += 1

      let requestBody: string
      try {
        requestBody = await readBody(request)
      } catch {
        activeRunners = Math.max(0, activeRunners - 1)
        sendJson(response, 413, {
          ok: false,
          error: { code: "REQUEST_TOO_LARGE", message: "Simulation request exceeds 64 KB." },
        })
        return
      }

      const resourceError = validateResourceLimits(requestBody)
      if (resourceError) {
        activeRunners = Math.max(0, activeRunners - 1)
        sendJson(response, 413, { ok: false, error: resourceError })
        return
      }

      const pythonCommand = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3")
      const runnerPath = path.join(projectRoot, "python", "runner.py")
      const child = spawn(pythonCommand, [runnerPath], {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      })
      let stdout = ""
      let stderr = ""
      let settled = false
      let released = false

      const releaseRunner = () => {
        if (released) return
        released = true
        activeRunners = Math.max(0, activeRunners - 1)
      }

      const terminate = () => {
        if (!child.killed) child.kill()
      }

      const timeout = setTimeout(() => {
        if (settled) return
        settled = true
        terminate()
        sendJson(response, 504, {
          ok: false,
          error: { code: "PYTHON_TIMEOUT", message: "The Python runner did not respond in time." },
        })
      }, PYTHON_TIMEOUT_MS)

      request.once("aborted", () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        terminate()
      })
      response.once("close", () => {
        if (!response.writableEnded && !settled) {
          settled = true
          clearTimeout(timeout)
          terminate()
        }
      })

      child.stdout.setEncoding("utf8")
      child.stderr.setEncoding("utf8")
      child.stdout.on("data", (chunk: string) => {
        if (settled) return
        stdout += chunk
        if (Buffer.byteLength(stdout, "utf8") <= MAX_OUTPUT_BYTES) return
        settled = true
        clearTimeout(timeout)
        terminate()
        sendJson(response, 502, {
          ok: false,
          error: { code: "PYTHON_OUTPUT_TOO_LARGE", message: "The Python result exceeded the bridge output limit." },
        })
      })
      child.stderr.on("data", (chunk: string) => {
        if (Buffer.byteLength(stderr, "utf8") < MAX_STDERR_BYTES) stderr += chunk
      })
      child.on("error", () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        releaseRunner()
        sendJson(response, 503, {
          ok: false,
          error: { code: "PYTHON_UNAVAILABLE", message: `Could not start the configured Python interpreter (${pythonCommand}).` },
        })
      })
      child.on("close", () => {
        releaseRunner()
        if (settled) return
        settled = true
        clearTimeout(timeout)
        if (stderr.trim()) server.config.logger.warn(`[python-runner] ${stderr.trim()}`)
        try {
          const payload = JSON.parse(stdout) as unknown
          const validEnvelope = typeof payload === "object" && payload !== null && "ok" in payload && typeof payload.ok === "boolean"
          if (!validEnvelope) throw new Error("INVALID_ENVELOPE")
          sendJson(response, payload.ok ? 200 : 400, payload)
        } catch {
          sendJson(response, 502, {
            ok: false,
            error: { code: "INVALID_PYTHON_RESPONSE", message: "The Python runner returned invalid JSON." },
          })
        }
      })

      child.stdin.end(requestBody)
    })
  }

  return {
    name: "kernel-trace-python-bridge",
    configResolved(config) {
      projectRoot = config.root
    },
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  }
}
