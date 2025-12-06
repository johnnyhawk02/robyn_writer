
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp, Palette } from 'lucide-react';

/* 
 * ==========================================
 * WHERE DO I PUT MY IMAGES?
 * ==========================================
 * 
 * Your project folder should look like this:
 * 
 * my-app/
 * ├── public/             <-- 1. Create this folder at the top
 * │   └── assets/         <-- 2. Create this inside 'public'
 * │       ├── bed.png     <-- 3. Put your images here
 * │       └── cat.png
 * ├── index.html
 * └── package.json
 *
 * HOW TO USE THEM IN CODE:
 * 1. Just use the filename: imageUrl: 'bed.png'
 *    (The app automatically looks in the assets folder)
 * 
 * OPTION 2: External Links (No folders needed)
 * 1. Upload to Imgur.com or GitHub.
 * 2. Use the link: imageUrl: 'https://imgur.com/example.png'
 */

export const INITIAL_WORDS: TracingWord[] = [
  { 
    text: 'bed', 
    category: 'Home', 
    emoji: '🛏️', 
    imageUrl: 'bed.png' 
  },
  { 
    text: 'cat', 
    category: 'Animals', 
    emoji: '🐱', 
    imageUrl: 'cat.png' 
  },
  { 
    text: 'ball', 
    category: 'Toys', 
    emoji: '⚽', 
    imageUrl: 'ball.png' 
  },
  { 
    text: 'doll', 
    category: 'Toys', 
    emoji: '🧸', 
    imageUrl: 'doll.png' 
  },
  { 
    text: 'dog', 
    category: 'Animals', 
    emoji: '🐶', 
    imageUrl: 'dog.png' 
  },
  { 
    text: 'bear', 
    category: 'Animals', 
    emoji: '🐻', 
    imageUrl: 'bear.png' 
  },
  { 
    text: 'chair', 
    category: 'Home', 
    emoji: '🪑', 
    imageUrl: 'chair.png' 
  },
  { 
    text: 'sitting', 
    category: 'Actions', 
    emoji: '🧘', 
    imageUrl: 'sitting.png' 
  },
  { 
    text: 'on', 
    category: 'Position', 
    emoji: '🔛', 
    imageUrl: 'on.png' 
  },
  { 
    text: 'socks', 
    category: 'Clothes', 
    emoji: '🧦', 
    imageUrl: 'socks.png' 
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
  ShareIOS: SquareArrowUp,
  Palette
};
