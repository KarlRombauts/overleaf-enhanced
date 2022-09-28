import { Size } from '../Types';

export function scaleSizeByFactor(
  size: Size | undefined,
  factor: number,
): Size | undefined {
  if (!size) return undefined;
  return {
    width: size.width * factor,
    height: size.height * factor,
  };
}
