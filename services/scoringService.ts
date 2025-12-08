
/**
 * Calculates a tracing score based on "Ink Density" within each letter's bounding box.
 * Instead of trying to match exact font pixels (which fails due to browser rendering differences),
 * we check if the user has drawn enough ink inside each letter's area.
 * 
 * @param userCanvas - The canvas element where the user drew.
 * @param letterSpans - Array of span elements representing the letters on screen.
 * @returns A number between 0 and 100. Returns 100 if all letters have sufficient ink.
 */
export const calculateScore = (
  userCanvas: HTMLCanvasElement, 
  letterSpans: (HTMLSpanElement | null)[]
): number => {
  if (!userCanvas || letterSpans.length === 0) return 0;

  const ctx = userCanvas.getContext('2d');
  if (!ctx) return 0;

  const canvasRect = userCanvas.getBoundingClientRect();
  const width = userCanvas.width;
  const height = userCanvas.height;
  
  // Calculate DPR based on actual canvas size vs CSS size
  const dprX = width / canvasRect.width;
  const dprY = height / canvasRect.height;

  // Get all pixel data once (performance optimization)
  const imageData = ctx.getImageData(0, 0, width, height).data;

  let lettersCompleted = 0;
  
  // We define a threshold for "filled". 
  // Lowered to 3% to be more forgiving for 3-year-olds while ensuring more than just a dot.
  // 3% of a large letter box is roughly a single solid stroke across the letter.
  const DENSITY_THRESHOLD = 0.03; 

  letterSpans.forEach((span) => {
    if (!span) return;
    const rect = span.getBoundingClientRect();

    // Map DOM Rect to Canvas Pixel Coordinates
    const startX = Math.floor((rect.left - canvasRect.left) * dprX);
    const startY = Math.floor((rect.top - canvasRect.top) * dprY);
    const endX = Math.floor((rect.right - canvasRect.left) * dprX);
    const endY = Math.floor((rect.bottom - canvasRect.top) * dprY);

    // Boundary checks
    const safeStartX = Math.max(0, startX);
    const safeStartY = Math.max(0, startY);
    const safeEndX = Math.min(width, endX);
    const safeEndY = Math.min(height, endY);

    const boxArea = (safeEndX - safeStartX) * (safeEndY - safeStartY);
    if (boxArea <= 0) return;

    let coloredPixels = 0;

    // Scan pixels within this letter's box
    for (let y = safeStartY; y < safeEndY; y += 4) { // Optimization: Skip rows (step 4)
      for (let x = safeStartX; x < safeEndX; x += 4) { // Optimization: Skip cols (step 4)
        const index = (y * width + x) * 4;
        // Check alpha channel (index + 3)
        if (imageData[index + 3] > 50) {
          coloredPixels++;
        }
      }
    }

    // Since we skipped pixels (1 out of 16 checked), we multiply count by 16 to estimate total
    const estimatedColoredPixels = coloredPixels * 16;
    const ratio = estimatedColoredPixels / boxArea;

    if (ratio >= DENSITY_THRESHOLD) {
      lettersCompleted++;
    }
  });

  // Score is percentage of letters completed
  return (lettersCompleted / letterSpans.length) * 100;
};
