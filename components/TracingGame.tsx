
import React, { useState, useRef, useEffect, useCallback } from 'react';
import TraceCanvas, { TraceCanvasHandle } from './TraceCanvas';
import { ICONS } from '../constants';
import { INITIAL_WORDS } from '../data/words';
import { TracingWord, BrushColor } from '../types';
import { calculateScore } from '../services/scoringService';

const STORAGE_KEY = 'tinytracer_custom_words';
const BG_STORAGE_KEY = 'tinytracer_bg_color';
const FONT_STORAGE_KEY = 'tinytracer_font';

// More vibrant palette + White/Grey defaults
const PRESET_COLORS = [
  '#FFFFFF', // White
  '#F1F5F9', // Slate
  '#FECACA', // Red 200
  '#FED7AA', // Orange 200
  '#FEF08A', // Yellow 200
  '#BBF7D0', // Green 200
  '#BAE6FD', // Sky 200
  '#BFDBFE', // Blue 200
  '#DDD6FE', // Violet 200
  '#F5D0FE', // Fuchsia 200
  '#FBCFE8', // Pink 200
];

const FONTS = [
  { name: 'Andika', label: 'School', family: '"Andika", sans-serif' },
  { name: 'Fredoka', label: 'Bubbly', family: '"Fredoka", sans-serif' },
  { name: 'Comic Neue', label: 'Friendly', family: '"Comic Neue", cursive' },
  { name: 'Patrick Hand', label: 'Marker', family: '"Patrick Hand", cursive' },
];

interface Balloon {
  id: number;
  x: number;
  color: string;
  speed: number;
  delay: number;
  scale: number;
  rotation: number;
  isPopping?: boolean;
}

interface TracingGameProps {
  onBack: () => void;
}

