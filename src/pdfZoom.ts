import { debounce, throttle } from 'throttle-debounce';
import {
  getCssSize,
  getMaxScroll,
  getScrollPercent,
  setSizeFill,
} from './helper/elementUtils';
import { isZoom } from './helper/eventUtils';
import { baseLog } from './helper/mathUtils';
import {
  clearPageSizeStyle,
  getScaleDownButton,
  getScaleUpButton,
  scaleVisualPageSizeByFactor,
  setPageSizeStyle,
  setTextLayerStyle,
  setVisualPageSize,
  transformScaleToSize,
  transformScaleToSizeCssString,
} from './helper/pageUtils';
import { promiseSelector } from './helper/promiseSelector';
import { scaleSizeByFactor } from './helper/sizeUtils';
import { Vector, Size } from './Types';

const ZOOM_SENSITIVITY = 0.01;
const TRUE_SCALE_STEP = 0.25;

export class PdfZoom {
  currentSize: Size | undefined;
  viewer: HTMLElement | null = null;
  pdfPane: HTMLElement | null = null;
  pageContainer: HTMLElement | null = null;
  clickedControls = false;
  controls: Element | null = null;
  startedZoom = false;
  startedScroll = false;
  startingSize: Size | undefined;
  visualUpdatesPaused = false;
  prevScrollPercent = { x: 0, y: 0 };
  mousePosition = { x: 0, y: 0 };
  pauseTimeout: number | undefined;

  constructor() {}

  async init() {
    this.viewer = await promiseSelector('.pdfjs-viewer-inner');
    this.pageContainer = await promiseSelector('.pdfViewer');
    this.controls = await promiseSelector('.pdfjs-controls');
    this.pdfPane =
      document.querySelector('pdf-preview')?.closest('.ui-layout-pane') || null;
    await promiseSelector('.pdfjs-viewer-inner .page');
    this.updateCurrentSize();
    this.updateTrueSize();
    this.attachEventListeners();
  }

  needsReInit() {
    return (
      !document.body.contains(this.viewer) ||
      !document.body.contains(this.pageContainer) ||
      !document.body.contains(this.controls)
    );
  }

  async getElementRefs() {
    this.viewer = await promiseSelector('.pdfjs-viewer-inner');
    this.pageContainer = await promiseSelector('.pdfViewer');
    this.controls = await promiseSelector('.pdfjs-controls');
    await promiseSelector('.pdfjs-viewer-inner .page');
  }

  attachEventListeners() {
    const debouncedStoppedZoom = debounce(1000, this.zoomEndHandler.bind(this));
    const throttledZoomHandler = throttle(20, this.zoomHandler.bind(this));
    const debouncedStoppedScroll = debounce(
      50,
      this.scrollEndHandler.bind(this),
    );
    const throttledScrollHandler = throttle(50, this.scrollHandler.bind(this));
    const debouncedUnlock = debounce(50, () => {
      this.endTrueResizeHandler();
    });

    const debouncedReInit = debounce(50, this.init.bind(this), {
      atBegin: true,
    });

    new ResizeObserver(() => {
      if (this.clickedControls) {
        this.clickedControls = false;
        this.startingSize = this.getPageSize();
        this.updateTrueSize();
      }
    }).observe(this.pageContainer!);

    if (this.pdfPane) {
      new MutationObserver((event) => {
        if (this.needsReInit()) {
          this.init();
        }
      }).observe(this.pdfPane!, { subtree: false, childList: true });
    }

    this.viewer!.addEventListener('wheel', (event) => {
      if (isZoom(event)) {
        if (this.needsReInit()) {
          debouncedReInit();
        }
        this.endTrueResizeHandler();
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!this.startedZoom) {
          this.zoomStartHandler(event);
        }
        throttledZoomHandler(event);
        debouncedStoppedZoom(event);
      }
    });

    this.viewer!.addEventListener('scroll', (event) => {
      if (this.visualUpdatesPaused) {
        // automatic scrolling due to true resizing
        debouncedUnlock();
      } else {
        if (!this.startedScroll) {
          this.scrollStartHandler(event);
        }
        throttledScrollHandler(event);
        debouncedStoppedScroll(event);
      }
    });

    this.viewer!.addEventListener(
      'mousemove',
      throttle(100, this.updateMousePosition.bind(this)),
    );

