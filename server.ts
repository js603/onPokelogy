import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GameEngine } from './src/engine/GameEngine';
import { initializeDatabase } from './src/db/init';

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

// 4. Get locations
app.get('/api/locations', async (req, res) => {
  try {
    const { getDb } = await import('./src/db/index.js');
    const db = getDb();
    
    // Only return locations in Kanto (region 1) that have encounters
    const locations = db.prepare(`
      SELECT a.id, a.identifier, l.identifier as loc, ln.name 
      FROM location_areas a 
      JOIN locations l ON a.location_id = l.id 
      LEFT JOIN location_names ln ON l.id = ln.location_id AND ln.local_language_id = 9 
      WHERE a.id IN (SELECT DISTINCT location_area_id FROM encounters) AND l.region_id = 1
    `).all();
    
    const translateMap: Record<string, string> = {
      'Celadon City': '무지개시티',
      'Cerulean City': '블루시티',
      'Cinnabar Island': '홍련마을',
      "Diglett's Cave": '디그다의 굴',
      'Fuchsia City': '연분홍시티',
      'Mt. Moon': '달맞이산',
      'Pallet Town': '태초마을',
      'Rock Tunnel': '돌산터널',
      'Seafoam Islands': '쌍둥이섬',
      'Cerulean Cave': '블루시티동굴',
      'Vermilion City': '갈색시티',
      'Victory Road': '챔피언로드',
      'Viridian City': '상록시티',
      'Viridian Forest': '상록숲',
      'Kanto Power Plant': '무인발전소',
      'Pokémon Tower': '포켓몬타워',
      'Pokémon Mansion': '포켓몬저택',
      'Safari Zone': '사파리존',
      'Pewter City': '회색시티',
      'Lavender Town': '보라타운',
      'Indigo Plateau': '석영고원',
      'Saffron City': '노랑시티',
      'Kanto Underground Path': '지하통로',
      'Mt. Ember': '횃불산',
      'Berry Forest': '열매숲',
      'Icefall Cave': '얼음붙음동굴',
      'Altering Cave': '변화의동굴',
      'Birth Island': '탄생의섬',
      'Navel Rock': '배꼽바위',
      'Trainer Tower': '트레이너타워',
      'S.S. Anne': '상느앙호'
    };

    const translatedLocations = locations.map((l: any) => {
      let name = l.name || l.loc || l.identifier;
      if (name) {
        if (translateMap[name]) {
          name = translateMap[name];
        } else if (name.startsWith('Route ')) {
          name = name.replace('Route ', '') + '번도로';
        } else if (name.startsWith('Sea Route ')) {
          name = name.replace('Sea Route ', '') + '번수로';
        }
      }
      return { ...l, name };
    });
    
    // Sort by Kanto progression order approximately
    const progressionOrder = [
      '태초마을',
      '1번도로',
      '상록시티',
      '22번도로',
      '2번도로',
      '상록숲',
      '회색시티',
      '3번도로',
      '달맞이산',
      '4번도로',
      '블루시티',
      '24번도로',
      '25번도로',
      '5번도로',
      '6번도로',
      '갈색시티',
      '상느앙호',
      '11번도로',
      '디그다의 굴',
      '9번도로',
      '10번도로',
      '돌산터널',
      '보라타운',
      '포켓몬타워',
      '8번도로',
      '7번도로',
      '무지개시티',
      '노랑시티',
      '16번도로',
      '17번도로',
      '18번도로',
      '연분홍시티',
      '사파리존',
      '15번도로',
      '14번도로',
      '13번도로',
      '12번도로',
      '19번수로',
      '20번수로',
      '쌍둥이섬',
      '홍련마을',
      '포켓몬저택',
      '21번수로',
      '23번도로',
      '챔피언로드',
      '석영고원',
      '블루시티동굴',
      '무인발전소'
    ];
    
    translatedLocations.sort((a, b) => {
      const indexA = progressionOrder.indexOf(a.name);
      const indexB = progressionOrder.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json(translatedLocations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
    console.log(`PokeSim Server running on http://localhost:${PORT}`);
    initializeDatabase().then(() => {
      console.log('Database initialized successfully');
    }).catch(err => {
      console.error('Database initialization failed:', err);
    });
  });
}

startServer();
