/**
 * Rasterize marketing-kit HTML sources to PNG with system Chrome.
 * Usage: node marketing-kit/render.mjs
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = dirname(fileURLToPath(import.meta.url));
const port = 9334;
const chromeBin = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";

const jobs = [
  {
    file: "logo/mark.html",
    out: "logo/mark.png",
    viewport: [260, 260],
    scale: 4,
    transparent: true,
  },
  {
    file: "logo/logo.html",
    out: "logo/logo.png",
    viewport: [1100, 240],
    scale: 2,
    transparent: true,
  },
  {
    file: "banners/x-header-1500x500.html",
    out: "banners/x-header-1500x500.png",
    viewport: [1500, 500],
    scale: 1,
    expect: [1500, 500],
  },
  {
    file: "banners/linkedin-1584x396.html",
    out: "banners/linkedin-1584x396.png",
    viewport: [1584, 396],
    scale: 1,
    expect: [1584, 396],
  },
  {
    file: "banners/og-1200x630.html",
    out: "banners/og-1200x630.png",
    viewport: [1200, 630],
    scale: 1,
    expect: [1200, 630],
  },
  {
    file: "store/iphone-1290x2796.html",
    out: "store/iphone-1290x2796.png",
    viewport: [430, 932],
    scale: 3,
    expect: [1290, 2796],
  },
  {
    file: "store/mac-2880x1800.html",
    out: "store/mac-2880x1800.png",
    viewport: [1440, 900],
    scale: 2,
    expect: [2880, 1800],
  },
];

function pngSize(buf) {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Not a PNG");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function startChrome() {
  return spawn(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--force-device-scale-factor=1",
      `--remote-debugging-port=${port}`,
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=/tmp/chrome-marketing-kit-${port}`,
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}

async function connect() {
  let version;
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {
      /* chrome still booting */
    }
    await delay(150);
  }
  if (!version?.webSocketDebuggerUrl) {
    throw new Error("Chrome DevTools endpoint did not come up");
  }
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => {
    ws.addEventListener("open", resolvePromise, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let seq = 0;
  const waiters = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (!msg.id || !waiters.has(msg.id)) return;
    const waiter = waiters.get(msg.id);
    waiters.delete(msg.id);
    if (msg.error) waiter.reject(new Error(JSON.stringify(msg.error)));
    else waiter.resolve(msg.result);
  });
  function call(method, params = {}, sessionId) {
    const id = ++seq;
    return new Promise((resolvePromise, reject) => {
      waiters.set(id, { resolve: resolvePromise, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }
  return { ws, call };
}

async function shoot(call, job) {
  const { targetId } = await call("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await call("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const c = (method, params = {}) => call(method, params, sessionId);
  await c("Page.enable");
  await c("Emulation.setDeviceMetricsOverride", {
    width: job.viewport[0],
    height: job.viewport[1],
    deviceScaleFactor: job.scale,
    mobile: false,
  });
  await c("Emulation.setDefaultBackgroundColorOverride", {
    color: job.transparent
      ? { r: 0, g: 0, b: 0, a: 0 }
      : { r: 250, g: 245, b: 236, a: 1 },
  });
  await c("Page.navigate", {
    url: `file://${resolve(root, job.file)}`,
  });
  await c("Runtime.evaluate", {
    expression: "document.fonts.ready",
    awaitPromise: true,
  });
  await delay(80);
  const box = await c("Runtime.evaluate", {
    expression: `(() => {
      const el = document.querySelector("#stage");
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`,
    returnByValue: true,
  });
  const clip = box.result.value;
  const shot = await c("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    omitBackground: Boolean(job.transparent),
    clip: {
      x: clip.x,
      y: clip.y,
      width: clip.width,
      height: clip.height,
      scale: 1,
    },
  });
  const buf = Buffer.from(shot.data, "base64");
  const size = pngSize(buf);
  if (job.expect) {
    const [w, h] = job.expect;
    if (size.width !== w || size.height !== h) {
      throw new Error(
        `${job.out} is ${size.width}x${size.height}, expected ${w}x${h}`,
      );
    }
  }
  if (job.transparent && buf[25] !== 6) {
    throw new Error(`${job.out} rendered without an alpha channel`);
  }
  writeFileSync(resolve(root, job.out), buf);
  await call("Target.closeTarget", { targetId });
  return size;
}

const chrome = startChrome();
let stderr = "";
chrome.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

try {
  const { call, ws } = await connect();
  for (const job of jobs) {
    const size = await shoot(call, job);
    console.log(`${job.out} ${size.width}x${size.height}`);
  }
  ws.close();
} catch (error) {
  console.error(stderr.slice(-2000));
  throw error;
} finally {
  chrome.kill("SIGKILL");
}
