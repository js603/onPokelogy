import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface Pokemon {
  id: string;
  identifier: string;
  name: string;
  encountered?: boolean;
}

interface FlavorText {
  flavor_text: string;
  language: { name: string };
  version: { name: string };
}

export function Pokedex({ onClose }: { onClose: () => void }) {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [flavorTexts, setFlavorTexts] = useState<{version: string, text: string}[]>([]);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    fetch('/api/pokedex')
      .then(res => res.json())
      .then(data => setPokemonList(data))
      .catch(console.error);
  }, []);

  const handleSelect = async (pokemon: Pokemon) => {
    if (!pokemon.encountered) return;
    setSelectedPokemon(pokemon);
    setLoadingText(true);
    setFlavorTexts([]);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}/`);
      const data = await res.json();
      
      const koTexts: {version: string, text: string}[] = [];
      const seen = new Set<string>();
      
      data.flavor_text_entries.forEach((entry: FlavorText) => {
        if (entry.language.name === 'ko') {
           const cleanText = entry.flavor_text.replace(/[\n\f\r]/g, ' ');
           if (!seen.has(cleanText)) {
             seen.add(cleanText);
             koTexts.push({ version: entry.version.name, text: cleanText });
           }
        }
      });
      setFlavorTexts(koTexts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingText(false);
    }
  };

  const filteredList = pokemonList.filter(p => 
    p.encountered && ((p.name && p.name.includes(searchTerm)) || p.id.toString() === searchTerm || p.identifier.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white win98-window flex flex-col w-full max-w-4xl max-h-[90vh]">
        <div className="win98-titlebar flex justify-between items-center p-1">
          <span className="font-bold text-sm ml-1 text-white">포켓몬 도감</span>
          <button onClick={onClose} className="win98-button p-0 h-5 w-5 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0 bg-[#c0c0c0]">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="포켓몬 이름 또는 번호 검색..." 
                className="w-full pl-8 pr-2 py-1 border border-gray-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] bg-white text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white border-2 border-gray-500 shadow-[inset_2px_2px_2px_rgba(0,0,0,0.5)] p-2 sm:p-4">
            <div className="grid grid-cols-4 gap-2">
              {filteredList.length > 0 ? filteredList.map(pokemon => (
                <div 
                  key={pokemon.id} 
                  className="win98-button flex flex-col items-center p-1 sm:p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSelect(pokemon)}
                >
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 w-full text-left font-mono">
                    #{String(pokemon.id).padStart(4, '0')}
                  </div>
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`} 
                    alt={pokemon.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 pixelated"
                    loading="lazy"
                  />
                  <div className="text-[10px] sm:text-xs font-bold mt-1 text-center truncate w-full">
                    {pokemon.name || pokemon.identifier}
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  아직 만난 포켓몬이 없습니다.<br />
                  (탐색을 통해 포켓몬을 만나보세요!)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPokemon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
           <div className="bg-[#c0c0c0] win98-window flex flex-col w-full max-w-md max-h-[80vh]">
             <div className="win98-titlebar flex justify-between items-center p-1">
                <span className="font-bold text-sm ml-1 text-white">{selectedPokemon.name} 정보</span>
                <button onClick={() => setSelectedPokemon(null)} className="win98-button p-0 h-5 w-5 flex items-center justify-center">
                  <X size={14} />
                </button>
             </div>
             <div className="p-4 flex flex-col items-center gap-4 flex-1 min-h-0 overflow-y-auto">
                <img 
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`} 
                  alt={selectedPokemon.name}
                  className="w-32 h-32 pixelated bg-white border border-gray-400 p-2 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]"
                />
                <div className="text-lg font-bold">
                  No.{String(selectedPokemon.id).padStart(4, '0')} {selectedPokemon.name}
                </div>
                
                <div className="w-full bg-white border border-gray-500 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] p-3 overflow-y-auto h-64 text-sm whitespace-pre-wrap leading-relaxed">
                  {loadingText ? (
                    <div className="text-center text-gray-500 py-4">설명 정보를 불러오는 중...</div>
                  ) : flavorTexts.length > 0 ? (
                    flavorTexts.map((ft, i) => (
                      <div key={i} className="mb-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
                         {/*<div className="text-xs text-gray-400 font-mono mb-1">[{ft.version}]</div>*/}
                         <div>{ft.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">한국어 설명이 없습니다.</div>
                  )}
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
