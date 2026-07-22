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
    
    const regionId = parseInt(req.query.regionId as string) || 1;
    
    // Return locations in the requested region
    let locations = db.prepare(`
      SELECT l.id as loc_id, l.identifier as loc, ln.name, MIN(a.id) as area_id
      FROM locations l
      LEFT JOIN location_areas a ON l.id = a.location_id
      LEFT JOIN location_names ln ON l.id = ln.location_id AND ln.local_language_id = 9 
      WHERE l.region_id = ?
      GROUP BY l.id
      ORDER BY l.id ASC
    `).all(String(regionId)) as any[];
    
    locations = locations.map(l => ({
      id: l.area_id ? `area_${l.area_id}` : `loc_${l.loc_id}`,
      identifier: l.loc,
      name: l.name,
      loc_id: l.loc_id,
      area_id: l.area_id
    }));
    
    
    
    const { translateLocationName } = await import('./src/translations.js');
    const translatedLocations = locations.map(loc => {
      let nameToTranslate = loc.name || loc.identifier;
      let translatedName = translateLocationName(nameToTranslate);
      return { ...loc, name: translatedName };
    });

    const progressionOrders: Record<string, string[]> = {
      "1": [
        '태초마을', '1번도로', '상록시티', '22번도로', '2번도로', '상록숲',
        '회색시티', '3번도로', '달맞이산', '4번도로', '블루시티', '24번도로',
        '25번도로', '5번도로', '지하통로', '6번도로', '갈색시티', '상느앙호',
        '11번도로', '디그다의 굴', '9번도로', '10번도로', '돌산터널', '보라타운',
        '포켓몬타워', '8번도로', '7번도로', '무지개시티', '16번도로', '노랑시티',
        '17번도로', '18번도로', '연분홍시티', '사파리존', '15번도로', '14번도로',
        '13번도로', '12번도로', '19번수로', '20번수로', '쌍둥이섬', '홍련마을',
        '포켓몬저택', '21번수로', '무인발전소', '23번도로', '챔피언로드', '석영고원',
        '블루시티동굴', '제1의 섬', '불화산길', '보물해변', '횃불산', '제2의 섬',
        '결점의 곶', '제3의 섬', '제3의 섬 항구', '인연의 다리', '열매숲',
        '제3의 섬 길', '제4의 섬', '얼음붙음동굴', '제5의 섬', '제5의 섬 공터',
        '리조트 고저스', '물의 미로', '추억의 탑', '외딴 섬', '돌아오지않는구멍',
        '제6의 섬', '물의 산책길', '유적의 계곡', '초록의 산책길', '무늬의숲', '변화의동굴',
        '제7의 섬', '트레이너타워', '협곡 입구', '칠보 협곡', '아스카나유적',
        '아스카나유적 모네안의 방', '아스카나유적 립투의 방', '아스카나유적 위프스의 방', 
        '아스카나유적 딜포드의 방', '아스카나유적 스쿠피브의 방', '아스카나유적 릭시의 방',
        '아스카나유적 비아포스의 방', '배꼽바위', '탄생의섬'
      ],
      "2": [
        '연두마을', '29번도로', '무궁시티', '30번도로', '31번도로', '어둠의동굴', '도라지시티', '모다피의 탑',
        '32번도로', '알프의 유적', '연결동굴', '33번도로', '고동마을', '야돈의 우물', '너도밤나무숲',
        '34번도로', '금빛시티', '금빛지하통로', '라디오탑', '35번도로', '자연공원', '포켓슬론돔',
        '36번도로', '37번도로', '인주시티', '불탄탑', '방울탑', '방울소리샛길', '38번도로', '39번도로',
        '담청시티', '담청등대', '40번수로', '41번수로', '소용돌이섬', '진청시티', '42번도로', '절구산',
        '황토마을', '로켓단아지트', '43번도로', '분노의 호수', '44번도로', '얼음삿길', '검은먹시티',
        '용의 굴', '45번도로', '46번도로', '47번도로', '낭떠러지동굴', '48번도로', '사파리존게이트',
        '성도 사파리존', '낭떠러지게이트', '신도유적', '매몰탑', '포켓워커', '쾌속선아쿠아호', '프런티어어세스',
        '동성폭포', '26번도로', '27번도로', '28번도로', '은빛산', '은빛산동굴', '성도 배회', '성도 프렌들리숍'
      ],
      "3": [
        '미로마을', '101번도로', '고도마을', '102번도로', '103번도로', '등화도시', '104번도로', '등화숲',
        '105번수로', '106번수로', '무로마을', '바위동굴', '107번수로', '108번수로', '씨보라', '버려진 배',
        '109번수로', '잿빛도시', '110번도로', '미라주섬', '환상의 섬', '보라시티', '뉴보라', '111번도로',
        '사막지하도', '환영의 탑', '112번도로', '불꽃샛길', '단풍마을', '113번도로', '화산재수집소',
        '114번도로', '유성의 폭포', '115번도로', '116번도로', '금탄도시', '117번도로', '잔디마을',
        '금탄터널', '118번도로', '119번도로', '검방울시티', '120번도로', '가뭄의암굴', '121번도로',
        '사파리존', '해안시티', '송화산', '122번수로', '123번도로', '124번수로', '이끼시티', '우주센터',
        '125번수로', '여울의 동굴', '126번수로', '루네시티', '각성의 사당', '127번수로', '128번수로',
        '해저동굴', '129번수로', '130번수로', '131번수로', '하늘의 기둥', '창공', '황금마을', '132번수로',
        '133번수로', '134번수로', '고지석실', '포켓몬리그', '그랜드시티', '배틀타워', '배틀리조트',
        '배틀프런티어', '호연 배회', '호연 프렌들리숍', '호연 포켓몬센터'
      ],
      "4": [
        '떡잎마을', '201번도로', '잔모래마을', '202번도로', '축복시티', '203번도로', '204번도로',
        '무쇠게이트', '무쇠시티', '무쇠탄갱', '험한 샛길', '꽃향기마을', '꽃향기밭', '골짜기발전소',
        '205번도로', '영원의 숲', '영원시티', '은하단아지트', '206번도로', '미혹의 동굴', '207번도로',
        '천관산', '208번도로', '연고시티', '상호교류광장', '209번도로', '로스트타워', '신수마을',
        '신수유적', '210번도로', '211번도로', '212번도로', '213번도로', '들판시티', '대습초원',
        '214번도로', '유적마니아굴', '215번도로', '장막시티', '216번도로', '217번도로', '예지호수근처',
        '선단시티', '선단신전', '예지호수', '예지의공동', '218번도로', '운하시티', '강철섬',
        '진실의 호수근처', '진실의 호수', '진실의공동', '입지호수근처', '입지호수', '입지의공동',
        '창기둥', '시작의 방', '물가시티', '222번도로', '223번수로', '224번도로', '포켓몬리그',
        '송도의 샘', '귀혼동굴', '225번도로', '파이트에리어', '226번수로', '서바이벌에리어',
        '227번도로', '하드마운틴', '228번도로', '229번도로', '리조트에리어', '230번수로'
      ],
      "5": [
        '마름꽃마을', '1번도로', '덩굴마을', '2번도로', '성신시티', '꿈의 터', '3번도로',
        '칠보시티', '바람개비숲', '4번도로', '리조트데저트', '고대의 성', '구름시티',
        '5번도로', '뇌문시티', '16번도로', '미혹의 숲', '6번도로', '물풍경시티', '냉동컨테이너',
        '전기돌동굴', '7번도로', '궐수시티', '타워오브해븐', '태엽산', '설화시티',
        '용나선탑', '8번도로', '실린더브리지', '9번도로', '쌍용시티',
        '10번도로', '챔피언로드', '포켓몬리그', '블랙시티', '화이트포레스트', '11번도로',
        '빌리지브리지', '12번도로', '보배마을', '13번도로', '자이언트홀', '물결마을',
        '14번도로', '풍요의 사당', '15번도로', '블랙게이트', 'P2랩', '하일링크', '리버티가든섬'
      ],
      "6": [
        '조아마을', '1번도로', '수미마을', '2번도로', '백단숲', '3번도로', '백단시티', '4번도로',
        '미르시티', '5번도로', '고파마을', '파르팽 궁전', '6번도로', '7번도로', '가라나사동굴',
        '8번도로', '가라마을', '9번도로', '반짝임의 동굴', '삼채시티', '10번도로', '11번도로',
        '옥유마을', '비춤의 동굴', '사라시티', '마스터타워', '12번도로', '아쥐르만', '비익시티',
        '13번도로', '14번도로', '후늬시티', '15번도로', '16번도로', '버들비마을', '프로스트케이브',
        '17번도로', '향전시티', '플레어단 비밀기지', '18번도로', '배단마을', '끝의 동굴', '19번도로',
        '이설시티', '20번도로', '포켓몬마을', '21번도로', '22번도로'
      ],
      "7": [
        '릴리마을', '1번도로', '하우올리시티', '2번도로', '3번도로', '멜레멜레화원',
        '환대시티', '4번도로', '오하나마을', '5번도로', '잔잔한 물가 언덕', '6번도로',
        '7번도로', '벨라화산공원', '8번도로', '셰이드정글', '9번도로', '코니코니시티',
        '말리에시티', '10번도로', '호쿨라니큰산', '호쿨라니천문대', '11번도로', '12번도로',
        '13번도로', '카푸마을', '슈퍼·메가싸네', '14번도로', '15번도로', '16번도로',
        '울라울라화원', '17번도로', '포마을', '에테르파라다이스',
        '바다민족의 마을', '포니대협곡', '일륜의 제단', '월륜의 제단', '라나키라마운틴',
        '전쟁의 유적', '생명의 유적', '결실의 유적', '희망의 유적', '나시 아일랜드'
      ],
      "8": [
        '펄롱마을', '1번도로', '브래시마을', '2번도로', '엔진시티', '와일드에리어', '3번도로',
        '가라르광산', '4번도로', '터프마을', '5번도로', '바우마을', '제2광산', '엔진시티',
        '너클시티', '6번도로', '래터럴마을', '루미너스메이즈숲', '아라베스크마을', '7번도로',
        '8번도로', '키르쿠스마을', '9번도로', '스파이크마을', '슛시티', '로즈타워', '에너지플랜트',
        '꾸벅졸음숲', '갑옷섬', '왕관설원'
      ],
      "10": [
        '코사지마을', '테이블시티', '세르클마을', '보울마을', '누룩스시티', '카라프시티',
        '참푸르마을', '프리지마을', '베이크마을', '나페산', '에리어 제로'
      ]
    };

    translatedLocations.sort((a, b) => {
      const order = progressionOrders[String(regionId)] || [];
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return parseInt(a.loc_id || '0') - parseInt(b.loc_id || '0');
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
