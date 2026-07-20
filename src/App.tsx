import { useEffect, useState, useRef } from 'react';
import { Terminal, Database, Activity, Play, X, Minus, Square, User } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [isAutoBattling, setIsAutoBattling] = useState(false);
  const autoBattleRef = useRef(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.logs]);

  const fetchState = async () => {
    const res = await fetch('/api/state');
    const data = await res.json();
    setGameState(data);
  };

  const fetchGraph = async () => {
    const res = await fetch('/api/graph');
    const data = await res.json();
    setGraphData(data);
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleStart = async (starterId: number) => {
    setLoading(true);
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starterId })
    });
    const data = await res.json();
    setGameState(data);
    setLoading(false);
  };

  const [evolvingData, setEvolvingData] = useState<any>(null);

  const handleAction = async (action: string, payload?: any) => {
    setLoading(true);
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
  };

  const runAutoBattle = async () => {
    if (!autoBattleRef.current) return;
    
    const currentGameState = gameStateRef.current;
    
    if (currentGameState?.player?.hp <= 0) {
      autoBattleRef.current = false;
      setIsAutoBattling(false);
      return;
    }

    let data;
    if (currentGameState?.enemy) {
      data = await handleAction('AUTO_TICK');
    } else {
      data = await handleAction('EXPLORE');
    }
    
    if (autoBattleRef.current && data?.player?.hp > 0) {
      setTimeout(runAutoBattle, 1500);
    }
  };

  const toggleAutoBattle = () => {
    if (!isAutoBattling) {
      setIsAutoBattling(true);
      autoBattleRef.current = true;
      runAutoBattle();
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
        <div className="win98-menubar shrink-0 text-sm">
          <div className="win98-menuitem">파일(F)</div>
          <div className="win98-menuitem">편집(E)</div>
          <div className="win98-menuitem" onClick={() => { setShowGraph(!showGraph); if(!showGraph) fetchGraph(); }}>보기(V)</div>
          <div className="win98-menuitem">동작(A)</div>
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
              <div className="flex-1 overflow-y-auto pr-2 font-sans">
                {gameState.logs.map((log: string, i: number) => {
                  const isImportant = log.includes('레벨업') || log.includes('진화');
                  const isSystem = log.includes('시맨틱') || isImportant || log.includes('승리') || log.includes('잡았다') || log.includes('도망') || log.includes('나타났다') || log.includes('발견') || log.includes('휴식');
                  
                  let speaker = '';
                  let message = log;
                  let speakerColor = '';

                  if (!isSystem) {
                    if (log.includes('주인공')) {
                      speaker = gameState.player?.name || '나';
                      speakerColor = 'text-blue-600';
                      message = log.replace(/주인공\(.*?\)(은\(는\)|은|는|의|이|가)?\s*/, '');
                    } else if (log.includes('적 ') || (gameState.enemy && log.includes(gameState.enemy.name))) {
                      speaker = gameState.enemy?.name || '상대';
                      speakerColor = 'text-red-600';
                      message = log.replace(/적\s*/, '');
                      if (gameState.enemy) {
                        message = message.replace(new RegExp(`${gameState.enemy.name}(은\\(는\\)|은|는|의|이|가)?\\s*`), '');
                      }
                    } else {
                      speaker = '시스템';
                      speakerColor = 'text-gray-600';
                    }
                  }

                  return (
                    <div key={i} className={`mb-3 leading-snug ${isImportant ? 'log-important' : ''}`}>
                      {isSystem ? (
                        <div className="text-gray-500 text-center italic text-[11px] py-1 border-y border-gray-100 my-1 bg-gray-50">
                          {log}
                        </div>
                      ) : (
                        <div>
                          {speaker && (
                            <div className="mb-0.5 font-sans">
                              <span className={`font-bold ${speakerColor} text-xs`}>{speaker}</span>
                              <span className="text-gray-500 text-[11px] ml-1">말함:</span>
                            </div>
                          )}
                          <div className={`ml-3 text-xs ${message.includes('피해') ? 'text-red-600 font-bold' : 'text-black'}`}>
                            {message}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
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
                   <button onClick={() => handleAction('EXPLORE')} className="win98-button flex-1 font-bold text-[10px] sm:text-xs px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                     탐험(상대찾기)
                   </button>
                   
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

