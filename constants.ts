
import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Eraser, Trophy, Plus, Image as ImageIcon, X, Download, SquareArrowUp } from 'lucide-react';

export const INITIAL_WORDS: TracingWord[] = [
  { text: 'bed', category: 'Home', emoji: '🛏️' },
  { text: 'cat', category: 'Animals', emoji: '🐱' },
  { text: 'ball', category: 'Toys', emoji: '⚽' },
  { text: 'doll', category: 'Toys', emoji: '🧸' },
  { text: 'dog', category: 'Animals', emoji: '🐶' },
  { text: 'bear', category: 'Animals', emoji: '🐻' },
  { text: 'chair', category: 'Home', emoji: '🪑' },
  { text: 'sitting', category: 'Actions', emoji: '🧘' },
  { text: 'on', category: 'Position', emoji: '🔛' },
  { text: 'socks', category: 'Clothes', emoji: '🧦' },
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
