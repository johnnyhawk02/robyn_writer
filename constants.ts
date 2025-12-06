
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp, Palette } from 'lucide-react';

/* 
 * ==========================================
 * IMAGE SETUP
 * ==========================================
 * 
 * You have two options for images:
 * 
 * OPTION 1: Manual GitHub Upload (Recommended for you)
 * 1. Go to your repo on GitHub.
 * 2. Open the 'public/assets' folder.
 * 3. Upload your images (e.g. 'bed.png').
 * 4. Use the filename below (imageUrl: 'bed.png').
 * 
 * OPTION 2: External Links
 * You can also paste full URLs from Imgur/PostImages.
 * (imageUrl: 'https://i.imgur.com/example.png')
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
