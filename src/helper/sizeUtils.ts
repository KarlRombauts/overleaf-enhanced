import { Size } from '../Types';

export function scaleSizeByFactor(size: Size, factor: number): Size {
  return {
    width: size.width * factor,
    height: size.height * factor,
  };
}
