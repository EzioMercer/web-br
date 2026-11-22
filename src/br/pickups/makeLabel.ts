import { drawOutlinedText } from '../../utils/drawOutlinedText';
import { labelSprite } from '../../utils/three/labelSprite';

export const makeLabel = (text: string, col: string) => {
  const { sprite, canvas } = labelSprite(2.4, 0.6);

  drawOutlinedText(canvas.getContext('2d')!, text, col);
  return sprite;
};
