/**
 * Calculates a tracing score by comparing the user's drawing to the expected text.
 * 
 * @param userCanvas - The canvas element where the user drew.
 * @param text - The text string to compare against (e.g. "A").
 * @param textElement - The DOM element displaying the text (used for styles/sizing).
 * @returns A number between 0 and 100 representing accuracy.
 */
export const calculateScore = (
  userCanvas: HTMLCanvasElement, 
  text: string, 
  textElement: HTMLElement
): number => {
  // 1. Setup offscreen canvas with same dimensions as user canvas
  // Note: userCanvas.width/height are the physical pixels (already scaled by DPR)
  const width = userCanvas.width;
  const height = userCanvas.height;
  
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  
  if (!ctx) return 0;

  // 2. Replicate text rendering
  // We need to match the font size and styling of the DOM element
  const computedStyle = window.getComputedStyle(textElement);
  const fontSizePx = parseFloat(computedStyle.fontSize);
  
  // Calculate scaling factor between CSS pixels and Canvas pixels
  // userCanvas.width is physical, userCanvas.clientWidth is CSS
  // Use a fallback of 1 to prevent division by zero
  const dpr = userCanvas.clientWidth ? (userCanvas.width / userCanvas.clientWidth) : 1;

  // Apply styles
  ctx.fillStyle = '#000000'; // Draw target in black (alpha 255)
  // Use the exact font family stack from CSS or fallback
  const fontFamily = computedStyle.fontFamily || '"Schoolbell", cursive';
  ctx.font = `${fontSizePx * dpr}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Handle tracking-widest (approx 0.1em) if supported
  if ('letterSpacing' in ctx) {
     // @ts-ignore - TS might not know about letterSpacing yet
     ctx.letterSpacing = computedStyle.letterSpacing === 'normal' ? '0px' : computedStyle.letterSpacing;
  }

  // Draw text in center
  ctx.fillText(text, width / 2, height / 2);

  // 3. Compare Pixels
  // This can be heavy for large screens, but okay for a simple app trigger
  const targetData = ctx.getImageData(0, 0, width, height).data;
  
  const userCtx = userCanvas.getContext('2d');
  if (!userCtx) return 0;
  const userData = userCtx.getImageData(0, 0, width, height).data;

  let targetPixels = 0;
  let intersectionPixels = 0;
  let outsidePixels = 0;

  // Iterate strictly through pixels
  // data layout: [R, G, B, A, R, G, B, A, ...]
  for (let i = 0; i < targetData.length; i += 4) {
    // Check alpha channel
    const isTarget = targetData[i + 3] > 100; // Target exists here
    const isUser = userData[i + 3] > 50;      // User drew here (any color)

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

  // 4. Scoring Algorithm
  // Recall: How much of the target did they cover?
  const coverage = intersectionPixels / targetPixels;
  
  // Error: How much did they draw outside relative to the target size?
  // We divide by targetPixels to normalize the error relative to the letter size.
  // We allow some outside drawing (it's a kid!), so we weight the penalty lower.
  const errorRatio = outsidePixels / targetPixels;
  
  // Score formula: Coverage is good, Error reduces score.
  // We want to be generous.
  // If Coverage is 80%, that's great.
  // If Error is 50% (scribbling outside), penalize.
  
  // Base Score is Coverage %
  // Penalty is ErrorRatio * 0.3 (soft penalty)
  let score = coverage - (errorRatio * 0.3);
  
  // Boost score to be encouraging for toddlers
  // e.g. 0.7 raw score -> ~90%
  score = score * 1.3;

  // Clamp between 0 and 1
  score = Math.max(0, Math.min(1, score));

  return Math.round(score * 100);
};
