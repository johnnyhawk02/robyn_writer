
import React, { useState, useRef, useEffect } from 'react';
import TraceCanvas, { TraceCanvasHandle } from './components/TraceCanvas';
import { INITIAL_WORDS, ICONS } from './constants';
import { TracingWord, BrushColor } from './types';
// import { calculateScore } from './services/scoringService'; // Score feature removed from UI
import { Link } from 'lucide-react';

const STORAGE_KEY = 'tinytracer_custom_words';
const BG_STORAGE_KEY = 'tinytracer_bg_color';

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

const App: React.FC = () => {
  // --- State ---
  const [words, setWords] = useState<TracingWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const brushColor = BrushColor.Black;
  const [isEraserMode, setIsEraserMode] = useState(false);
  
  // Appearance
  const [bgColor, setBgColor] = useState(PRESET_COLORS[1]);
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newWordText, setNewWordText] = useState('');
  
  // Image Input State
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');
  const [newWordImage, setNewWordImage] = useState<string | null>(null); // For base64 uploads
  const [pastedUrl, setPastedUrl] = useState(''); // For external URLs
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
    // Don't close modal immediately for custom color picker
    if (PRESET_COLORS.includes(color)) {
      setShowBgPicker(false);
    }
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
          
          // INCREASED SIZE FOR CRISPER IMAGES
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
        console.error("Image compression failed", error);
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
      category: 'My Words',
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
  const activeLineWidth = isEraserMode ? 40 : 16; 

  const floatBtnClass = "p-3 rounded-full bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white active:scale-95 transition-all z-50 flex items-center justify-center";
  const activeEraserClass = "bg-slate-800 text-white shadow-xl scale-110 ring-2 ring-white";

  if (!currentWord) return null;

  return (
    <div 
      className="relative h-full w-full select-none overflow-hidden touch-none transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      
      {/* --- Floating UI Controls Layer --- */}
      {/* pointer-events-none ensures touches pass through to canvas where there are no buttons */}
      <div className="absolute inset-0 z-50 pointer-events-none p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col justify-between">
          
          {/* Top Row */}
          <div className="flex justify-between items-start pointer-events-auto">
              
              {/* Left Group: Settings & Add */}
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => setShowBgPicker(true)}
                   className={floatBtnClass}
                   aria-label="Change Color"
                 >
                   <ICONS.Palette size={24} className="text-slate-600" />
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

              {/* Center Group: Category (Minimal) */}
              <div className="flex flex-col items-center pt-2 opacity-60">
                <span className="text-xs font-bold text-black/40 tracking-widest uppercase mb-1 mix-blend-multiply">
                  {currentWord.category}
                </span>
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
                    onClick={toggleEraser}
                    className={`${floatBtnClass} ${isEraserMode ? activeEraserClass : 'text-slate-600'}`}
                    aria-label="Toggle Eraser"
                  >
                    <ICONS.Eraser size={24} />
                  </button>
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
          <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto">
             <button 
                onClick={handlePrev}
                className="p-4 rounded-full bg-white/60 hover:bg-white/90 shadow-lg backdrop-blur-sm active:scale-95 transition-all text-slate-600"
                aria-label="Previous Word"
              >
                <ICONS.Prev size={32} />
              </button>
          </div>
          
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-auto">
             <button 
                onClick={handleNext}
                className="p-4 rounded-full bg-white/60 hover:bg-white/90 shadow-lg backdrop-blur-sm active:scale-95 transition-all text-slate-600"
                aria-label="Next Word"
              >
                <ICONS.Next size={32} />
              </button>
          </div>

      </div>

      {/* --- Main Content Area (Background Layer) --- */}
      <main className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-0">
        
        {/* Top Half: Image */}
        <div className="flex-1 w-full flex items-end justify-center pb-4 sm:pb-8 px-12">
             {currentWord.imageUrl && !imgError && imageSrc ? (
                <img 
                  key={imageSrc} 
                  src={imageSrc} 
                  onError={handleImageError}
                  alt={currentWord.text} 
                  className="max-h-[40vh] w-auto max-w-full object-contain animate-in zoom-in-95 duration-700 drop-shadow-sm select-none pointer-events-none" 
                />
              ) : (
                <div className="flex items-center justify-center opacity-30">
                  <span className="text-[25vh] leading-none mix-blend-multiply text-black/20 select-none pointer-events-none">
                    {currentWord.emoji || '🎨'}
                  </span>
                </div>
              )}
        </div>

        {/* Bottom Half: Text */}
        <div className="flex-1 w-full flex items-start justify-center pt-2 sm:pt-4">
            <span 
              ref={textRef}
              className="text-[20vh] sm:text-[25vh] text-black/15 tracking-widest leading-none text-center whitespace-nowrap mix-blend-multiply select-none pointer-events-none"
              style={{ fontFamily: '"Andika", sans-serif' }}
            >
              {currentWord.text}
            </span>
        </div>

      </main>

      {/* --- Drawing Canvas (Top Layer) --- */}
      <TraceCanvas 
           ref={canvasRef} 
           color={activeColor} 
           lineWidth={activeLineWidth}
           isEraser={isEraserMode}
      />
      
      {/* Background Color Picker Modal */}
      {showBgPicker && (
        <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-700 font-hand">Paper Color</h2>
               <button onClick={() => setShowBgPicker(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                 <ICONS.Close size={20} />
               </button>
             </div>
             
             <div className="grid grid-cols-4 gap-4 mb-4">
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
                  onClick={() => setImageInputMethod('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${imageInputMethod === 'upload' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Upload Photo
                </button>
                <button 
                  onClick={() => setImageInputMethod('url')}
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
                        placeholder="https://imgur.com/..."
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

export default App;
