/** Draws a label: bold centred text with a black outline, on a 256 x 64 canvas. */
export const drawOutlinedText = (x: CanvasRenderingContext2D, text: string, color: string) => {
  x.font = 'bold 30px sans-serif';
  x.textAlign = 'center';
  x.lineWidth = 5;
  x.strokeStyle = '#000';
  x.strokeText(text, 128, 40);
  x.fillStyle = color;
  x.fillText(text, 128, 40);
};
