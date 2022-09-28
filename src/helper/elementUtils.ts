import { Size } from '../Types';
import { withinTolerance } from './mathUtils';

export function getCssSize(element: HTMLElement) {
  const width = parseFloat(element.style.width);
  const height = parseFloat(element.style.height);
  return { width, height };
}

export function setSizePx(element: HTMLElement, size: Size) {
  element.style.width = size.width + 'px';
  element.style.height = size.height + 'px';
}

/**
 * Makes the element's size fill its parent
 * @param element
 */
export function setSizeFill(element: HTMLElement) {
  element.style.width = '100%';
  element.style.height = '100%';
}

/**
 * Checks if an element is within a percentage margin of the target size
 * @param element The element to check
 * @param target The target size
 * @param percent The percentage margin
 */
export function isApproxSize(
  element: HTMLElement,
  target: Size,
  percent: number,
): boolean {
  const { width, height } = getCssSize(element);
  return (
    withinTolerance(width, target.width, percent) &&
    withinTolerance(height, target.height, percent)
  );
}
