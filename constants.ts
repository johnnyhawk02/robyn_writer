import { BrushColor, TracingWord } from './types';
import { Pencil, Trash2, ArrowRight, ArrowLeft, Wand2, Eraser, Trophy } from 'lucide-react';

export const INITIAL_WORDS: TracingWord[] = [
  { text: 'a', category: 'Letters' },
  { text: 'b', category: 'Letters' },
  { text: 'c', category: 'Letters' },
  { text: 'cat', category: 'Animals' },
  { text: 'dog', category: 'Animals' },
  { text: 'mom', category: 'Family' },
  { text: 'dad', category: 'Family' },
  { text: 'sun', category: 'Nature' },
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
  Magic: Wand2,
  Eraser,
  Trophy
};
