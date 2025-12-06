
import React, { useState, useRef, useEffect } from 'react';
import TraceCanvas, { TraceCanvasHandle } from './components/TraceCanvas';
import { INITIAL_WORDS, ICONS } from './constants';
import { TracingWord, BrushColor } from './types';
import { calculateScore } from './services/scoringService';

const STORAGE_KEY = 'tinytracer_custom_words';
const BG_STORAGE_KEY = 'tinytracer_bg_color';

// Safe pastel colors that ensure the grey tracing text remains visible
const BG_COLORS = [
  { hex: '#F8FAFC', name: 'Slate' }, // Default
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#FFF1F2', name: 'Rose' },
  { hex: '#FFF7ED', name: 'Peach' },
  { hex: '#FEFCE8', name: 'Lemon' },
  { hex: '#F0FDF4', name: 'Mint' },
  { hex: '#EFF6FF', name: 'Sky' },
  { hex: '#FAF5FF', name: 'Lavender' },
];

const App: React.FC = () => {
  // --- State ---
  const [words, setWords] = useState<TracingWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const brushColor = BrushColor.Black;
  const [isEraserMode, setIsEraserMode] = useState(false);
  
  // Appearance
  const [bgColor, setBgColor] = useState(BG_COLORS[0].hex);
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Scoring
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [score, setScore] = useState(0);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newWordText, setNewWordText] = useState('');
  const [newWordImage, setNewWordImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Image Loading State
  const [imgError, setImgError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // PWA Install Prompt State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOSBrowser, setIsIOSBrowser] = useState(false);

  // Refs
  const canvasRef = useRef<TraceCanvasHandle>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (savedBg) {
      setBgColor(savedBg);
    }
  };

  const handleSetBgColor = (color: string) => {
    setBgColor(color);
    localStorage.setItem(BG_STORAGE_KEY, color);
    setShowBgPicker(false);
  };

  const currentWord = words[currentIndex] || INITIAL_WORDS[0];

  // --- Robust Image Loading Logic ---
  useEffect(() => {
    setImgError(false);
    
    if (currentWord.imageUrl) {
      // 1. User Uploads (Base64 Data URLs)
      if (currentWord.imageUrl.startsWith('data:')) {
        setImageSrc(currentWord.imageUrl);
      } 
      // 2. External Hosting (Http/Https)
      else if (currentWord.imageUrl.startsWith('http')) {
        let url = currentWord.imageUrl;
        // Github Blob fix
        if (url.includes('github.com') && url.includes('/blob/')) {
           url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        setImageSrc(url);
      }
      // 3. Local Assets (Hosted in Repo)
      else {
        // If the user provided a full relative path (e.g. "assets/bed.png"), use it.
        // If they just provided a filename (e.g. "bed.png"), assume it's in the default ./assets/ folder.
        const isPath = currentWord.imageUrl.includes('/');
        const finalPath = isPath ? currentWord.imageUrl : `./assets/${currentWord.imageUrl}`;
        setImageSrc(finalPath);
      }
    } else {
      setImageSrc(null);
    }
  }, [currentWord, currentIndex]);

  const handleImageError = () => {
    if (!imageSrc) return;

    // If it was an external URL that failed, we can't recover locally
    if (imageSrc.startsWith('http')) {
        console.warn(`Failed to load external image: ${imageSrc}`);
        setImgError(true);
        return;
    }

    // Fallback logic for local assets
    // If we tried './assets/dog.png' and it failed, maybe the user put it in root 'dog.png'?
    if (imageSrc.includes('assets/')) {
      console.log(`Failed to load from assets folder: ${imageSrc}. Retrying from root...`);
      const filename = imageSrc.split('/').pop();
      if (filename) {
        setImageSrc(`./${filename}`); 
        return;
      }
    }

    console.warn(`Could not load image for: ${currentWord.text}`);
    setImgError(true);
  };

  // --- Handlers: Canvas ---
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
          
          // STRICTER LIMITS FOR 10MB APP LIMIT
          const MAX_SIZE = 512; 

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
          
          // Lower quality (0.5) to ensure we respect storage limits
          resolve(canvas.toDataURL('image/jpeg', 0.5)); 
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
        console.error("Image compression failed", error);
        alert("Sorry, there was an issue processing that image.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const saveNewWord = () => {
    if (!newWordText.trim()) return;

    const newWord: TracingWord = {
      id: Date.now().toString(),
      text: newWordText.toLowerCase(),
      category: 'My Words',
      imageUrl: newWordImage || undefined,
      emoji: !newWordImage ? '📝' : undefined
    };

    const savedCustom = localStorage.getItem(STORAGE_KEY);
    const existingCustom = savedCustom ? JSON.parse(savedCustom) : [];
    const updatedCustom = [...existingCustom, newWord];
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
      loadWords();
      setNewWordText('');
      setNewWordImage(null);
      setShowUploadModal(false);
      
      const newTotalLength = INITIAL_WORDS.length + updatedCustom.length;
      handleClear();
      setCurrentIndex(newTotalLength - 1);
    } catch (e) {
      alert("Storage full! Please delete some custom words or try a smaller image.");
    }
  };

  // --- Styles ---
  const activeColor = brushColor;
  const activeLineWidth = isEraserMode ? 40 : 16; 

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

  if (!currentWord) return null;

  return (
    <div 
      className="flex flex-col h-full w-full select-none transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      
      {/* --- Top Bar --- */}
      <header className="flex-none p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center bg-white/50 backdrop-blur-sm shadow-sm z-20 relative">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-white/80 hover:bg-white active:scale-95 transition-transform shadow-sm"
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
                 className={`h-2 w-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-crayon-blue' : 'bg-slate-300'}`}
               />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
           {isIOSBrowser && (
             <button 
               onClick={() => setShowInstallModal(true)}
               className="p-3 rounded-full bg-white/80 text-slate-600 hover:bg-white active:scale-95 transition-transform shadow-sm"
               title="Install App"
             >
               <ICONS.Download size={24} />
             </button>
           )}
           <button 
             onClick={() => setShowBgPicker(true)}
             className="p-3 rounded-full bg-white/80 text-slate-600 hover:bg-white active:scale-95 transition-transform shadow-sm"
             aria-label="Change Background"
           >
             <ICONS.Palette size={24} />
           </button>
           <button 
             onClick={() => setShowUploadModal(true)}
             className="p-3 rounded-full bg-crayon-blue/10 text-crayon-blue hover:bg-crayon-blue/20 active:scale-95 transition-transform"
             aria-label="Add Word"
           >
             <ICONS.Plus size={24} />
           </button>
           <button 
            onClick={handleNext}
            className="p-3 rounded-full bg-white/80 hover:bg-white active:scale-95 transition-transform shadow-sm"
            aria-label="Next Word"
          >
            <ICONS.Next size={32} className="text-slate-600" />
          </button>
        </div>
      </header>

      {/* --- Main Area --- */}
      <main className="flex-1 relative w-full flex flex-col items-center justify-center overflow-hidden touch-none">
        
        {/* Background Layer: Image & Text */}
        <div className="flex flex-col items-center justify-center gap-2 h-full w-full py-4 pointer-events-none select-none">
          
          {/* Visual Cue - No more "card" style, just the floating image */}
          <div className="flex-none h-[25%] flex items-center justify-center w-full px-8 relative pointer-events-auto">
             {currentWord.imageUrl && !imgError && imageSrc ? (
                <img 
                  key={imageSrc} 
                  src={imageSrc} 
                  onError={handleImageError}
                  alt={currentWord.text} 
                  className="h-[25vh] w-auto object-contain transform rotate-2 animate-in zoom-in-95 duration-500 drop-shadow-xl"
                />
              ) : (
                <div className="flex items-center justify-center h-[25vh] w-[25vh] animate-in zoom-in-95 duration-500">
                  <span className="text-[15vh] leading-none filter drop-shadow-xl transform hover:scale-110 transition-transform cursor-default select-none">
                    {currentWord.emoji || '🎨'}
                  </span>
                </div>
              )}
          </div>

          {/* Tracing Text */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 pointer-events-none">
            <span 
              ref={textRef}
              className="text-[28vh] sm:text-[40vh] text-slate-400/50 tracking-widest leading-none text-center whitespace-nowrap"
              style={{ fontFamily: '"Andika", sans-serif' }}
            >
              {currentWord.text}
            </span>
          </div>
        </div>

        {/* Foreground Layer: Canvas */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" />
        <TraceCanvas 
             ref={canvasRef} 
             color={activeColor} 
             lineWidth={activeLineWidth}
             isEraser={isEraserMode}
        />
        
        {/* Score Modal */}
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

        {/* Background Color Picker Modal */}
        {showBgPicker && (
          <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-700 font-hand">Paper Color</h2>
                 <button onClick={() => setShowBgPicker(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                   <ICONS.Close size={20} />
                 </button>
               </div>
               
               <div className="grid grid-cols-4 gap-4">
                 {BG_COLORS.map((c) => (
                   <button
                     key={c.name}
                     onClick={() => handleSetBgColor(c.hex)}
                     className={`w-full aspect-square rounded-full shadow-inner border-4 transition-transform active:scale-95 ${bgColor === c.hex ? 'border-crayon-blue scale-110' : 'border-transparent'}`}
                     style={{ backgroundColor: c.hex }}
                     aria-label={`Select ${c.name} background`}
                   />
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* Upload Modal (Add New Word) */}
        {showUploadModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-700 font-hand">Add New Word</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                  <ICONS.Close size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Image Picker */}
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className={`border-4 border-dashed border-slate-200 rounded-2xl h-48 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-crayon-blue transition-colors relative overflow-hidden group ${isCompressing ? 'opacity-50 cursor-wait' : ''}`}
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
                  disabled={!newWordText || isCompressing}
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
          <div className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
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

      </main>

      {/* --- Bottom Bar --- */}
      <footer className="flex-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/50 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-2">
               <button
                onClick={toggleEraser}
                className={`p-4 rounded-2xl flex items-center gap-2 transition-all shadow-sm ${isEraserMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
              >
                <ICONS.Eraser size={24} />
                <span className="font-bold text-sm hidden sm:inline">Eraser</span>
              </button>
               <button
                onClick={handleClear}
                className="p-4 rounded-2xl bg-red-100 text-red-500 hover:bg-red-200 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                <ICONS.Trash size={24} />
              </button>
            </div>

            <button
              onClick={handleCheckScore}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-crayon-yellow to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <ICONS.Trophy size={28} className="fill-white" />
              <span className="font-bold text-lg">Check!</span>
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default App;
