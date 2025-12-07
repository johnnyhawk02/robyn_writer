
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp, Palette } from 'lucide-react';

/* 
 * ==========================================
 * IMAGE SETUP
 * ==========================================
 * 
 * We are now using hosted images from PostImages.cc!
 * This prevents the "missing folder" issue on GitHub.
 * 
 * These are the high-resolution direct links.
 */

export const INITIAL_WORDS: TracingWord[] = [
  { 
    text: 'bed', 
    category: 'Home', 
    emoji: '🛏️', 
    imageUrl: 'https://i.postimg.cc/vTFG4mr2/bed.png' 
  },
  { 
    text: 'cat', 
    category: 'Animals', 
    emoji: '🐱', 
    imageUrl: 'https://i.postimg.cc/NFqQK064/cat.png' 
  },
  { 
    text: 'ball', 
    category: 'Toys', 
    emoji: '⚽', 
    imageUrl: 'ball.png' // Waiting for link
  },
  { 
    text: 'doll', 
    category: 'Toys', 
    emoji: '🧸', 
    imageUrl: 'https://i.postimg.cc/fynMVbc5/doll.png' 
  },
  { 
    text: 'dog', 
    category: 'Animals', 
    emoji: '🐶', 
    imageUrl: 'https://i.postimg.cc/cCydvJRr/dog.png' 
  },
  { 
    text: 'bear', 
    category: 'Animals', 
    emoji: '🐻', 
    imageUrl: 'https://i.postimg.cc/wM891BXt/bear.png' 
  },
  { 
    text: 'chair', 
    category: 'Home', 
    emoji: '🪑', 
    imageUrl: 'https://i.postimg.cc/ZntJWq80/chair.png' 
  },
  { 
    text: 'sitting', 
    category: 'Actions', 
    emoji: '🧘', 
    imageUrl: 'https://i.postimg.cc/rsXqDp1D/sitting.png' 
  },
  { 
    text: 'on', 
    category: 'Position', 
    emoji: '🔛', 
    imageUrl: 'https://i.postimg.cc/63G96ZvX/on.png' 
  },
  { 
    text: 'socks', 
    category: 'Clothes', 
    emoji: '🧦', 
    imageUrl: 'socks.png' // Waiting for link
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
