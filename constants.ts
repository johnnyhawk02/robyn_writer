
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp } from 'lucide-react';

/* 
 * ==========================================
 * HOW TO ADD YOUR OWN PHOTOS
 * ==========================================
 * 
 * 1. Create a folder named 'assets' next to index.html
 * 2. Put your photos in there (e.g. bed.png)
 * 3. Make sure the filenames match the ones below exactly!
 */

export const INITIAL_WORDS: TracingWord[] = [
  { 
    text: 'bed', 
    category: 'Home', 
    emoji: '🛏️', 
    imageUrl: './assets/bed.png' 
  },
  { 
    text: 'cat', 
    category: 'Animals', 
    emoji: '🐱', 
    imageUrl: './assets/cat.png' 
  },
  { 
    text: 'ball', 
    category: 'Toys', 
    emoji: '⚽', 
    imageUrl: './assets/ball.png' 
  },
  { 
    text: 'doll', 
    category: 'Toys', 
    emoji: '🧸', 
    imageUrl: './assets/doll.png' 
  },
  { 
    text: 'dog', 
    category: 'Animals', 
    emoji: '🐶', 
    imageUrl: './assets/dog.png' 
  },
  { 
    text: 'bear', 
    category: 'Animals', 
    emoji: '🐻', 
    imageUrl: './assets/bear.png' 
  },
  { 
    text: 'chair', 
    category: 'Home', 
    emoji: '🪑', 
    imageUrl: './assets/chair.png' 
  },
  { 
    text: 'sitting', 
    category: 'Actions', 
    emoji: '🧘', 
    imageUrl: './assets/sitting.png' 
  },
  { 
    text: 'on', 
    category: 'Position', 
    emoji: '🔛', 
    imageUrl: './assets/on.png' 
  },
  { 
    text: 'socks', 
    category: 'Clothes', 
    emoji: '🧦', 
    imageUrl: './assets/socks.png' 
  },
];

export const ICONS = {
  Pencil,
  Trash: Trash2,
  Next: ArrowRight,
  Prev: ArrowLeft,
  Eraser,
  Trophy,
  Plus,
  Image: ImageIcon,
  Close: X,
  Download,
  ShareIOS: SquareArrowUp
};
