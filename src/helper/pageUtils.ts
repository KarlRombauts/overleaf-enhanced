import { curry } from 'ramda';
import { Size } from '../Types';
import { removeNulls } from './arrayUtils';
import { getCssSize, setSizeFill, setSizePx } from './elementUtils';
import { baseLog } from './mathUtils';
import { scaleSizeByFactor } from './sizeUtils';

export const setVisualPageSize = curry(function (
  size: Size | undefined,
  page: HTMLElement,
) {
  if (!size) return;
  setSizePx(page, size);

  const children = removeNulls([
    page.querySelector<HTMLElement>('canvas'),
    page.querySelector<HTMLElement>('.canvasWrapper'),
    page.querySelector<HTMLElement>('.textLayer'),
  ]);

  children.forEach(setSizeFill);
});

export const scaleVisualPageSizeByFactor = curry(function (
  factor: number,
  page: HTMLElement,
) {
  console.log('factor', factor);
  const currentSize = getCssSize(page);
  const targetSize = scaleSizeByFactor(currentSize, factor);
  if (!currentSize) return;
  setVisualPageSize(targetSize, page);
});

export function getScaleUpButton() {
  return document.querySelector<HTMLElement>('.pdfjs-controls .btn-group')
    ?.children[2] as HTMLElement | undefined;
}

export function getScaleDownButton() {
  return document.querySelector<HTMLElement>('.pdfjs-controls .btn-group')
    ?.children[3] as HTMLElement | undefined;
}
