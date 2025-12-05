
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp } from 'lucide-react';

/* 
 * TO REPLACE IMAGES MANUALLY:
 * 1. Convert your image to a Base64 string OR use a public URL.
 * 2. Replace the 'imageUrl' string below with your own string.
 * 
 * Example:
 * imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
 * OR
 * imageUrl: './assets/my-bed.jpg' (if you are using a build system that supports this)
 */

export const INITIAL_WORDS: TracingWord[] = [
  { 
    text: 'bed', 
    category: 'Home', 
    emoji: '🛏️', 
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-b0346efee535?w=800&q=80' 
  },
  { 
    text: 'cat', 
    category: 'Animals', 
    emoji: '🐱', 
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80' 
  },
  { 
    text: 'ball', 
    category: 'Toys', 
    emoji: '⚽', 
    imageUrl: 'https://images.unsplash.com/photo-1555861496-0666c8981751?w=800&q=80' 
  },
  { 
    text: 'doll', 
    category: 'Toys', 
    emoji: '🧸', 
    imageUrl: 'https://images.unsplash.com/photo-1606105886617-7e61b2e617d3?w=800&q=80' 
  },
  { 
    text: 'dog', 
    category: 'Animals', 
    emoji: '🐶', 
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80' 
  },
  { 
    text: 'bear', 
    category: 'Animals', 
    emoji: '🐻', 
    imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb87521bc5?w=800&q=80' 
  },
  { 
    text: 'chair', 
    category: 'Home', 
    emoji: '🪑', 
    imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445857?w=800&q=80' 
  },
  { 
    text: 'sitting', 
    category: 'Actions', 
    emoji: '🧘', 
    imageUrl: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=800&q=80' 
  },
  { 
    text: 'on', 
    category: 'Position', 
    emoji: '🔛', 
    imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80' 
  },
  { 
    text: 'socks', 
    category: 'Clothes', 
    emoji: '🧦', 
    imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&q=80' 
  },
];

export const PALETTE = [
  { color: BrushColor.Black, name: 'Black' },
  { color: BrushColor.Red, name: 'Red' },
  { color: BrushColor.Blue, name: 'Blue' },
  { color: BrushColor.Green, name: 'Green' },
  { color: BrushColor.Yellow, name: 'Yellow' },
  { color: BrushColor.Purple, name: 'Purple' },
  { color: BrushColor.Pink, name: 'Pink' },
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
