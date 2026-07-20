import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GameEngine } from './src/engine/GameEngine';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Global game instance (Single player server for this demo)
const game = new GameEngine();

// -- API Routes --

// 1. Start / Reset Game
app.post('/api/start', async (req, res) => {
  try {
    const { starterId } = req.body;
    await game.startGame(starterId || 1);
    res.json(game.getGameState());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Perform Action (Tick)
app.post('/api/action', async (req, res) => {
  try {
    const { action, payload } = req.body;
    await game.runAction(action, payload);
    res.json(game.getGameState());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Game State
app.get('/api/state', (req, res) => {
  res.json(game.getGameState());
});

// 4. View Knowledge Graph (JSON-LD)
app.get('/api/graph', (req, res) => {
  res.json(game.store.toJSONLD());
});

// 5. SPARQL-lite endpoint
app.post('/api/sparql', (req, res) => {
  const { query } = req.body;
  // A real SPARQL parser is heavy, so we simulate a simple matcher for demonstration
  // Format expected: SELECT ?object WHERE { subject predicate ?object }
  const match = query.match(/SELECT\s+\?([a-zA-Z0-9_]+)\s+WHERE\s*\{\s*([^\s]+)\s+([^\s]+)\s+\?\1\s*\}/i);
  
  if (match) {
    const [_, varName, subject, predicate] = match;
    const s = subject === '?s' ? null : subject.replace(/[<>]/g, '');
    const p = predicate === '?p' ? null : predicate.replace(/[<>]/g, '');
    
    const results = game.store.query(s, p, null);
    const bindings = results.map(t => ({ [varName]: { type: "uri", value: t[2] } }));
    
    return res.json({
      head: { vars: [varName] },
      results: { bindings }
    });
  }
  
  res.status(400).json({ error: "Unsupported query format. Try: SELECT ?obj WHERE { poke:subject poke:predicate ?obj }" });
});


// -- Vite Middleware --
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Semantic PokeSim Server running on http://localhost:${PORT}`);
  });
}

startServer();
