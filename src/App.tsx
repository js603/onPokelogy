import { useEffect, useState, useRef } from 'react';
import { Terminal, Database, Activity, Play, X, Minus, Square, User } from 'lucide-react';

const TypewriterText = ({ text, speed = 10, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

const LogMessage = ({ log, gameState, isTyping, onTypingComplete }: { key?: any, log: string, gameState: any, isTyping?: boolean, onTypingComplete?: () => void }) => {
  const isImportant = log.includes('레벨업') || log.includes('진화');
  const isSystem = log.includes('시맨틱') || isImportant || log.includes('승리') || log.includes('잡았다') || log.includes('도망') || log.includes('나타났다') || log.includes('발견') || log.includes('휴식');
  
  let speaker = '';
  let message = log;
  let speakerColor = '';

  if (!isSystem) {
    if (log.includes('주인공')) {
      speaker = gameState.player?.name || '나';
      speakerColor = 'text-blue-600';
      message = log.replace(/주인공\(.*?\)(이\(가\)|은\(는\)|은|는|의|이|가)?\s*/, '');
    } else if (log.includes('적 ')) {
      speaker = gameState.enemy?.name || '상대';
      speakerColor = 'text-red-600';
      message = log.replace(/적\s+[^\s(]+(\(.*?\))?(이\(가\)|은\(는\)|은|는|의|이|가)?\s*/, '');
    } else if (gameState.player && log.startsWith(gameState.player.name)) {
      speaker = gameState.player.name;
      speakerColor = 'text-blue-600';
      message = log.replace(new RegExp(`^${gameState.player.name}(이\\(가\\)|은\\(는\\)|은|는|의|이|가)?\\s*`), '');
    } else if (gameState.enemy && log.startsWith(gameState.enemy.name)) {
      speaker = gameState.enemy.name;
      speakerColor = 'text-red-600';
      message = log.replace(new RegExp(`^${gameState.enemy.name}(이\\(가\\)|은\\(는\\)|은|는|의|이|가)?\\s*`), '');
    } else {
      speaker = '시스템';
      speakerColor = 'text-gray-600';
    }
  }

  const isMyMessage = speaker === gameState.player?.name || speaker === '나';

  return (
    <div className={`mb-3 leading-snug flex flex-col ${isSystem ? 'items-center' : isMyMessage ? 'items-end' : 'items-start'} ${isImportant ? 'log-important' : ''}`}>
      {isSystem ? (
        <div className="text-gray-500 text-center italic text-[11px] py-1 border-y border-gray-100 my-1 bg-gray-50 w-full">
          {isTyping ? <TypewriterText text={log} onComplete={onTypingComplete} speed={15} /> : <span>{log}</span>}
        </div>
      ) : (
        <div className={`max-w-[80%] flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {speaker && (
            <div className="mb-0.5 font-sans flex items-center gap-1">
              {isMyMessage ? (
                <>
                  <span className="text-gray-400 text-[10px]">말함</span>
                  <span className={`font-bold ${speakerColor} text-xs`}>{speaker}</span>
                </>
              ) : (
                <>
                  <span className={`font-bold ${speakerColor} text-xs`}>{speaker}</span>
                  <span className="text-gray-400 text-[10px]">말함</span>
                </>
              )}
            </div>
          )}
          <div className={`px-2 py-1 rounded-sm border ${isMyMessage ? 'bg-[#ffffe0] border-yellow-300 text-right' : 'bg-[#f0f8ff] border-blue-200 text-left'} text-xs ${message.includes('피해') ? 'text-red-600 font-bold' : 'text-black'}`}>
            {isTyping ? <TypewriterText text={message} onComplete={onTypingComplete} speed={15} /> : <span>{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
};



const hoennCoords: Record<string, {x: number, y: number}> = {
  "Littleroot Town": { x: 17, y: 49 },
  "Route 101": { x: 18, y: 47 },
  "Oldale Town": { x: 18, y: 44 },
  "Route 102": { x: 15, y: 43 },
  "Route 103": { x: 20, y: 40 },
  "Petalburg City": { x: 11, y: 42 },
  "Route 104": { x: 8, y: 38 },
  "Route 105": { x: 8, y: 50 },
  "Route 106": { x: 10, y: 59 },
  "Route 110": { x: 26, y: 37 },
  "Dewford Town": { x: 13, y: 63 },
  "Route 109": { x: 26, y: 59 },
  "Route 108": { x: 23, y: 68 },
  "Route 107": { x: 16, y: 63 },
  "Slateport City": { x: 26, y: 49 },
  "Mauville City": { x: 26, y: 27 },
  "Route 117": { x: 21, y: 27 },
  "Verdanturf Town": { x: 18, y: 27 },
  "Route 111": { x: 26, y: 14 },
  "Route 112": { x: 22, y: 11 },
  "Rustboro City": { x: 11, y: 30 },
  "Route 116": { x: 15, y: 24 },
  "Lavaridge Town": { x: 20, y: 15 },
  "Route 115": { x: 8, y: 15 },
  "Route 114": { x: 12, y: 9 },
  "Route 113": { x: 20, y: 5 },
  "Fallarbor Town": { x: 14, y: 5 },
  "Route 118": { x: 31, y: 27 },
  "Route 119": { x: 33, y: 14 },
  "Fortree City": { x: 36, y: 5 },
  "Route 120": { x: 40, y: 12 },
  "Route 123": { x: 40, y: 27 },
  "Route 121": { x: 45, y: 18 },
  "Route 122": { x: 45, y: 22 },
  "Lilycove City": { x: 52, y: 18 },
  "Route 124": { x: 59, y: 19 },
  "Route 125": { x: 66, y: 16 },
  "Route 126": { x: 59, y: 31 },
  "Route 127": { x: 66, y: 31 },
  "Route 128": { x: 68, y: 42 },
  "Route 129": { x: 66, y: 48 },
  "Route 130": { x: 59, y: 48 },
  "Mossdeep City": { x: 66, y: 22 },
  "Route 134": { x: 31, y: 48 },
  "Route 133": { x: 38, y: 48 },
  "Route 132": { x: 45, y: 48 },
  "Pacifidlog Town": { x: 50, y: 48 },
  "Route 131": { x: 52, y: 47 },
  "Ever Grande City": { x: 75, y: 33 },
  "Meteor Falls": { x: 12, y: 12 },
  "Rusturf Tunnel": { x: 16, y: 25 },
  "Granite Cave": { x: 12, y: 62 },
  "Petalburg Woods": { x: 8, y: 36 },
  "Mt. Pyre": { x: 46, y: 22 },
  "Safari Zone": { x: 44, y: 14 },
  "Shoal Cave": { x: 66, y: 14 },
  "Cave of Origin": { x: 59, y: 31 }, // approximate Sootopolis City
  "Sootopolis City": { x: 59, y: 31 },
  "Victory Road": { x: 73, y: 33 },
  "Sky Pillar": { x: 53, y: 42 },
  "Fiery Path": { x: 23, y: 11 },
  "Jagged Pass": { x: 21, y: 13 },
  "Mt. Chimney": { x: 21, y: 12 },
  "New Mauville": { x: 26, y: 29 },
  "Abandoned Ship": { x: 23, y: 68 },
  "Scorched Slab": { x: 41, y: 12 }
};

const hoennConnections = [
  ["Littleroot Town", "Route 101"],
  ["Route 101", "Oldale Town"],
  ["Oldale Town", "Route 102"],
  ["Oldale Town", "Route 103"],
  ["Route 102", "Petalburg City"],
  ["Petalburg City", "Route 104"],
  ["Route 104", "Rustboro City"],
  ["Route 104", "Petalburg Woods"],
  ["Rustboro City", "Route 115"],
  ["Rustboro City", "Route 116"],
  ["Route 116", "Rusturf Tunnel"],
  ["Rusturf Tunnel", "Verdanturf Town"],
  ["Verdanturf Town", "Route 117"],
  ["Route 117", "Mauville City"],
  ["Rustboro City", "Route 105"],
  ["Route 105", "Route 106"],
  ["Route 106", "Dewford Town"],
  ["Dewford Town", "Granite Cave"],
  ["Dewford Town", "Route 107"],
  ["Route 107", "Route 108"],
  ["Route 108", "Route 109"],
  ["Route 109", "Slateport City"],
  ["Slateport City", "Route 110"],
  ["Route 110", "Mauville City"],
  ["Mauville City", "Route 111"],
  ["Route 111", "Route 112"],
  ["Route 112", "Fiery Path"],
  ["Fiery Path", "Route 111"], // North side
  ["Route 112", "Mt. Chimney"],
  ["Mt. Chimney", "Jagged Pass"],
  ["Jagged Pass", "Route 112"],
  ["Route 111", "Route 113"],
  ["Route 113", "Fallarbor Town"],
  ["Fallarbor Town", "Route 114"],
  ["Route 114", "Meteor Falls"],
  ["Meteor Falls", "Route 115"],
  ["Mauville City", "Route 118"],
  ["Route 118", "Route 119"],
  ["Route 119", "Fortree City"],
  ["Fortree City", "Route 120"],
  ["Route 120", "Route 121"],
  ["Route 121", "Lilycove City"],
  ["Route 121", "Safari Zone"],
  ["Route 121", "Route 122"],
  ["Route 122", "Mt. Pyre"],
  ["Route 122", "Route 123"],
  ["Route 123", "Route 118"],
  ["Lilycove City", "Route 124"],
  ["Route 124", "Mossdeep City"],
  ["Mossdeep City", "Route 125"],
  ["Route 125", "Shoal Cave"],
  ["Mossdeep City", "Route 127"],
  ["Route 124", "Route 126"],
  ["Route 126", "Sootopolis City"],
  ["Sootopolis City", "Cave of Origin"],
  ["Route 127", "Route 128"],
  ["Route 128", "Ever Grande City"],
  ["Ever Grande City", "Victory Road"],
  ["Route 128", "Route 129"],
  ["Route 129", "Route 130"],
  ["Route 130", "Route 131"],
  ["Route 131", "Pacifidlog Town"],
  ["Route 131", "Sky Pillar"],
  ["Pacifidlog Town", "Route 132"],
  ["Route 132", "Route 133"],
  ["Route 133", "Route 134"],
  ["Route 134", "Slateport City"] // Approx connection for the currents
];

export default function App() {

  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [isAutoBattling, setIsAutoBattling] = useState(false);
  const autoBattleRef = useRef(false);
  
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [logQueue, setLogQueue] = useState<string[]>([]);
  const [typingLog, setTypingLog] = useState<string | null>(null);
  const [lastLogVersion, setLastLogVersion] = useState(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    autoScrollRef.current = Math.abs(scrollHeight - Math.ceil(scrollTop) - clientHeight) < 50;
  };
  
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new MutationObserver(() => {
      if (autoScrollRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    });
    observer.observe(scrollContainerRef.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typingLog) {
      const interval = setInterval(() => {
        if (autoScrollRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [typingLog]);

  useEffect(() => {
    if (gameState?.logs) {
      if (gameState.logs.length < lastLogVersion) {
        // Reset
        setVisibleLogs(gameState.logs);
        setLogQueue([]);
        setTypingLog(null);
        setLastLogVersion(gameState.logs.length);
      } else if (gameState.logs.length > lastLogVersion) {
        const newLogs = gameState.logs.slice(lastLogVersion);
        if (lastLogVersion === 0 && visibleLogs.length === 0 && !typingLog) {
          // initial load
          setVisibleLogs(gameState.logs);
        } else {
          setLogQueue(prev => [...prev, ...newLogs]);
        }
        setLastLogVersion(gameState.logs.length);
      }
    }
  }, [gameState?.logs, lastLogVersion, visibleLogs.length, typingLog]);

  useEffect(() => {
    if (!typingLog && logQueue.length > 0) {
      setTypingLog(logQueue[0]);
      setLogQueue(prev => prev.slice(1));
    }
  }, [typingLog, logQueue]);

  const handleTypingComplete = () => {
    if (typingLog) {
      setVisibleLogs(prev => [...prev, typingLog]);
      setTypingLog(null);
    }
  };

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setGameState(data);
    } catch (e) {
      console.error('Failed to fetch state', e);
    }
  };

  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      setGraphData(data);
    } catch (e) {
      console.error('Failed to fetch graph', e);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (e) {
      console.error('Failed to fetch locations', e);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleStart = async (starterId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starterId })
      });
      const data = await res.json();
      setGameState(data);
    } catch (e) {
      console.error('Failed to start', e);
    } finally {
      setLoading(false);
    }
  };

  const [evolvingData, setEvolvingData] = useState<any>(null);

  const handleAction = async (action: string, payload?: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      const data = await res.json();
      
      if (data.evolutionEvent) {
        setEvolvingData(data.evolutionEvent);
        setTimeout(() => {
          setEvolvingData(null);
        }, 4000);
      }
      
      setGameState(data);
      setLoading(false);
      return data;
    } catch (e) {
      console.error('Failed to perform action', e);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    let timer: any;
    if (isAutoBattling && !typingLog && logQueue.length === 0 && !loading) {
      const currentGameState = gameStateRef.current;
      if (currentGameState?.player?.hp <= 0) {
        setIsAutoBattling(false);
        autoBattleRef.current = false;
      } else {
        timer = setTimeout(() => {
          if (autoBattleRef.current && !loading && !typingLog && logQueue.length === 0) {
            if (currentGameState?.enemy) {
              handleAction('AUTO_TICK');
            } else {
              handleAction('EXPLORE');
            }
          }
        }, 500); // Wait a bit after logs are done typing
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoBattling, typingLog, logQueue.length, loading]);

  const toggleAutoBattle = () => {
    if (!isAutoBattling) {
      setIsAutoBattling(true);
      autoBattleRef.current = true;
    } else {
      setIsAutoBattling(false);
      autoBattleRef.current = false;
      if (gameStateRef.current?.enemy) {
        handleAction('RUN');
      }
    }
  };

  if (!gameState || (!gameState.player && !loading)) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4">
        <div className="win98-window w-[400px]">
          <div className="win98-titlebar">
            <span>시맨틱 포켓몬.exe</span>
            <div className="flex gap-1">
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Minus size={12}/></button>
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Square size={10}/></button>
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <Activity className="w-12 h-12 mb-4 text-[#000080]" />
            <h1 className="text-xl font-bold mb-2 text-center">시맨틱 포켓몬 시뮬레이터</h1>
            <p className="mb-6 text-sm text-center">
              지식 그래프를 초기화하고 온톨로지를 불러옵니다. AI 없이 순수 데이터 기반 추론으로 작동합니다.
            </p>
            
            <div className="flex flex-col gap-2 w-full">
              <button onClick={() => handleStart(1)} className="win98-button text-sm w-full font-bold py-2">
                새 모험 시작 (인간 주인공으로 시작)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#008080] flex flex-col p-2 sm:p-4 md:p-8 overflow-hidden" style={{ fontFamily: '"Tahoma", "MS Sans Serif", sans-serif' }}>
      
      {evolvingData && (
        <div className="fixed inset-0 bg-black/80 z-50 p-4 flex items-center justify-center">
          <div className="win98-window w-full max-w-sm flex flex-col shadow-2xl">
             <div className="win98-titlebar shrink-0">
               <span>진화 중...</span>
             </div>
             <div className="p-6 bg-[#c0c0c0] flex flex-col items-center justify-center text-center">
                <h3 className="font-bold text-lg mb-6">앗! {evolvingData.oldName}의 상태가...!</h3>
                <div className="relative w-48 h-48 mb-6">
                  <img src={evolvingData.oldSprite} alt="old" className="absolute inset-0 w-full h-full object-contain animate-flash-out" style={{ imageRendering: 'pixelated' }} />
                  <img src={evolvingData.newSprite} alt="new" className="absolute inset-0 w-full h-full object-contain animate-flash-in" style={{ imageRendering: 'pixelated' }} />
                </div>
                <h3 className="font-bold text-lg text-[#000080] animate-pulse">축하합니다!<br/>{evolvingData.oldName}은(는) {evolvingData.newName}(으)로 진화했습니다!</h3>
             </div>
          </div>
        </div>
      )}

      <div className="win98-window flex flex-col max-w-4xl mx-auto w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] min-h-[500px] overflow-hidden">
        {/* Window Title */}
        <div className="win98-titlebar shrink-0">
          <span>{gameState.enemy ? `${gameState.enemy.name} - 대화` : '대기실 - 시맨틱 메신저'}</span>
          <div className="flex gap-1">
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Minus size={12}/></button>
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Square size={10}/></button>
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="win98-menubar shrink-0 text-sm relative">
          <div className="win98-menuitem relative" onClick={() => setShowFileMenu(!showFileMenu)}>
            파일(F)
            {showFileMenu && (
              <div className="win98-dropdown">
                <div 
                  className="win98-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFileMenu(false);
                    handleStart(1);
                  }}
                >
                  리셋(R)
                </div>
              </div>
            )}
          </div>
          <div className="win98-menuitem">편집(E)</div>
          <div className="win98-menuitem" onClick={() => { setShowGraph(!showGraph); if(!showGraph) fetchGraph(); }}>보기(V)</div>
          <div className="win98-menuitem relative" onClick={() => setShowActionMenu(!showActionMenu)}>
            동작(A)
            {showActionMenu && (
              <div className="win98-dropdown">
                <div 
                  className="win98-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionMenu(false);
                    setShowMap(true);
                    fetchLocations();
                  }}
                >
                  맵
                </div>
              </div>
            )}
          </div>
          <div className="win98-menuitem">도움말(H)</div>
        </div>

        <div className="flex p-2 gap-2 flex-1 overflow-hidden min-h-0 bg-[#c0c0c0]">
          
          {/* Left Column: Chat */}
          <div className="flex-1 flex flex-col min-h-0 min-w-[250px]">
            {/* Chat History */}
            <div className="flex-1 win98-inset p-2 bg-white flex flex-col overflow-hidden mb-2">
              <div className="text-gray-500 mb-2 border-b border-gray-200 pb-1 text-sm">
                {gameState.enemy ? `${gameState.enemy.name} 님이 대화에 참여했습니다.` : '대화 상대를 찾는 중...'}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 font-sans" ref={scrollContainerRef} onScroll={handleScroll}>
                {visibleLogs.map((log: string, i: number) => (
                  <LogMessage key={i} log={log} gameState={gameState} isTyping={false} />
                ))}
                {typingLog && (
                  <LogMessage key="typing" log={typingLog} gameState={gameState} isTyping={true} onTypingComplete={handleTypingComplete} />
                )}
              </div>
            </div>

            {/* Toolbar (Formatting) - Decorative */}
            <div className="flex items-center gap-1 p-1 mb-1 bg-[#c0c0c0]">
              <span className="font-serif font-bold px-2 cursor-pointer border border-transparent hover:border-gray-400 hover:bg-gray-200">가</span>
              <span className="font-serif italic px-2 cursor-pointer border border-transparent hover:border-gray-400 hover:bg-gray-200">가</span>
              <span className="font-serif underline px-2 cursor-pointer border border-transparent hover:border-gray-400 hover:bg-gray-200">가</span>
              <div className="w-px h-4 bg-gray-500 mx-1 border-r border-white"></div>
              {isAutoBattling ? (
                <div className="text-[#000080] font-bold flex items-center gap-2 text-xs">
                  <Activity size={12} className="animate-pulse" /> 자동 전투 중...
                </div>
              ) : (
                <div className="text-gray-600 text-xs">메시지를 입력하세요...</div>
              )}
            </div>

            {/* Input Area (Actions) */}
            <div className="flex h-24 shrink-0">
              <div className="flex-1 win98-inset bg-white p-2 relative flex flex-col justify-end">
                 <div className="text-gray-400 text-xs mb-1 italic absolute top-2 left-2">여기에 동작을 선택하여 메시지를 작성하세요...</div>
                 
                 <div className="flex gap-1 sm:gap-2 w-full h-8">
                   {gameState.enemy ? (
                      <button className="win98-button flex-1 text-gray-500 cursor-not-allowed text-[10px] sm:text-xs px-1 whitespace-nowrap overflow-hidden text-ellipsis" onClick={(e) => e.preventDefault()}>
                        휴식(비활성)
                      </button>
                   ) : (
                      <button onClick={() => handleAction('REST')} className="win98-button flex-1 text-[10px] sm:text-xs px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        휴식(HP회복)
                      </button>
                   )}

                   {gameState.enemy && (parseInt(gameState.enemy.hp) / parseInt(gameState.enemy.maxHP)) <= 0.5 && (
                      <button onClick={() => {
                        setIsAutoBattling(false);
                        autoBattleRef.current = false;
                        handleAction('CATCH');
                      }} className="win98-button flex-1 text-[#000080] font-bold text-[10px] sm:text-xs px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        포획(초대)
                      </button>
                   )}
                 </div>
              </div>
              <div className="w-20 ml-2 flex flex-col">
                <button onClick={() => toggleAutoBattle()} className={`win98-button w-full h-full font-bold text-sm ${isAutoBattling ? 'text-red-700' : 'text-black'}`}>
                  {isAutoBattling ? '자동 중지' : '자동 전투'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Profiles */}
          <div className="w-32 md:w-36 flex flex-col justify-between shrink-0 h-full pl-1">
            
            {/* Enemy Profile */}
            <div className="flex flex-col items-center">
              <div className="w-full text-center text-xs font-bold text-black mb-1 truncate">{gameState.enemy ? gameState.enemy.name : '오프라인'}</div>
              <div className="w-24 h-24 md:w-28 md:h-28 bg-white win98-inset flex items-center justify-center mb-1">
                {gameState.enemy ? (
                  <img src={gameState.enemy.spriteFront} alt="enemy" className="w-full h-full object-contain rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <User size={32} className="text-gray-300" />
                )}
              </div>
              {gameState.enemy && (
                <div className="w-24 md:w-28 flex flex-col gap-0.5">
                  <div className="text-[10px] text-center">Lv {gameState.enemy.level}</div>
                  <div className="w-full h-2 win98-inset bg-gray-200">
                    <div 
                      className="bg-green-500 h-full transition-all duration-300" 
                      style={{ width: `${Math.max(0, (parseInt(gameState.enemy.hp) / parseInt(gameState.enemy.maxHP)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-bold text-center">HP {gameState.enemy.hp}/{gameState.enemy.maxHP}</div>
                </div>
              )}
            </div>

            {/* Player Profile */}
            <div className="flex flex-col items-center mt-auto">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-white win98-inset flex items-center justify-center mb-1">
                {gameState.player ? (
                  <img src={gameState.player.spriteFront || gameState.player.spriteBack} alt="player" className="w-full h-full object-contain rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <User size={32} className="text-gray-300" />
                )}
              </div>
              <div className="w-full text-center text-xs font-bold text-black mt-1 truncate">{gameState.player ? gameState.player.name : '나'}</div>
              {gameState.player && (
                <div className="w-24 md:w-28 flex flex-col gap-0.5 mt-1">
                  <div className="text-[10px] text-center">Lv {gameState.player.level}</div>
                  <div className="w-full h-2 win98-inset bg-gray-200">
                    <div 
                      className="bg-green-500 h-full transition-all duration-300" 
                      style={{ width: `${Math.max(0, (parseInt(gameState.player.hp) / parseInt(gameState.player.maxHP)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-bold text-center">HP {gameState.player.hp}/{gameState.player.maxHP}</div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t border-gray-400 bg-[#c0c0c0] px-2 py-1 text-xs flex justify-between shrink-0 shadow-[inset_0_1px_0_white]">
          <span>{gameState.enemy ? '대화 중' : '온라인'}</span>
          <span>온톨로지 노드: {gameState.player ? '연결됨' : '대기중'}</span>
        </div>
      </div>

      {/* JSON-LD Overlay */}
      {showGraph && graphData && (
        <div className="fixed inset-0 bg-black/50 z-50 p-8 flex items-center justify-center">
          <div className="win98-window w-full max-w-4xl max-h-[80vh] flex flex-col">
             <div className="win98-titlebar">
               <span>시맨틱 지식 그래프 (JSON-LD)</span>
               <button onClick={() => setShowGraph(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0]">
                <p className="text-sm mb-2 font-bold">이것은 PokeAPI에서 가져와 현재 메모리에서 실행 중인 시맨틱 관계를 나타냅니다.</p>
                <div className="win98-inset p-2 h-[60vh] overflow-auto bg-white">
                  <pre className="text-xs text-black font-mono">
                    {JSON.stringify(graphData, null, 2)}
                  </pre>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Map Overlay */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 md:p-8 flex items-center justify-center">
          <div className="win98-window w-full max-w-4xl max-h-[90vh] flex flex-col">
             <div className="win98-titlebar">
               <span>타운 맵 (Town Map)</span>
               <button onClick={() => setShowMap(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0] flex-1 flex flex-col min-h-0">
                <div className="win98-inset bg-[#78C850] flex-1 relative overflow-auto flex items-center justify-center">
                  <div className="relative w-[800px] max-w-full aspect-[494/308] bg-blue-300 border-4 border-double border-white shadow-lg m-auto shrink-0 overflow-hidden"
                        style={{ backgroundImage: 'url("https://raw.githubusercontent.com/lowlighter/gracidea/main/copyrighted/textures/all/regions/hoenn.png")', backgroundSize: '100% 100%', imageRendering: 'pixelated' }}>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {hoennConnections.map(([from, to], idx) => {
                        const fromCoord = hoennCoords[from];
                        const toCoord = hoennCoords[to];
                        if (fromCoord && toCoord) {
                          return (
                            <line 
                              key={idx} 
                              x1={`${fromCoord.x}%`} 
                              y1={`${fromCoord.y}%`} 
                              x2={`${toCoord.x}%`} 
                              y2={`${toCoord.y}%`} 
                              stroke="white" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                            />
                          );
                        }
                        return null;
                      })}
                    </svg>
                    {/* Map nodes */}
                    {Object.entries(locations.reduce((acc, loc) => {
                      const name = loc.name || loc.loc || loc.identifier;
                      if (!acc[name]) acc[name] = [];
                      acc[name].push(loc);
                      return acc;
                    }, {} as Record<string, any[]>)).map(([name, areas]: [string, any], index: number) => {
                      const coord = hoennCoords[name];
                      if (!coord) {
                        return null; // hide unknown locations like Sevii islands to keep map clean
                      }
                      
                      const { x, y } = coord;
                      
                      const isCity = name.includes('City') || name.includes('Town') || name.includes('Island') || name.includes('Plateau');
                      const nodeColor = isCity ? 'bg-[#FF4040]' : 'bg-[#4080FF]';
                      const nodeShape = isCity ? 'w-5 h-5 rounded-sm' : 'w-3 h-3 rounded-full';
                      
                      return (
                        <div 
                          key={name}
                          className="absolute group flex flex-col items-center justify-center"
                          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className={`${nodeShape} ${nodeColor} border-2 border-white shadow-md group-hover:scale-125 transition-transform cursor-pointer`} />
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 border border-black px-1 text-[10px] font-bold whitespace-nowrap z-10 pointer-events-none group-hover:block hidden md:block">
                            {name}
                          </div>
                          <div className="absolute hidden group-hover:flex flex-col top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black p-1 shadow-lg w-max max-h-40 overflow-y-auto">
                            <div className="text-xs font-bold mb-1 border-b border-gray-400 pb-1">{name}</div>
                            {areas.map((area: any) => (
                              <button 
                                key={area.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('TRAVEL', { locationAreaId: area.id });
                                  setShowMap(false);
                                }}
                                className="win98-button text-[10px] my-[1px] text-left hover:bg-[#000080] hover:text-white truncate px-2 py-1"
                              >
                                {area.identifier || '이동하기'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {loading && !isAutoBattling && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
           <div className="win98-window p-6 text-center shadow-2xl">
             <Activity className="mx-auto mb-2 animate-pulse text-[#000080]" />
             <div className="font-bold text-sm">처리 중...</div>
           </div>
        </div>
      )}

    </div>
  );
}

