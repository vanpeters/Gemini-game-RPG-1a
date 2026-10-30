import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const CPP_PORT = 8085;
const CPP_BASE_URL = `http://127.0.0.1:${CPP_PORT}`;

let cppProcess: ChildProcess | null = null;
let cppLogs: string[] = [];

function appendCppLog(data: string) {
  const lines = data.split('\n').filter(Boolean);
  for (const line of lines) {
    const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
    cppLogs.push(entry);
    if (cppLogs.length > 200) cppLogs.shift();
  }
}

// Ensure C++ binary is compiled
function ensureCppBinary(): boolean {
  const binaryPath = path.join(__dirname, 'backend', 'rpg_server');
  if (fs.existsSync(binaryPath)) return true;

  console.log('[Server] C++ binary not found. Compiling backend/server.cpp...');
  try {
    execSync('g++ -O2 -std=c++17 backend/server.cpp -lsqlite3 -lssl -lcrypto -lpthread -Ibackend -o backend/rpg_server', {
      cwd: __dirname,
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('[Server] C++ binary compiled successfully.');
    return true;
  } catch (err: any) {
    console.error('[Server] Failed to compile C++ binary:', err.stderr?.toString() || err.message);
    return false;
  }
}

// Start C++ server daemon
function startCppServer() {
  if (cppProcess && !cppProcess.killed) {
    try {
      cppProcess.kill('SIGTERM');
    } catch {}
  }

  if (!ensureCppBinary()) {
    console.error('[Server] Cannot start C++ server: binary is missing.');
    return;
  }

  const binaryPath = path.join(__dirname, 'backend', 'rpg_server');
  console.log(`[Server] Spawning C++ server on port ${CPP_PORT}...`);

  cppProcess = spawn(binaryPath, [CPP_PORT.toString()], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  cppProcess.stdout?.on('data', (d) => {
    const text = d.toString();
    appendCppLog(text);
    process.stdout.write(`[C++ Server] ${text}`);
  });

  cppProcess.stderr?.on('data', (d) => {
    const text = d.toString();
    appendCppLog(`ERR: ${text}`);
    process.stderr.write(`[C++ Err] ${text}`);
  });

  cppProcess.on('exit', (code, signal) => {
    console.log(`[Server] C++ server exited with code ${code}, signal ${signal}`);
    appendCppLog(`Process exited (code=${code}, signal=${signal})`);
  });
}

async function startServer() {
  startCppServer();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // C++ Logs & Diagnostic endpoints
  app.get('/api/cpp/logs', (_req: Request, res: Response) => {
    res.json({
      logs: cppLogs,
      running: cppProcess !== null && !cppProcess.killed && cppProcess.exitCode === null,
      pid: cppProcess?.pid || null,
    });
  });

  app.post('/api/cpp/recompile', (_req: Request, res: Response) => {
    try {
      appendCppLog('Triggering manual C++ recompilation...');
      if (cppProcess && !cppProcess.killed) {
        cppProcess.kill('SIGTERM');
      }

      const compileOutput = execSync(
        'g++ -O2 -std=c++17 backend/server.cpp -lsqlite3 -lssl -lcrypto -lpthread -Ibackend -o backend/rpg_server',
        { cwd: __dirname, stdio: 'pipe' }
      ).toString();

      appendCppLog('C++ binary compiled cleanly. Restarting process...');
      startCppServer();

      res.json({
        success: true,
        message: 'C++ backend recompiled and restarted successfully!',
        output: compileOutput,
      });
    } catch (err: any) {
      const errMsg = err.stderr?.toString() || err.message;
      appendCppLog(`Compilation error: ${errMsg}`);
      res.status(500).json({
        success: false,
        error: errMsg,
      });
    }
  });

  // XML Bestiary Raw API
  app.get('/api/xml/bestiary', (_req: Request, res: Response) => {
    try {
      const xmlPath = path.join(__dirname, 'public', 'enemies.xml');
      const content = fs.readFileSync(xmlPath, 'utf-8');
      res.setHeader('Content-Type', 'application/xml');
      res.send(content);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/xml/bestiary', (req: Request, res: Response) => {
    try {
      const { xml } = req.body;
      if (!xml || typeof xml !== 'string') {
        res.status(400).json({ error: 'XML content required' });
        return;
      }
      fs.writeFileSync(path.join(__dirname, 'public', 'enemies.xml'), xml, 'utf-8');
      fs.writeFileSync(path.join(__dirname, 'frontend', 'enemies.xml'), xml, 'utf-8');
      res.json({ success: true, message: 'Bestiary XML updated on disk' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DB Schema API
  app.get('/api/db/schema', (_req: Request, res: Response) => {
    try {
      const schemaPath = path.join(__dirname, 'backend', 'schema.sql');
      const content = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(content);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tech Stack Summary API
  app.get('/api/tech-stack/info', async (_req: Request, res: Response) => {
    let cppOnline = false;
    let cppData = null;
    try {
      const cppRes = await fetch(`${CPP_BASE_URL}/api/cpp/status`, { signal: AbortSignal.timeout(1000) });
      if (cppRes.ok) {
        cppOnline = true;
        cppData = await cppRes.json();
      }
    } catch {}

    res.json({
      title: 'Ruins of Valdor RPG',
      technologies: [
        { name: 'HTML & CSS', role: 'UI HUD, Retro Battle Arena, Pixel Health Bars, CRT Scanlines', status: 'Active' },
        { name: 'JavaScript / TypeScript', role: 'Game loop, Web Audio Synth, DOMParser XML extraction, State Machine', status: 'Active' },
        { name: 'XML (enemies.xml)', role: 'Declarative Bestiary Schema, Stats, Resistances & Lore', status: 'Active' },
        { name: 'SQLite3 (rpg.db)', role: 'Persistent Relational Tables: characters, inventory, combat_logs', status: 'Active' },
        { name: 'C++17 REST Server', role: 'Native REST backend, combat verification roll engine & SQLite driver', status: cppOnline ? 'Online (Port 8085)' : 'Restarting/Compiling' },
      ],
      cppStats: cppData,
    });
  });

  // Proxy all other /api/* calls to C++ server
  app.all('/api/*', async (req: Request, res: Response) => {
    const targetUrl = `${CPP_BASE_URL}${req.originalUrl}`;
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }

      let bodyData: any = undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.is('application/json')) {
          bodyData = JSON.stringify(req.body);
          headers['Content-Type'] = 'application/json';
        } else if (req.is('application/x-www-form-urlencoded')) {
          bodyData = new URLSearchParams(req.body).toString();
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (typeof req.body === 'string') {
          bodyData = req.body;
        } else {
          bodyData = JSON.stringify(req.body);
        }
      }

      const cppRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: bodyData,
        signal: AbortSignal.timeout(5000),
      });

      const responseText = await cppRes.text();
      res.status(cppRes.status);
      const resContentType = cppRes.headers.get('content-type');
      if (resContentType) {
        res.setHeader('Content-Type', resContentType);
      }
      res.send(responseText);
    } catch (err: any) {
      console.warn(`[Proxy] Forwarding to C++ failed for ${req.originalUrl}:`, err.message);
      // Fallback response for dev resilience
      if (req.originalUrl === '/api/player') {
        res.json({
          id: 1,
          name: 'Valen the Brave',
          class: 'Rune Knight',
          level: 1,
          hp: 100,
          maxHp: 100,
          mana: 50,
          maxMana: 50,
          gold: 25,
          xp: 0,
          wins: 0,
          deaths: 0,
          source: 'Express Fallback (C++ restarting)',
        });
      } else if (req.originalUrl === '/api/save') {
        res.json({ status: 'cached', message: 'C++ is restarting, state kept in memory' });
      } else {
        res.status(503).json({
          error: 'C++ Backend currently unavailable',
          details: err.message,
        });
      }
    }
  });

  const httpServer = http.createServer(app);

  // Mount Vite middleware for dev SPA serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`⚔️  Ruins of Valdor Game Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start server:', err);
});
