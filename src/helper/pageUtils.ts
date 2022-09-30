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
  const css = getSizeCssString('.pdfViewer .page', size);

  updateStyleTag('pageSizeStyle', css);
}

export function clearPageSizeStyle() {
  updateStyleTag('pageSizeStyle', '');
}

function getScaleRatio(from: Size, to: Size) {
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  return { scaleX, scaleY };
}

export const transformScaleToSize = curry(
  (from: Size, to: Size, element: HTMLElement) => {
    const { scaleX, scaleY } = getScaleRatio(from, to);
    element.style.transform = `scale(${scaleX}, ${scaleY})`;
  },
);

export function transformScaleToSizeCssString(
  from: Size,
  to: Size,
  selector: string,
) {
  const { scaleX, scaleY } = getScaleRatio(from, to);

  return `
	  	${selector} {
			transform: scale(${scaleX}, ${scaleY})
		}
	  `;
}

export function setTextLayerStyle(from: Size, to: Size) {
  const css = transformScaleToSizeCssString(from, to, '.pdfViewer .textLayer');
  updateStyleTag('textSizeStyle', css);
}

export function clearTextLayerStyle() {
  updateStyleTag('textSizeStyle', '');
}