    this.controls!.addEventListener('click', (event) => {
      if (event.isTrusted) {
        this.startTrueResizeHandler();
      }
      this.visualUpdatesPaused = true;
    });
  }

  startTrueResizeHandler() {
    this.clickedControls = true;
    clearPageSizeStyle();
  }
  endTrueResizeHandler() {
    if (this.visualUpdatesPaused) {
      if (this.clickedControls) {
        this.clickedControls = false;
        this.updateCurrentSize();
        this.updateTrueSize();
        setPageSizeStyle(this.currentSize!);
        setTextLayerStyle(this.startingSize!, this.currentSize!);
      }
      this.visualUpdatesPaused = false;
    }
  }

  scrollEndHandler(event: Event) {
    this.startedScroll = false;
  }

  scrollStartHandler(event: Event) {
    this.startedScroll = true;
  }

  updateMousePosition(event: MouseEvent) {
    const rect = this.viewer!.getBoundingClientRect();
    this.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    this.updatePrevScrollPercent();
  }

  pauseVisualUpdates(milliseconds: number, callback: () => any) {
    if (this.visualUpdatesPaused) {
      clearTimeout(this.pauseTimeout);
    }
    this.visualUpdatesPaused = true;
    callback();
    this.pauseTimeout = setTimeout(() => {
      this.visualUpdatesPaused = false;
    }, milliseconds);
  }

  getPages() {
    return document.querySelectorAll<HTMLElement>('.pdfViewer .page');
  }

  getTextLayers() {
    return document.querySelectorAll<HTMLElement>('.pdfViewer .textLayer');
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

  updateTrueSize() {
    this.startingSize = this.getPageSize();
  }

  trueScaleUp() {
    getScaleUpButton()?.click();
    if (this.startingSize) {
      this.startingSize = scaleSizeByFactor(
        this.startingSize,
        1 + TRUE_SCALE_STEP,
      );
    }
    this.setScrollMousePercent(this.prevScrollPercent);
  }

  trueScaleDown() {
    getScaleDownButton()?.click();
    if (this.startingSize) {
      this.startingSize = scaleSizeByFactor(
        this.startingSize,
        1 - TRUE_SCALE_STEP,
      );
    }
    this.setScrollMousePercent(this.prevScrollPercent);
  }

  setTrueSize(targetSize: Size) {
    const ratio = targetSize.height / this.startingSize!.height;
    this.setScrollMousePercent(this.prevScrollPercent);
    // this.pauseVisualUpdates(500, () => {
    if (ratio < 1) {
      const repeats = Math.round(baseLog(1 - 0.25, ratio));
      for (let i = 0; i < repeats; i++) {
        this.trueScaleDown();
        this.setScrollMousePercent(this.prevScrollPercent);
      }
    } else {
      const repeats = Math.round(baseLog(1 + 0.25, ratio));
      for (let i = 0; i < repeats; i++) {
        this.trueScaleUp();
        this.setScrollMousePercent(this.prevScrollPercent);
      }
    }
    // });
    setTimeout(() => {
      this.setVisualSize(targetSize);
      this.setScrollMousePercent(this.prevScrollPercent);
      this.scaleTextLayers();
    }, 0);
    setTimeout(() => {
      this.scaleTextLayers();
    }, 100);
  }

  updatePrevScrollPercent() {
    if (!this.visualUpdatesPaused) {
      this.prevScrollPercent = getScrollPercent(
        this.viewer!,
        this.mousePosition,
      );
    }
  }

  updateVisualPageSizes() {
    if (this.currentSize && !this.visualUpdatesPaused) {
      this.setVisualSize(this.currentSize);
      if (!this.startedScroll) {
        this.setScrollMousePercent(this.prevScrollPercent);
      }
    }
  }

  private setVisualSize(targetSize: Size) {
    this.getPages().forEach(setVisualPageSize(targetSize));
    this.currentSize = targetSize;
  }

  setScrollPercent(percent: number) {
    this.viewer!.scrollTop = getMaxScroll(this.viewer!).y * percent;
  }

  setScrollMousePercent(percent: Vector) {
    const maxScroll = getMaxScroll(this.viewer!);
    this.viewer!.scrollTop = maxScroll.y * percent.y - this.mousePosition.y;
    this.viewer!.scrollLeft = maxScroll.x * percent.x - this.mousePosition.x;
  }

  zoomStartHandler(event: WheelEvent) {
    this.updateCurrentSize();
    this.updatePrevScrollPercent();
    this.startedZoom = true;
  }

  scaleTextLayers() {
    if (!this.startingSize || !this.currentSize) {
      return;
    }
    setTextLayerStyle(this.startingSize, this.currentSize);
  }
  zoomHandler(event: WheelEvent) {
    if (!this.currentSize) {
      return;
    }
    const zoomFactor = 1 - event.deltaY * ZOOM_SENSITIVITY;
    const targetSize = scaleSizeByFactor(this.currentSize, zoomFactor);
    setPageSizeStyle(targetSize);
    this.currentSize = targetSize;
    this.setScrollMousePercent(this.prevScrollPercent);
  }

  zoomEndHandler(event: WheelEvent) {
    this.updateCurrentSize();
    if (!this.startingSize || !this.currentSize) {
      return;
    }
    this.setTrueSize(this.currentSize);
    this.startedZoom = false;
  }

  scrollHandler(event: Event) {
    this.updatePrevScrollPercent();
    this.updateVisualPageSizes();
  }

  trueSizeChangeHandler() {}
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
