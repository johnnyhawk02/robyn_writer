
import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../constants';
import { INITIAL_WORDS } from '../data/words';
import { TracingWord } from '../types';

const STORAGE_KEY = 'tinytracer_custom_words';

interface WordMatchGameProps {
  onBack: () => void;
}

interface GameRound {
  target: TracingWord;
  options: TracingWord[];
}

const WordMatchGame: React.FC<WordMatchGameProps> = ({ onBack }) => {
  const [words, setWords] = useState<TracingWord[]>([]);
  const [round, setRound] = useState<GameRound | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- Game Logic ---
  const generateRound = useCallback((wordPool: TracingWord[]) => {
    if (!wordPool || wordPool.length < 3) {
      setError("Not enough words to play! Need at least 3.");
      return;
    }

    // 1. Pick a random target
    const targetIndex = Math.floor(Math.random() * wordPool.length);
    const target = wordPool[targetIndex];

    // 2. Pick 2 unique distractors
    // Create a copy to splice from
    const pool = [...wordPool];
    pool.splice(targetIndex, 1); // Remove target

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    // Take first 2
    const options = [target, pool[0], pool[1]];

    // 3. Shuffle options for display
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    setRound({ target, options });
    setSelectedId(null);
    setIsCorrect(null);
  }, []);

  // --- Initialization ---
  useEffect(() => {
    const savedCustom = localStorage.getItem(STORAGE_KEY);
    let customWords: TracingWord[] = [];
    if (savedCustom) {
      try {
        customWords = JSON.parse(savedCustom);
      } catch (e) {
        console.error("Failed to load custom words", e);
      }
    }
    const allWords = [...INITIAL_WORDS, ...customWords];
    setWords(allWords);
    generateRound(allWords);
  }, [generateRound]);

  const handleOptionClick = (word: TracingWord) => {
    if (isCorrect === true) return; 

    setSelectedId(word.text);

    if (word.text === round?.target.text) {
      // Correct!
      setIsCorrect(true);
      setStreak(s => s + 1);
      
      setTimeout(() => {
        generateRound(words);
      }, 1500);
    } else {
      // Wrong!
      setIsCorrect(false);
      setStreak(0);
      
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedId(null);
      }, 800);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
        <p>{error}</p>
        <button onClick={onBack} className="bg-slate-200 px-4 py-2 rounded-lg text-slate-700">Go Back</button>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
        Loading...
      </div>
    );
  }

  // Consistent back button style
  const backBtnClass = "p-3 rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center";

  return (
    <div className="relative h-full w-full bg-orange-50 overflow-hidden flex flex-col safe-area">
      <style>{`
        @keyframes bounce-success {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-30px) scale(1.1);}
          60% {transform: translateY(-15px) scale(1.05);}
        }
        @keyframes shake-error {
          0%, 100% {transform: translateX(0);}
          10%, 30%, 50%, 70%, 90% {transform: translateX(-10px);}
          20%, 40%, 60%, 80% {transform: translateX(10px);}
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-success { animation: bounce-success 1s ease infinite; }
        .animate-error { animation: shake-error 0.5s ease-in-out; }
        .animate-pop { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* --- Header --- */}
      <header className="flex-none p-4 flex justify-between items-center z-10">
        <button 
          onClick={onBack}
          className={backBtnClass}
        >
          <ICONS.Home size={24} />
        </button>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
           <ICONS.Trophy size={20} className="text-yellow-500" />
           <span className="font-bold text-slate-700 font-hand text-xl">{streak}</span>
        </div>
      </header>

      {/* --- Main Game Area --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full gap-8">
        
        {/* Target Image */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-[30vh]">
           <div className={`relative transition-transform duration-500 ${isCorrect ? 'scale-110' : 'scale-100'}`}>
              {/* Image Container */}
              <div className="p-8 bg-white rounded-3xl shadow-xl border-8 border-white transform rotate-1">
                 {round.target.imageUrl ? (
                    <img 
                      src={round.target.imageUrl} 
                      alt="Guess this"
                      className="max-h-[35vh] w-auto object-contain rounded-lg select-none"
                    />
                 ) : (
                    <div className="text-[15vh] leading-none select-none">
                       {round.target.emoji || '❓'}
                    </div>
                 )}
              </div>
              
              {/* Success Particles */}
              {isCorrect && (
                 <>
                   <div className="absolute -top-10 -left-10 text-4xl animate-pop" style={{animationDelay: '0.1s'}}>⭐</div>
                   <div className="absolute -top-12 right-0 text-5xl animate-pop" style={{animationDelay: '0.2s'}}>🌟</div>
                   <div className="absolute bottom-10 -right-12 text-4xl animate-pop" style={{animationDelay: '0.3s'}}>✨</div>
                 </>
              )}
           </div>
        </div>

        {/* Answer Options */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
          {round.options.map((word, idx) => {
             const isSelected = selectedId === word.text;
             const isTarget = word.text === round.target.text;
             
             // Determine class based on state
             let btnClass = "relative bg-white border-b-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 active:border-b-0 active:translate-y-2"; // Default
             
             if (isSelected) {
               if (isCorrect && isTarget) {
                 btnClass = "bg-green-100 border-b-8 border-green-300 text-green-700 ring-4 ring-green-200 animate-success z-10";
               } else if (isCorrect === false) {
                 btnClass = "bg-red-50 border-b-8 border-red-200 text-red-500 animate-error";
               }
             } else if (isCorrect && isTarget) {
                 // Show the correct answer if they missed it? 
                 // Currently we just wait for retry, but we can dim others.
                 btnClass += " opacity-50"; 
             }

             return (
               <button
                 key={`${word.text}-${idx}`}
                 onClick={() => handleOptionClick(word)}
                 className={`
                    h-24 md:h-32 rounded-2xl shadow-lg transition-all duration-200
                    flex items-center justify-center
                    ${btnClass}
                 `}
               >
                 <span className="text-4xl md:text-5xl font-hand font-bold tracking-wide">
                   {word.text}
                 </span>
               </button>
             );
          })}
        </div>

      </main>

    </div>
  );
};

export default WordMatchGame;
