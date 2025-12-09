
import React, { useState } from 'react';
import TracingGame from './components/TracingGame';
import WordMatchGame from './components/WordMatchGame';
import { ICONS } from './constants';

const App = () => {
  const [activeGame, setActiveGame] = useState<'tracing' | 'matching' | null>(null);

  // If a game is selected, render it
  if (activeGame === 'tracing') {
    return <TracingGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'matching') {
    return <WordMatchGame onBack={() => setActiveGame(null)} />;
  }

  // Otherwise, render the launcher (Home Screen)
  return (
    <div className="h-full w-full bg-sky-50 overflow-hidden flex flex-col p-6 safe-area">
      {/* Header */}
      <header className="flex-none pt-4 pb-8 flex flex-col items-center gap-2">
        <div className="p-4 bg-white rounded-full shadow-lg mb-2 animate-bounce">
           <span className="text-4xl">🎮</span>
        </div>
        <h1 className="text-4xl font-hand font-bold text-slate-700 tracking-wide text-center">
          Tiny Games
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
          Choose a Game
        </p>
      </header>

      {/* Game Grid */}
      <main className="flex-1 overflow-y-auto w-full mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center content-center h-full gap-6 pb-20">
          
          {/* Slot 1: Tracing Game */}
          <button 
            onClick={() => setActiveGame('tracing')}
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all active:scale-95 border-b-8 border-crayon-blue/20 overflow-hidden flex flex-col items-center justify-center gap-3 p-4 w-40 h-48"
          >
             <div className="w-full h-full absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             <div className="relative z-10 p-4 bg-crayon-blue/10 rounded-full group-hover:scale-110 transition-transform duration-300">
               <ICONS.Pencil size={32} className="text-crayon-blue" />
             </div>
             <div className="relative z-10 text-center">
               <h3 className="font-hand font-bold text-xl text-slate-700">Tracing</h3>
               <span className="text-[10px] font-bold text-crayon-blue uppercase tracking-wider">Play Now</span>
             </div>
          </button>

          {/* Slot 2: Word Match Game */}
          <button 
            onClick={() => setActiveGame('matching')}
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all active:scale-95 border-b-8 border-orange-200 overflow-hidden flex flex-col items-center justify-center gap-3 p-4 w-40 h-48"
          >
             <div className="w-full h-full absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             <div className="relative z-10 p-4 bg-orange-100 rounded-full group-hover:scale-110 transition-transform duration-300">
               <ICONS.Puzzle size={32} className="text-orange-400" />
             </div>
             <div className="relative z-10 text-center">
               <h3 className="font-hand font-bold text-xl text-slate-700">Matching</h3>
               <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Play Now</span>
             </div>
          </button>

          {/* Slot 3: Coming Soon */}
          <div className="bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 p-4 w-40 h-48 opacity-60">
             <div className="p-4 bg-slate-200 rounded-full">
               <ICONS.Game size={32} className="text-slate-400" />
             </div>
             <div className="text-center">
               <h3 className="font-hand font-bold text-lg text-slate-400">Arcade</h3>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coming Soon</span>
             </div>
          </div>

           {/* Slot 4: Coming Soon */}
          <div className="bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 p-4 w-40 h-48 opacity-60">
             <div className="p-4 bg-slate-200 rounded-full">
               <ICONS.Music size={32} className="text-slate-400" />
             </div>
             <div className="text-center">
               <h3 className="font-hand font-bold text-lg text-slate-400">Music</h3>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coming Soon</span>
             </div>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="flex-none py-4 text-center">
        <p className="text-slate-300 text-xs font-bold">TinyTracer v1.1</p>
      </footer>
    </div>
  );
};

export default App;
