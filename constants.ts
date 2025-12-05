
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp } from 'lucide-react';

export const INITIAL_WORDS: TracingWord[] = [
  { text: 'cat', category: 'Animals', emoji: '🐱' },
  { text: 'dog', category: 'Animals', emoji: '🐶' },
  { text: 'sun', category: 'Nature', emoji: '☀️' },
  { text: 'moon', category: 'Nature', emoji: '🌙' },
  { text: 'star', category: 'Nature', emoji: '⭐' },
  { text: 'tree', category: 'Nature', emoji: '🌳' },
  { text: 'apple', category: 'Food', emoji: '🍎' },
  { text: 'ball', category: 'Toys', emoji: '⚽' },
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
