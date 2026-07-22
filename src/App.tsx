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
  const isSystem = log.includes('시스템') || isImportant || log.includes('승리') || log.includes('잡았다') || log.includes('도망') || log.includes('나타났다') || log.includes('발견') || log.includes('휴식');
  
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

export default function App() {
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [showSysInfo, setShowSysInfo] = useState(false);
  const [isAutoBattling, setIsAutoBattling] = useState(false);
  const autoBattleRef = useRef(false);
  
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [logQueue, setLogQueue] = useState<string[]>([]);
  const [typingLog, setTypingLog] = useState<string | null>(null);
  const [lastLogVersion, setLastLogVersion] = useState(0);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState(1);

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

  const fetchLocations = async (regionId = selectedRegion) => {
    try {
      const res = await fetch(`/api/locations?regionId=${regionId}`);
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
    
    if (gameState?.nextAction === 'ENEMY_TURN' && !typingLog && logQueue.length === 0 && !loading) {
      timer = setTimeout(() => {
        handleAction('ENEMY_TURN');
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (isAutoBattling && !typingLog && logQueue.length === 0 && !loading && gameState?.nextAction !== 'ENEMY_TURN') {
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
  }, [isAutoBattling, typingLog, logQueue.length, loading, gameState?.nextAction]);

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
            <span>포켓몬.exe</span>
            <div className="flex gap-1">
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Minus size={12}/></button>
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Square size={10}/></button>
              <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <Activity className="w-12 h-12 mb-4 text-[#000080]" />
            <h1 className="text-xl font-bold mb-2 text-center">포켓몬스터</h1>
            <p className="mb-6 text-sm text-center leading-relaxed">
              포켓몬 세계에 오신 것을 환영합니다!<br />모험을 시작할 준비가 되셨나요?
            </p>
            
            <div className="flex flex-col gap-2 w-full">
              <button onClick={() => handleStart(1)} className="win98-button text-sm w-full font-bold py-2">
                시작하기
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
          <span>{gameState.enemy ? `${gameState.enemy.name} - 대화` : '대기실 - 메신저'}</span>
          <div className="flex gap-1">
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Minus size={12}/></button>
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black"><Square size={10}/></button>
            <button className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="win98-menubar shrink-0 text-sm relative">
          <div className="win98-menuitem relative" onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}>
            파일(F)
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 win98-dropdown shadow-md z-50">
                <div className="win98-dropdown-item text-gray-500" onClick={(e) => e.stopPropagation()}>저장(S)</div>
                <div className="win98-dropdown-item text-gray-500" onClick={(e) => e.stopPropagation()}>불러오기(O)</div>
                <div className="h-px bg-gray-500 my-1 mx-1 border-b border-white"></div>
                <div className="win98-dropdown-item" onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveMenu(null); 
                  setGameState(null);
                  setTypingLog(null);
                  setLogQueue([]);
                  setVisibleLogs([]);
                }}>끝내기(X)</div>
              </div>
            )}
          </div>
          <div className="win98-menuitem relative" onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}>
            편집(E)
            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 win98-dropdown shadow-md z-50">
                <div className="win98-dropdown-item text-gray-500" onClick={(e) => e.stopPropagation()}>잘라내기(T)</div>
                <div className="win98-dropdown-item text-gray-500" onClick={(e) => e.stopPropagation()}>복사(C)</div>
                <div className="win98-dropdown-item text-gray-500" onClick={(e) => e.stopPropagation()}>붙여넣기(P)</div>
              </div>
            )}
          </div>
          <div className="win98-menuitem relative" onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}>
            보기(V)
            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 win98-dropdown shadow-md z-50">
                <div className="win98-dropdown-item" onClick={(e) => {
                  e.stopPropagation();
                  setShowGraph(!showGraph);
                  if(!showGraph) fetchGraph();
                  setActiveMenu(null);
                }}>
                  데이터
                </div>
              </div>
            )}
          </div>
          <div className="win98-menuitem relative" onClick={() => setActiveMenu(activeMenu === 'action' ? null : 'action')}>
            동작(A)
            {activeMenu === 'action' && (
              <div className="absolute top-full left-0 mt-1 win98-dropdown shadow-md z-50">
                <div 
                  className="win98-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(null);
                    setShowMap(true);
                    fetchLocations();
                  }}
                >
                  타운맵
                </div>
              </div>
            )}
          </div>
          <div className="win98-menuitem relative" onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}>
            도움말(H)
            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-1 win98-dropdown shadow-md z-50">
                <div className="win98-dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); setShowSysInfo(true); }}>정보(A)</div>
              </div>
            )}
          </div>
          
          {/* Transparent overlay to close menus when clicking outside */}
          {activeMenu && (
            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
          )}
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
                   {isAutoBattling ? '전송\n중지' : '전송(S)'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Profiles */}
          <div className="w-32 md:w-36 flex flex-col justify-between shrink-0 h-full">
            
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
          <span>서버 연결: {gameState.player ? '연결됨' : '대기중'}</span>
        </div>
      </div>

      {showSysInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 p-8 flex items-center justify-center">
          <div className="win98-window w-80 flex flex-col">
             <div className="win98-titlebar">
               <span>시스템 정보</span>
               <button onClick={() => setShowSysInfo(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-4 bg-[#c0c0c0] flex flex-col items-center">
                <Activity className="w-12 h-12 text-[#000080] mb-4" />
                <h2 className="font-bold mb-2">포켓몬.exe</h2>
                <p className="text-sm text-center mb-4">
                  버전 1.0<br/>
                  React + Node.js 기반<br/>
                  포켓몬스터 시뮬레이터
                </p>
                <button className="win98-button w-24 font-bold py-1" onClick={() => setShowSysInfo(false)}>확인</button>
             </div>
          </div>
        </div>
      )}

      {/* JSON-LD Overlay */}
      {showGraph && graphData && (
        <div className="fixed inset-0 bg-black/50 z-50 p-8 flex items-center justify-center">
          <div className="win98-window w-full max-w-4xl max-h-[80vh] flex flex-col">
             <div className="win98-titlebar">
               <span>데이터</span>
               <button onClick={() => setShowGraph(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0]">
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
          <div className="win98-window w-full max-w-2xl max-h-[90vh] flex flex-col">
             <div className="win98-titlebar">
               <span>타운 맵</span>
               <button onClick={() => setShowMap(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0] flex-1 flex flex-col min-h-0 border-l border-white border-t border-white border-r border-black border-b border-black">
                <div className="flex gap-2 mb-2 items-center">
                  <span className="text-sm px-1">위치(L):</span>
                  <select 
                    className="win98-inset bg-white flex-1 p-1 px-2 text-sm text-black focus:outline-none"
                    value={selectedRegion}
                    onChange={(e) => {
                      const newRegionId = parseInt(e.target.value);
                      setSelectedRegion(newRegionId);
                      fetchLocations(newRegionId);
                    }}
                  >
                    <option value={1}>1세대: 관동지방 (Kanto)</option>
                    <option value={2}>2세대: 성도지방 (Johto)</option>
                    <option value={3}>3세대: 호연지방 (Hoenn)</option>
                    <option value={4}>4세대: 신오지방 (Sinnoh)</option>
                    <option value={5}>5세대: 하나지방 (Unova)</option>
                    <option value={6}>6세대: 칼로스지방 (Kalos)</option>
                    <option value={7}>7세대: 알로라지방 (Alola)</option>
                    <option value={8}>8세대: 가라르지방 (Galar)</option>
                    <option value={10}>9세대: 팔데아지방 (Paldea)</option>
                  </select>
                </div>
                <div className="win98-inset bg-white flex-1 relative overflow-auto p-1">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#c0c0c0] sticky top-0 z-10 shadow-[0_1px_0_#808080]">
                      <tr>
                        <th className="font-normal px-2 py-1 shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#000]">이름</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc, i) => (
                        <tr 
                          key={loc.id}
                          onClick={() => {
                            handleAction('TRAVEL', { locationAreaId: loc.id });
                            setShowMap(false);
                          }}
                          className="cursor-pointer hover:bg-[#000080] hover:text-white group border-b border-transparent focus-within:bg-[#000080] focus-within:text-white"
                        >
                          <td className="px-2 py-1 flex items-center gap-2">
                             <div className="w-4 h-4 flex-shrink-0 bg-yellow-100 border border-black shadow-[inset_1px_1px_0_#fff]"></div>
                             <span className="font-bold">{loc.name || loc.loc || loc.identifier}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

