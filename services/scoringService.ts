
/**
 * Calculates a tracing score by comparing the user's drawing to the expected text.
 * 
 * @param userCanvas - The canvas element where the user drew.
 * @param text - The text string to compare against (e.g. "A").
 * @param textElement - The DOM element displaying the text (used for styles/sizing/position).
 * @returns A number between 0 and 100 representing accuracy.
 */
export const calculateScore = (
  userCanvas: HTMLCanvasElement, 
  text: string, 
  textElement: HTMLElement
): number => {
  // 1. Setup offscreen canvas
  const width = userCanvas.width;
  const height = userCanvas.height;
  
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  
  if (!ctx) return 0;

  // 2. Determine Position relative to Canvas
  // This is crucial now that text moves around (e.g. under an image)
  const canvasRect = userCanvas.getBoundingClientRect();
  const textRect = textElement.getBoundingClientRect();

  // Calculate the center point of the text element relative to the canvas
  // We need to account for DPR scaling if the canvas uses it
  const dpr = userCanvas.clientWidth ? (userCanvas.width / userCanvas.clientWidth) : 1;
  
  const relativeX = (textRect.left - canvasRect.left + (textRect.width / 2)) * dpr;
  const relativeY = (textRect.top - canvasRect.top + (textRect.height / 2)) * dpr;

  // 3. Replicate text styling
  const computedStyle = window.getComputedStyle(textElement);
  const fontSizePx = parseFloat(computedStyle.fontSize);
  
  ctx.fillStyle = '#000000'; 
  const fontFamily = computedStyle.fontFamily || '"Andika", sans-serif';
  
  // Apply scaling to font size
  ctx.font = `${fontSizePx * dpr}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if ('letterSpacing' in ctx) {
     // @ts-ignore
     ctx.letterSpacing = computedStyle.letterSpacing === 'normal' ? '0px' : computedStyle.letterSpacing;
  }

  // Draw text at the exact calculate position
  ctx.fillText(text, relativeX, relativeY);

  // 4. Compare Pixels
  const targetData = ctx.getImageData(0, 0, width, height).data;
  
  const userCtx = userCanvas.getContext('2d');
  if (!userCtx) return 0;
  const userData = userCtx.getImageData(0, 0, width, height).data;

  let targetPixels = 0;
  let intersectionPixels = 0;
  let outsidePixels = 0;

  for (let i = 0; i < targetData.length; i += 4) {
    const isTarget = targetData[i + 3] > 100; 
    const isUser = userData[i + 3] > 50;      

    if (isTarget) {
      targetPixels++;
      if (isUser) {
        intersectionPixels++;
      }
    } else if (isUser) {
      outsidePixels++;
    }
  }

  if (targetPixels === 0) return 0;

  const coverage = intersectionPixels / targetPixels;
  const errorRatio = outsidePixels / targetPixels;
  
  let score = coverage - (errorRatio * 0.3);
  score = score * 1.3;
  score = Math.max(0, Math.min(1, score));

  return Math.round(score * 100);
};
