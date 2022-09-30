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

export function getSizeCssString(selector: string, size: Size) {
  return `
	${selector} {
		height: ${size.height}px !important;
		width: ${size.width}px !important;
	}
	`;
}

function getScaleToParentCssString(selector: string, parentSize: Size) {
  return `
	${selector} {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		transform: ${getTransformScaleToParent(selector, parentSize)};
	}
	`;
}

export function injectStyleTag(id: string, css: string) {
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.id = id;
  style.type = 'text/css';
  style.innerHTML = css;
  head.appendChild(style);
}

export function updateStyleTag(id: string, css: string) {
  const style = document.getElementById(id);
  if (!style) {
    injectStyleTag(id, css);
  } else {
    style.innerHTML = css;
  }
}

export function setPageSizeStyle(size: Size) {
  const css =
    getSizeCssString('.pdfViewer .page', size) +
    getScaleToParentCssString('.pdfViewer .page .textLayer', size);

  updateStyleTag('pageSizeStyle', css);
}

export function clearPageSizeStyle() {
  updateStyleTag('pageSizeStyle', '');
}

function getScaleRatio(from: Size, to: Size) {
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.width;
  return { scaleX, scaleY };
}

function getTransformScaleToParent(selector: string, parentSize: Size) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return;
  }
  element.style.transform = 'none';
  const elementSize = element.getBoundingClientRect();
  const { scaleX } = getScaleRatio(elementSize, parentSize);
  element.style.transform = '';
  return `scale(${scaleX})`;
}