const TracingGame: React.FC<TracingGameProps> = ({ onBack }) => {
  // --- State ---
  const [words, setWords] = useState<TracingWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const brushColor = BrushColor.Black;
  
  // Appearance
  const [bgColor, setBgColor] = useState(PRESET_COLORS[1]);
  const [currentFont, setCurrentFont] = useState(FONTS[0].family);
  const [showBgPicker, setShowBgPicker] = useState(false); // Renamed in UI to "Settings"
  const [settingsTab, setSettingsTab] = useState<'color' | 'font'>('color');

  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newWordText, setNewWordText] = useState('');
  
  // Image Input State
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');
  const [newWordImage, setNewWordImage] = useState<string | null>(null); // For base64 uploads
  const [pastedUrl, setPastedUrl] = useState(''); // For external URLs
  const [isCompressing, setIsCompressing] = useState(false);

  // Image Loading State
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // PWA Install Prompt State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOSBrowser, setIsIOSBrowser] = useState(false);

  // Refs
  const canvasRef = useRef<TraceCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // DOM Refs for Scoring
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization ---
  useEffect(() => {
    loadWords();
    loadSettings();
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isStandalone = 
      ('standalone' in window.navigator && (window.navigator as any).standalone) || 
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    setIsIOSBrowser(isIOS && !isStandalone);
  }, []);

  const loadWords = () => {
    const savedCustom = localStorage.getItem(STORAGE_KEY);
    let customWords: TracingWord[] = [];
    if (savedCustom) {
      try {
        customWords = JSON.parse(savedCustom);
      } catch (e) {
        console.error("Failed to load custom words", e);
      }
    }
    setWords([...INITIAL_WORDS, ...customWords]);
  };

  const loadSettings = () => {
    const savedBg = localStorage.getItem(BG_STORAGE_KEY);
    if (savedBg) setBgColor(savedBg);
    
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
    if (savedFont) setCurrentFont(savedFont);
  };

  const handleSetBgColor = (color: string) => {
    setBgColor(color);
    localStorage.setItem(BG_STORAGE_KEY, color);
  };

  const handleSetFont = (fontFamily: string) => {
    setCurrentFont(fontFamily);
    localStorage.setItem(FONT_STORAGE_KEY, fontFamily);
  };

  const handleOpenSettings = (tab: 'color' | 'font') => {
    setSettingsTab(tab);
    setShowBgPicker(true);
  };

  const handleSetImageInputMethod = (method: 'upload' | 'url') => {
    setImageInputMethod(method);
  }

  const currentWord = words[currentIndex] || INITIAL_WORDS[0];

  // Reset state on word change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setShowCelebration(false);
    setBalloons([]);
    letterRefs.current = []; // Reset refs
  }, [currentIndex]);

  // Spawn Balloons on Celebration
  useEffect(() => {
    if (showCelebration) {
      const colors = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EC4899'];
      const newBalloons: Balloon[] = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 80 + 10, // 10% to 90%
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 5 + 10, // Slower: 10-15 seconds
        delay: Math.random() * 3, // Staggered start
        scale: Math.random() * 0.3 + 0.9, // Large balloons
        rotation: 0, 
        isPopping: false
      }));
      setBalloons(newBalloons);
    }
  }, [showCelebration]);

  const popBalloon = (id: number) => {
    // 1. Mark as popping to trigger animation
    setBalloons(prev => prev.map(b => 
      b.id === id ? { ...b, isPopping: true } : b
    ));

    // 2. Haptic
    if (navigator.vibrate) navigator.vibrate(50);

    // 3. Remove after animation finishes (300ms matches CSS)
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== id));
    }, 300);
  };

  // --- Robust Image Loading Logic ---
  useEffect(() => {
    setImgError(false);
    
    if (currentWord.imageUrl) {
      setIsImageLoading(true);
      if (currentWord.imageUrl.startsWith('data:')) {
        setImageSrc(currentWord.imageUrl);
      } 
      else if (currentWord.imageUrl.startsWith('http')) {
        let url = currentWord.imageUrl;
        if (url.includes('github.com') && url.includes('/blob/')) {
           url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        setImageSrc(url);
      }
      else {
        // Handle local assets - prioritize absolute path /assets/
        const filename = currentWord.imageUrl.split('/').pop();
        const finalPath = `/assets/${filename}`;
        setImageSrc(finalPath);
      }
    } else {
      setImageSrc(null);
      setIsImageLoading(false);
    }
  }, [currentWord, currentIndex]);

  const handleImageError = () => {
    if (!imageSrc) return;
    
    // Fallback logic: if /assets/ fails, try ./assets/ as a backup, otherwise fail
    if (imageSrc.startsWith('/assets/')) {
       const relativePath = `.${imageSrc}`;
       // If we haven't tried relative yet, try it
       setImageSrc(relativePath);
       return;
    }

    // If we are already on http or relative failed, show error
    setImgError(true);
    setIsImageLoading(false);
  };

  // --- Handlers: Canvas ---
  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const handleNext = () => {
    handleClear();
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    handleClear();
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  // --- Drawing & Score Detection ---
  const handleDraw = useCallback((x: number, y: number) => {
    // No-op for now, we check score on lift
  }, []);

  const handleStrokeEnd = useCallback(() => {
    if (showCelebration || timerRef.current) return;

    // Check accuracy using ink density analysis
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Filter out null refs just in case
    const validSpans = letterRefs.current.filter(Boolean);
    
    // Calculate score (Percentage of letters filled)
    const score = calculateScore(canvas, validSpans);
    
    // Require 100% of letters to be "attempted"
    if (score === 100) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          setShowCelebration(true);
        }, 500); 
      }
    }
  }, [showCelebration]);

  // --- Handlers: Upload with Compression ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1024; 
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); 
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setNewWordImage(compressedBase64);
      } catch (error) {
        alert("Sorry, there was an issue processing that image.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const saveNewWord = () => {
    if (!newWordText.trim()) return;
    const finalImage = imageInputMethod === 'upload' ? newWordImage : pastedUrl;
    const newWord: TracingWord = {
      id: Date.now().toString(),
      text: newWordText.toLowerCase(),
      // Removed category assignment
      imageUrl: finalImage || undefined,
      emoji: !finalImage ? '📝' : undefined
    };

    const savedCustom = localStorage.getItem(STORAGE_KEY);
    const existingCustom = savedCustom ? JSON.parse(savedCustom) : [];
    const updatedCustom = [...existingCustom, newWord];
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
      loadWords();
      setNewWordText('');
      setNewWordImage(null);
      setPastedUrl('');
      setShowUploadModal(false);
      
      const newTotalLength = INITIAL_WORDS.length + updatedCustom.length;
      handleClear();
      setCurrentIndex(newTotalLength - 1);
    } catch (e) {
      alert("Storage full! Please delete some custom words or use the 'Paste Link' option instead.");
    }
  };

  // --- Styles ---
  const activeColor = brushColor;
  const activeLineWidth = 16; 
  const floatBtnClass = "p-3 rounded-full bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white active:scale-95 transition-all z-50 flex items-center justify-center";
  
  // New larger button class for Prev/Next
  const navBtnClass = "p-8 rounded-full bg-white/60 hover:bg-white/90 shadow-xl backdrop-blur-md active:scale-95 transition-all text-slate-600 border-2 border-white/50";
  // Highlight next button when celebration is active
  const nextBtnClass = showCelebration 
    ? `${navBtnClass} ring-4 ring-crayon-green/50 scale-110 bg-green-50 animate-pulse` 
    : navBtnClass;

  if (!currentWord) return null;

  return (
    <div 
      className="relative h-full w-full select-none overflow-hidden touch-none transition-colors duration-500"
      style={{ 
        backgroundColor: showCelebration ? undefined : bgColor,
        animation: showCelebration ? 'partyCycle 3s linear infinite' : 'none'
      }}
    >
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(110vh) scale(var(--scale)); opacity: 1; }
          100% { transform: translateY(-120vh) scale(var(--scale)); opacity: 1; }
        }
        @keyframes sway {
          0% { transform: translateX(-15px) rotate(-6deg); }
          100% { transform: translateX(15px) rotate(6deg); }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes partyCycle {
          0% { background-color: #FECACA; }
          25% { background-color: #BBF7D0; }
          50% { background-color: #BFDBFE; }
          75% { background-color: #F5D0FE; }
          100% { background-color: #FECACA; }
        }
        @keyframes balloonPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-balloon-pulse {
          animation: balloonPulse 2s ease-in-out infinite;
        }
        .animate-pop {
          animation: pop 0.3s ease-out forwards !important;
        }
      `}</style>
      
      {/* Loading Overlay - blocks interaction and hides unready content */}
      {isImageLoading && (
        <div className="absolute inset-0 z-[100] bg-slate-50 flex items-center justify-center transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4 animate-pulse">
             <ICONS.Pencil size={64} className="text-crayon-blue animate-bounce" />
          </div>
        </div>
      )}

      {/* --- Floating UI Controls Layer --- */}
      <div className="absolute inset-0 z-50 pointer-events-none p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col justify-between">
          
          {/* Top Row */}
          <div className="flex justify-between items-start pointer-events-auto">
              
              {/* Left Group: Settings & Add */}
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={onBack}
                   className="p-3 rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
                   aria-label="Back to Home"
                 >
                   <ICONS.Home size={24} />
                 </button>
                 <div className="h-px w-8 bg-black/10 mx-auto my-1" />
                 <button 
                   onClick={() => handleOpenSettings('color')}
                   className={floatBtnClass}
                   aria-label="Colors"
                 >
                   <ICONS.Palette size={24} className="text-slate-600" />
                 </button>
                 <button 
                   onClick={() => handleOpenSettings('font')}
                   className={floatBtnClass}
                   aria-label="Fonts"
                 >
                   <ICONS.Type size={24} className="text-slate-600" />
                 </button>
                 <button 
                   onClick={() => setShowUploadModal(true)}
                   className={floatBtnClass}
                   aria-label="Add Word"
                 >
                   <ICONS.Plus size={24} className="text-crayon-blue" />
                 </button>
                 {isIOSBrowser && (
                   <button onClick={() => setShowInstallModal(true)} className={floatBtnClass} aria-label="Install App">
                     <ICONS.Download size={24} className="text-slate-600" />
                   </button>
                 )}
              </div>

              {/* Center Group: Pagination Dots Only (Category Removed) */}
              <div className="flex flex-col items-center pt-2 opacity-60">
                 <div className="flex gap-1">
                    {words.map((_, idx) => (
                       <div 
                         key={idx} 
                         className={`h-2 w-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-black/50' : 'bg-black/10'}`}
                       />
                    ))}
                </div>
              </div>

              {/* Right Group: Tools */}
              <div className="flex flex-col gap-3 items-end">
                 <button
                    onClick={handleClear}
                    className={`${floatBtnClass} text-red-500`}
                    aria-label="Clear Canvas"
                  >
                    <ICONS.Trash size={24} />
                  </button>
              </div>
          </div>

          {/* Navigation Arrows (Vertically Centered) */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 pointer-events-auto">
             <button 
                onClick={handlePrev}
                className={navBtnClass}
                aria-label="Previous Word"
              >
                <ICONS.Prev size={64} />
              </button>
          </div>
          
          <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-auto">
             <button 
                onClick={handleNext}
                className={nextBtnClass}
                aria-label="Next Word"
              >
                <ICONS.Next size={64} />
              </button>
          </div>

      </div>

      {/* --- Main Content Area (Background Layer) --- */}
      <main className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-0">
        
        {/* Top Half: Image */}
        <div className="flex-1 w-full flex items-end justify-center pb-4 sm:pb-8 px-2">
             {currentWord.imageUrl && !imgError && imageSrc ? (
                <img 
                  key={imageSrc} 
                  src={imageSrc} 
                  onLoad={() => setIsImageLoading(false)}
                  onError={handleImageError}
                  alt={currentWord.text} 
                  className="h-[38vh] sm:h-[45vh] w-auto max-w-[95vw] translate-y-[20%] object-contain animate-in zoom-in-95 duration-700 drop-shadow-md select-none pointer-events-none" 
                />
              ) : (
                <div className="flex items-center justify-center opacity-30 translate-y-[20%]">
                  <span className="text-[25vh] leading-none mix-blend-multiply text-black/20 select-none pointer-events-none">
                    {currentWord.emoji || '🎨'}
                  </span>
                </div>
              )}
        </div>

        {/* Bottom Half: Text (Split into Spans for Hit Testing) */}
        {/* Reduced top padding (pt-2 sm:pt-4) to raise text up for tails support */}
        <div className="flex-1 w-full flex items-start justify-center pt-2 sm:pt-4 pb-10">
            <div 
              className="tracking-widest leading-none text-center whitespace-nowrap select-none pointer-events-none flex items-center justify-center"
              style={{ fontFamily: currentFont }}
            >
              {currentWord.text.split('').map((char, index) => (
                <span
                  key={index}
                  ref={(el) => { letterRefs.current[index] = el; }}
                  className="inline-block text-[30vh] sm:text-[38vh] text-black/15 mix-blend-multiply"
                >
                  {char}
                </span>
              ))}
            </div>
        </div>

      </main>

      {/* --- Drawing Canvas (Top Layer) --- */}
      <TraceCanvas 
           ref={canvasRef} 
           color={activeColor} 
           lineWidth={activeLineWidth}
           onDraw={handleDraw}
           onStrokeEnd={handleStrokeEnd}
      />
      
      {/* Celebration Layer (Balloons) - Confetti Removed */}
      {showCelebration && (
        <div className="absolute inset-0 z-[80] pointer-events-none overflow-hidden">
          
          {/* Poppable Balloons */}
          {balloons.map((b) => (
             <div
               key={b.id}
               onClick={() => popBalloon(b.id)}
               className="absolute bottom-[-20%] pointer-events-auto cursor-pointer"
               style={{
                 left: `${b.x}%`,
                 width: '100px',
                 height: '120px',
                 animation: `floatUp ${b.speed}s linear ${b.delay}s forwards`,
                 '--scale': b.scale,
               } as React.CSSProperties}
             >
                {/* Sway Wrapper for Wobble Effect */}
                <div style={{ animation: `sway ${Math.random() * 2 + 3}s ease-in-out infinite alternate` }}>
                    {/* Independent Pulse Animation Wrapper */}
                    <div className={`w-full h-full origin-bottom ${b.isPopping ? 'animate-pop' : 'animate-balloon-pulse'}`}>
                      {/* CSS Balloon Shape */}
                      <div 
                         className="w-[80px] h-[95px] rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] shadow-inner transition-transform active:scale-150 active:opacity-0"
                         style={{ 
                            backgroundColor: b.color,
                            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), 2px 2px 5px rgba(0,0,0,0.2)'
                         }}
                      >
                         {/* Shine */}
                         <div className="absolute top-[15%] left-[20%] w-[15px] h-[25px] bg-white/30 rounded-[50%] rotate-[-30deg]" />
                      </div>
                      {/* Knot */}
                      <div 
                         className="absolute bottom-[24px] left-[40px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
                         style={{ borderBottomColor: b.color }}
                      />
                      {/* String */}
                      <div className="absolute bottom-0 left-[40px] -translate-x-1/2 w-[1px] h-[25px] bg-slate-400/50" />
                    </div>
                </div>
             </div>
          ))}

        </div>
      )}

      {/* Settings Modal (Colors & Fonts) */}
      {showBgPicker && (
        <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-700 font-hand">Appearance</h2>
               <button onClick={() => setShowBgPicker(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                 <ICONS.Close size={20} />
               </button>
             </div>
             
             {/* Tabbed content or scroll to section based on what button was clicked */}
             <div className="space-y-8">
               
               {/* Colors Section */}
               <div ref={settingsTab === 'color' ? (el) => el?.scrollIntoView({ behavior: 'smooth' }) : null}>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <ICONS.Palette size={16} /> Paper Color
                 </h3>
                 <div className="grid grid-cols-4 gap-4">
                   {PRESET_COLORS.map((hex) => (
                     <button
                       key={hex}
                       onClick={() => handleSetBgColor(hex)}
                       className={`w-full aspect-square rounded-full shadow-inner border-4 transition-transform active:scale-95 ${bgColor === hex ? 'border-crayon-blue scale-110' : 'border-transparent'}`}
                       style={{ backgroundColor: hex }}
                       aria-label={`Select background ${hex}`}
                     />
                   ))}
                   
                   {/* Custom Color Picker Button */}
                   <div className="relative w-full aspect-square rounded-full shadow-inner border-4 border-slate-100 overflow-hidden group">
                     <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => handleSetBgColor(e.target.value)}
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                      title="Choose custom color"
                     />
                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/20 group-hover:bg-transparent">
                        <ICONS.Palette size={20} className="text-slate-600 mix-blend-multiply" />
                     </div>
                   </div>
                 </div>
               </div>

               <div className="h-px bg-slate-100" />

               {/* Fonts Section */}
               <div ref={settingsTab === 'font' ? (el) => el?.scrollIntoView({ behavior: 'smooth' }) : null}>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <ICONS.Type size={16} /> Font Style
                 </h3>
                 <div className="grid grid-cols-1 gap-2">
                    {FONTS.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => handleSetFont(font.family)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${currentFont === font.family ? 'border-crayon-blue bg-blue-50 text-crayon-blue' : 'border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className="text-2xl" style={{ fontFamily: font.family }}>Aa</span>
                        <span className="font-bold text-sm opacity-70 font-sans">{font.label}</span>
                      </button>
                    ))}
                 </div>
               </div>

             </div>

           </div>
        </div>
      )}

      {/* Upload Modal (Add New Word) */}
      {showUploadModal && (
        <div className="absolute inset-0 z-[60] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-700 font-hand">Add New Word</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <ICONS.Close size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Method Toggles */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => handleSetImageInputMethod('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${imageInputMethod === 'upload' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Upload Photo
                </button>
                <button 
                  onClick={() => handleSetImageInputMethod('url')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${imageInputMethod === 'url' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Paste Link
                </button>
              </div>

              {/* Image Input Area */}
              <div className="h-48">
                {imageInputMethod === 'upload' ? (
                   <div 
                    onClick={() => !isCompressing && fileInputRef.current?.click()}
                    className={`h-full border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-crayon-blue transition-colors relative overflow-hidden group ${isCompressing ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isCompressing ? (
                       <div className="flex flex-col items-center text-slate-400 gap-2">
                          <span className="font-bold animate-pulse">Compressing...</span>
                       </div>
                    ) : newWordImage ? (
                      <img src={newWordImage} alt="Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 gap-2">
                        <ICONS.Image size={48} />
                        <span className="font-bold">Tap to add photo</span>
                      </div>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      disabled={isCompressing}
                    />
                    {newWordImage && !isCompressing && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold">Change Photo</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-2">
                     <input 
                        type="url" 
                        placeholder="https://postimg.cc/..."
                        value={pastedUrl}
                        onChange={(e) => setPastedUrl(e.target.value)}
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-crayon-blue outline-none font-sans text-sm text-slate-600"
                      />
                      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                         {pastedUrl ? (
                           <img src={pastedUrl} alt="Preview" className="max-w-full max-h-full object-contain" onError={(e) => (e.currentTarget.style.opacity = '0.3')} />
                         ) : (
                           <span className="text-slate-300 text-sm font-bold">Preview will appear here</span>
                         )}
                      </div>
                  </div>
                )}
              </div>

              {/* Word Input */}
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Word to Trace</label>
                <input 
                  type="text" 
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  placeholder="e.g. Daddy"
                  className="w-full p-4 text-3xl font-hand text-center border-2 border-slate-200 rounded-xl focus:border-crayon-blue focus:outline-none"
                  maxLength={10}
                />
              </div>

              <button 
                onClick={saveNewWord}
                disabled={!newWordText || isCompressing || (imageInputMethod === 'url' && !pastedUrl) || (imageInputMethod === 'upload' && !newWordImage)}
                className="w-full py-4 bg-crayon-blue text-white rounded-xl font-bold text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 active:scale-95 transition-all"
              >
                Save Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instruction Modal */}
      {showInstallModal && (
        <div className="absolute inset-0 z-[70] bg-slate-900/90 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-end">
              <button onClick={() => setShowInstallModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <ICONS.Close size={20} />
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
               <div className="p-4 bg-crayon-blue/10 rounded-full">
                 <ICONS.Download size={48} className="text-crayon-blue" />
               </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-hand">Install TinyTracer</h2>
            <p className="text-slate-500 mb-8">Get the full screen experience for your child!</p>

            <div className="space-y-6 text-left bg-slate-50 p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <ICONS.ShareIOS size={24} className="text-crayon-blue" />
                </div>
                <span className="font-bold text-slate-600">1. Tap the <span className="text-black">Share</span> button</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm">
                  <ICONS.Plus size={24} className="text-crayon-blue" />
                 </div>
                <span className="font-bold text-slate-600">2. Select <span className="text-black">Add to Home Screen</span></span>
              </div>
            </div>

            <button 
              onClick={() => setShowInstallModal(false)}
              className="mt-8 w-full py-3 bg-crayon-blue text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TracingGame;
