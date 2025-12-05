
import React, { useState, useRef } from 'react';
import TraceCanvas, { TraceCanvasHandle } from './components/TraceCanvas';
import { INITIAL_WORDS, PALETTE, ICONS } from './constants';
import { TracingWord, BrushColor } from './types';
import { calculateScore } from './services/scoringService';

const App: React.FC = () => {
  // State
  const [words, setWords] = useState<TracingWord[]>(INITIAL_WORDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [brushColor, setBrushColor] = useState<string>(BrushColor.Black);
  const [isEraserMode, setIsEraserMode] = useState(false);
  
  // Scoring State
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [score, setScore] = useState(0);

  // Refs
  const canvasRef = useRef<TraceCanvasHandle>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const currentWord = words[currentIndex];

  // Handlers
  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setShowScoreModal(false);
  };

  const handleNext = () => {
    handleClear();
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    handleClear();
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const toggleEraser = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handleCheckScore = () => {
    const canvas = canvasRef.current?.getCanvas();
    const textElement = textRef.current;
    
    if (canvas && textElement) {
      const result = calculateScore(canvas, currentWord.text, textElement);
      setScore(result);
      setShowScoreModal(true);
    }
  };

  // Determine active color for canvas
  const activeColor = isEraserMode ? '#F8FAFC' : brushColor;
  const activeLineWidth = isEraserMode ? 40 : 16; 

  // Helpers for Score Display
  const getStars = (s: number) => {
    if (s >= 90) return '⭐⭐⭐';
    if (s >= 70) return '⭐⭐';
    return '⭐';
  };
  
  const getMessage = (s: number) => {
    if (s >= 90) return 'Perfect!';
    if (s >= 70) return 'Great Job!';
    if (s >= 50) return 'Good Try!';
    return 'Keep Going!';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 select-none">
      
      {/* --- Top Bar: Navigation --- */}
      {/* Added pt-safe to avoid the notch/status bar on iPad */}
      <header className="flex-none p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center bg-white shadow-sm z-20">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-transform"
          aria-label="Previous Word"
        >
          <ICONS.Prev size={32} className="text-slate-600" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">
            {currentWord.category}
          </span>
          <div className="flex gap-1">
            {words.map((_, idx) => (
               <div 
                 key={idx} 
                 className={`h-2 w-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-crayon-blue' : 'bg-slate-200'}`}
               />
            ))}
          </div>
        </div>

        <button 
          onClick={handleNext}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-transform"
          aria-label="Next Word"
        >
          <ICONS.Next size={32} className="text-slate-600" />
        </button>
      </header>

      {/* --- Main Drawing Area --- */}
      <main className="flex-1 relative w-full flex items-center justify-center overflow-hidden touch-none">
        
        {/* The Template Text (Background) */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span 
            ref={textRef}
            className="text-[20vh] sm:text-[30vh] text-gray-200 tracking-widest leading-none text-center"
            style={{ fontFamily: '"Schoolbell", cursive' }}
          >
            {currentWord.text}
          </span>
        </div>

        {/* The Drawing Layer (Foreground) */}
        <div className="relative w-full h-full">
           <TraceCanvas 
             ref={canvasRef} 
             color={activeColor} 
             lineWidth={activeLineWidth} 
           />
        </div>
        
        {/* Score Modal / Overlay */}
        {showScoreModal && (
          <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 transform scale-110">
              <div className="text-6xl animate-bounce">{getStars(score)}</div>
              <div className="text-crayon-blue font-black text-5xl">{score}%</div>
              <div className="text-slate-500 text-xl font-bold">{getMessage(score)}</div>
              <button 
                onClick={() => setShowScoreModal(false)}
                className="mt-4 px-8 py-3 bg-crayon-green text-white rounded-xl font-bold text-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      </main>

      {/* --- Bottom Bar: Controls --- */}
      {/* Added pb-[env(safe-area-inset-bottom)] for home indicator space */}
      <footer className="flex-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          
          {/* Action Row */}
          <div className="flex justify-between items-center px-2">
            
            {/* Left Group */}
            <div className="flex gap-2">
               <button
                onClick={toggleEraser}
                className={`p-4 rounded-2xl flex items-center gap-2 transition-all ${isEraserMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-slate-600'}`}
              >
                <ICONS.Eraser size={24} />
                <span className="font-bold text-sm hidden sm:inline">Eraser</span>
              </button>
              
               <button
                onClick={handleClear}
                className="p-4 rounded-2xl bg-red-100 text-red-500 hover:bg-red-200 active:scale-95 transition-all flex items-center gap-2"
              >
                <ICONS.Trash size={24} />
              </button>
            </div>

            {/* Check Score Button (Center/Right Prominent) */}
            <button
              onClick={handleCheckScore}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-crayon-yellow to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <ICONS.Trophy size={28} className="fill-white" />
              <span className="font-bold text-lg">Check!</span>
            </button>

          </div>

          {/* Color Palette */}
          <div className="flex justify-between items-center bg-slate-100 rounded-3xl p-2 gap-2 overflow-x-auto no-scrollbar">
            {PALETTE.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setBrushColor(p.color);
                  setIsEraserMode(false);
                }}
                className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 transition-transform duration-200 ${
                  brushColor === p.color && !isEraserMode
                    ? 'scale-110 border-slate-400 shadow-md' 
                    : 'border-white scale-100'
                }`}
                style={{ backgroundColor: p.color }}
                aria-label={`Select ${p.name}`}
              />
            ))}
          </div>

        </div>
      </footer>

    </div>
  );
};

export default App;
