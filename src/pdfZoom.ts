import { debounce, throttle } from 'throttle-debounce';
import { getCssSize, setSizeFill } from './helper/elementUtils';
import { isZoom } from './helper/eventUtils';
import { baseLog } from './helper/mathUtils';
import {
  getScaleDownButton,
  getScaleUpButton,
  scaleVisualPageSizeByFactor,
  setVisualPageSize,
} from './helper/pageUtils';
import { promiseSelector } from './helper/promiseSelector';
import { scaleSizeByFactor } from './helper/sizeUtils';
import { Size } from './Types';

const ZOOM_SENSITIVITY = 0.01;

export class PdfZoom {
  currentSize: Size | undefined;
  viewer: HTMLElement | null = null;
  controls: Element | null = null;
  startedZoom = false;
  startingSize: Size | undefined;
  clickedControls = false;

  constructor() {}

  async init() {
    this.viewer = await promiseSelector('.pdfjs-viewer-inner');
    this.controls = await promiseSelector('.pdfjs-controls');

    await promiseSelector('.pdfjs-viewer-inner .page');
    this.updateCurrentSize();
    this.attachEventListeners();

    setInterval(this.updateVisualPageSizes.bind(this), 100);
  }

  attachEventListeners() {
    const debouncedStoppedZoom = debounce(1000, this.zoomEndHandler.bind(this));
    const throttledZoomHandler = throttle(20, this.zoomHandler.bind(this));

    this.viewer!.addEventListener('wheel', (event) => {
      if (isZoom(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!this.startedZoom) {
          this.zoomStartHandler(event);
        }
        throttledZoomHandler(event);
        debouncedStoppedZoom(event, this.startingSize);
      }
    });

    this.viewer!.addEventListener(
      'scroll',
      throttle(50, this.scrollHandler.bind(this)),
    );
  }

  getPages() {
    return document.querySelectorAll<HTMLElement>('.pdfViewer .page');
  }

  getFirstPage() {
    return document.querySelector<HTMLElement>('.pdfViewer .page');
  }

  getPageSize() {
    const page = this.getFirstPage();
    if (!page) {
      return undefined;
    }
    return getCssSize(page);
  }

  updateCurrentSize() {
    this.currentSize = this.getPageSize();
  }

  updateStartingSize() {
    setTimeout(() => {
      this.startingSize = this.getPageSize();
    }, 100);
  }

  setVisualSize(size: Size) {}

  truePageScaleUp() {
    getScaleUpButton()?.click();
    this.updateStartingSize();
  }

  truePageScaleDown() {
    getScaleDownButton()?.click();
    this.updateStartingSize();
  }

  setTrueSize(startingSize: Size, targetSize: Size) {
    const ratio = targetSize.height / startingSize.height;
    if (ratio < 1) {
      const repeats = Math.round(baseLog(1 - 0.25, ratio));
      for (let i = 0; i < repeats; i++) {
        this.truePageScaleDown();
      }
    } else {
      const repeats = Math.round(baseLog(1 + 0.25, ratio));
      for (let i = 0; i < repeats; i++) {
        this.truePageScaleUp();
      }
    }
  }

  zoomStartHandler(event: WheelEvent) {
    this.startingSize = this.getPageSize();
    this.updateCurrentSize();
    this.startedZoom = true;
  }

  zoomHandler(event: WheelEvent) {
    const zoomFactor = 1 - event.deltaY * ZOOM_SENSITIVITY;
    console.log('zoom');
    const pages = this.getPages();

    const targetSize = scaleSizeByFactor(this.currentSize, zoomFactor);
    if (!targetSize) {
      return;
    }
    const scaleVisualPage = setVisualPageSize(targetSize);

    pages.forEach(scaleVisualPage);
    //   if (event.deltaY > 0) { // zoom out
    // 	scaleVisualPageSizeByFactor(0.05);
    //   }
    //   if (event.deltaY < 0) { // zoom in
    // 	increasePagesSize(pages, 0.05);
    //   }

    this.updateCurrentSize();
  }

  zoomEndHandler(event: WheelEvent, startingSize: Size | undefined) {
    console.log('stop', startingSize);
    this.updateCurrentSize();
    if (!startingSize || !this.currentSize) {
      return;
    }
    this.setTrueSize(startingSize, this.currentSize);
    this.startedZoom = false;
  }

  updateVisualPageSizes() {
    if (this.currentSize && !this.clickedControls) {
      const scaleVisualPage = setVisualPageSize(this.currentSize);
      this.getPages().forEach(scaleVisualPage);
    }
  }
  scrollHandler(event: Event) {
    this.updateVisualPageSizes();
  }
}

// async function fixPdfTrueScaling(startingSize) {
//   const pages = document.querySelectorAll('.pdfViewer .page');
//   const targetSize = getPageSize(pages[0]);

//   const ratio = targetSize.height / startingSize.height;

//   if (ratio < 1) {
//     // scale down
//     const repeats = Math.round(baseLog(1 - 0.25, ratio));
//     console.log('repeats:', repeats);
//     for (let i = 0; i < repeats; i++) {
//       defaultPdfScaleDown();
//     }
//   } else {
//     // scale up
//     const repeats = Math.round(baseLog(1 + 0.25, ratio));
//     console.log('repeats:', repeats);
//     for (let i = 0; i < repeats; i++) {
//       defaultPdfScaleUp();
//     }
//   }

//   console.log('done resizing');

//   setTimeout(() => {
//     pages.forEach((page) => {
//       setPageSize(page, targetSize);
//     });
//     currentSize = targetSize;
//   }, 200);
// }

// pollingQuerySelector('.pdfjs-viewer-inner', (pdfViewer) => {
//   pdfViewer.addEventListener('scroll', () => {
//     if (currentSize && !clickedControls) {
//       const pages = document.querySelectorAll('.pdfViewer .page');
//       pages.forEach((page) => {
//         setPageSize(page, currentSize);
//       });
//     }
//   });
// });

// pollingQuerySelector('.pdfjs-controls', (controls) => {
//   controls.addEventListener('click', () => {
//     clickedControls = true;
//     console.log('controls');
//     const page = document.querySelector('.pdfViewer .page');
//     setTimeout(() => {
//       currentSize = getPageSize(page);
//       clickedControls = false;
//     }, 100);
//   });
// });
