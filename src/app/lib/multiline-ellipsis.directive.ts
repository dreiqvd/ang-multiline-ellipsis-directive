/** This is a custom directive for handling line clamping
 * for text elements with specified height. This will show
 * an ellipsis if a text overflows within the specified height
 */

import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, Renderer2} from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appLineClamp]',
  exportAs: 'appLineClamp'
})
export class LineClampDirective implements AfterViewInit, OnDestroy {

  /** The maximum number of text lines before clamping the overflow */
  @Input() allowedLines = 3;

  /** Variable that stores the value of the original text. This is used for fetching
   * the correct original text when resizing the window */
   @Input() text?: string;

  private $destroy = new Subject<void>();
  private element: HTMLElement;
  private originalText?: string;
  private spanElements: SpanElement[] = [];
  private groupedSpanElements: { [key: string]: SpanElement[] } = {};

  constructor(private ref: ElementRef, private renderer: Renderer2) {
    this.element = this.ref.nativeElement;
    // Element is hidden until the ellipsis computation is completed
    this.renderer.setStyle(this.element, 'visibility', 'hidden');

    /* Styles that are required for the text overflow to be computed properly */
    this.renderer.setStyle(this.element, 'overflow-wrap', 'break-word');
    this.renderer.setStyle(this.element, 'word-break', 'break-word');
    this.renderer.setStyle(this.element, 'overflow', 'hidden');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.clamp();
    }, 200); // Add a small delay before clamping the text. This is to give time for Angular initial processes

    fromEvent(window, 'resize').pipe(
      takeUntil(this.$destroy)
    ).subscribe(() => {
      this.reset();
      this.clamp();
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private reset(): void {
    this.spanElements = [];
    this.groupedSpanElements = {};
  }

  private clamp(): void {
    if (this.element.textContent) {
      /** Step 1: Save original text and reset the contents of the element */
      this.originalText = this.text ?? this.element.textContent;
      this.element.innerHTML = '';

      /* Step 2: Put each string in the element into individual spans to be
      able to get the dimension and offsets of each word from the DOM */
      this.textToSpans();

      /* Step 3: Group the list of span elements by top offsets. This is to know
      which strings exceed the maximum height (allowedLines) of the container. */
      this.groupSpanElements();

      /* Step 4: If grouping of offset top is greater than the allowed lines,
      then an overflow has happened and text will be computed. Otherwise
      it means there's no overflow and text content is set back to original text */
      if (Object.keys(this.groupedSpanElements).length > this.allowedLines) {
        this.setOverflowText();
      } else {
        this.element.textContent = this.originalText;
      }
    }
    this.renderer.setStyle(this.element, 'visibility', 'visible');
  }

  private textToSpans(): void {
    const stringsArr = (this.originalText ?? '').split(/(\s+)/); // include whitespaces in the split
    // const spanElements: Array<{ element: HTMLElement, idx: number }> = [];
    stringsArr.forEach((text, index) => {
      const span = this.renderer.createElement('span');
      let width;
      if (this.isTextWhiteSpace(text)) {
        // If text is a white space we add a text node so span would have a width.
        // For now, text is only being replaced with a "space"
        const spaceNode = document.createTextNode('\u00A0');
        this.renderer.appendChild(span, spaceNode);
        this.renderer.appendChild(this.element, span);
        width = span.getBoundingClientRect().width;
        span.textContent = ' ';
      } else {
        span.textContent = text;
        this.renderer.setStyle(span, 'white-space', 'pre'); // this will set whitespaces to not break
        this.renderer.appendChild(this.element, span);
        width = span.getBoundingClientRect().width;
      }
      this.spanElements.push({ element: span, index, width: width });
    });
  }

  private groupSpanElements(): void {
    // There is another code for grouping an array but this is much easier to understand for me
    this.spanElements.forEach(span => {
      const top: string = span.element.getBoundingClientRect().top.toString();
      const element = {...span }
      if (this.groupedSpanElements[top]) {
        this.groupedSpanElements[top].push(element);
      } else {
        this.groupedSpanElements[top] = [element];
      }
    });
  }

  private setOverflowText(): void {
    // Get the contents where it fits the last allowed line and compute for its width
    const lastLineKey = Object.keys(this.groupedSpanElements)[this.allowedLines - 1];
    const lastLineWidth = this.groupedSpanElements[lastLineKey].reduce((partialSum, current) => {
      return partialSum += current.width;
    }, 0);
    // Temporarily insert ellipsis to the element since it also needs to be taken
    // into account when computing where to stop with the overflow character
    const ellipsisSpan = this.renderer.createElement('span');
    ellipsisSpan.textContent = '...';
    this.renderer.appendChild(this.element, ellipsisSpan);
    const ellipsisWidth = ellipsisSpan.getBoundingClientRect().width;
    let availableSpace = this.element.getBoundingClientRect().width - (lastLineWidth + ellipsisWidth + 5);
    let overflowSpanKey;
    let overflowItem: SpanElement | undefined;
    if (availableSpace > 0) {
      // Get the first overflowing span element (should not be whitespace)
      overflowSpanKey = Object.keys(this.groupedSpanElements)[this.allowedLines];
      overflowItem = this.groupedSpanElements[overflowSpanKey].find(span => {
        return !this.isTextWhiteSpace((span.element.textContent ?? ''));
      });
    } else {
      /* If available space is less than or equal to 0, it means that the last text from
      the last allowed line reached the max width of the container. Since we cannot insert
      additional text anymore, we should now put an ellipsis to the last text from the last
      allowed line */
      overflowSpanKey = Object.keys(this.groupedSpanElements)[this.allowedLines - 1];
      overflowItem = this.groupedSpanElements[overflowSpanKey].reverse().find(span => {
        return !this.isTextWhiteSpace((span.element.textContent ?? ''));
      });
      availableSpace = overflowItem!.element.getBoundingClientRect().width - ellipsisWidth;
    }

    if (overflowItem) {
      const overflowSpan = overflowItem.element;
      // Break down textContent by single characters and reset overflow span
      const overflowCharacters = overflowSpan.textContent!.split('');
      overflowSpan.innerHTML = '';
      let currentWidth = 0;
      let overflowText = '';
      for (let i = 0; i < overflowCharacters.length - 1; i++) {
        const ch = overflowCharacters[i];
        const chSpan = this.renderer.createElement('span');
        chSpan.textContent = ch;
        this.renderer.appendChild(overflowSpan, chSpan);
        currentWidth += chSpan.getBoundingClientRect().width;
        // Break the loop if currentWidth already exceeds the available space
        if (currentWidth >= availableSpace) {
          break;
        }
        overflowText = overflowText + ch;
      }

      // Combine all span elements upto the point before the overflow span occured
      const overflowIdx = this.spanElements.findIndex(el => el.index === overflowItem?.index);
      const spansText = this.spanElements
        .slice(0, overflowIdx)
        .map(span => {
          if (span.element.textContent && /\s/g.test(span.element.textContent)) {
            return ' ';
          };
          return span.element.textContent;
        }).join('');
      
      if (!this.isTextWhiteSpace(overflowText)) {
        this.element.innerHTML = spansText.trim() + ' ' + overflowText + '...';
      } else {
        this.element.innerHTML = spansText.trim() + '...';
      }
    }
  }

  private isTextWhiteSpace(text: string): boolean {
    return /\s/g.test(text) || !text.trim();
  }
}

interface SpanElement {
  element: HTMLElement;
  index: number;
  width: number;
}