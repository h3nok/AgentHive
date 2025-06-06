/**
 * Enterprise-grade accessibility testing and validation utilities
 */

// ARIA live region manager for announcements
class AriaLiveManager {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private announceQueue: Array<{ message: string; priority: 'polite' | 'assertive' }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializeLiveRegions();
  }

  private initializeLiveRegions() {
    if (typeof window === 'undefined') return;

    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    this.politeRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.style.cssText = this.politeRegion.style.cssText;
    document.body.appendChild(this.assertiveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!message.trim()) return;

    this.announceQueue.push({ message, priority });
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessingQueue = true;

    while (this.announceQueue.length > 0) {
      const { message, priority } = this.announceQueue.shift()!;
      const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
      
      if (region) {
        region.textContent = message;
        
        // Clear after announcement to avoid repetition
        setTimeout(() => {
          if (region) region.textContent = '';
        }, 1000);
      }

      // Wait between announcements to avoid overwhelming screen readers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessingQueue = false;
  }

  destroy() {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
      this.assertiveRegion = null;
    }
  }
}

// Global instance
export const ariaLiveManager = new AriaLiveManager();

// Accessibility validation utilities
export const validateAccessibility = {
  // Check if element has proper ARIA labels
  checkAriaLabels: (element: Element): Array<{ type: 'error' | 'warning'; message: string }> => {
    const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    // Check interactive elements have accessible names
    if (element.matches('button, [role="button"], input, select, textarea, [role="textbox"]')) {
      const hasAccessibleName = (
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent?.trim() ||
        element.getAttribute('title') ||
        (element as HTMLInputElement).placeholder
      );
      
      if (!hasAccessibleName) {
        issues.push({
          type: 'error',
          message: `Interactive element lacks accessible name: ${element.tagName.toLowerCase()}`
        });
      }
    }

    // Check for proper heading hierarchy
    if (element.matches('h1, h2, h3, h4, h5, h6')) {
      const level = parseInt(element.tagName[1]);
      const previousHeading = element.ownerDocument?.querySelector(`h1, h2, h3, h4, h5, h6`);
      
      if (previousHeading) {
        const prevLevel = parseInt(previousHeading.tagName[1]);
        if (level > prevLevel + 1) {
          issues.push({
            type: 'warning',
            message: `Heading level jumps from h${prevLevel} to h${level}`
          });
        }
      }
    }

    return issues;
  },

  // Check color contrast (simplified)
  checkColorContrast: (element: Element): boolean => {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    // This is a simplified check - in production, you'd use a proper contrast calculation
    return color !== backgroundColor;
  },

  // Check keyboard navigation
  checkKeyboardAccess: (container: Element): Array<{ type: 'error' | 'warning'; message: string }> => {
    const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      
      // Check for positive tab indices (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          type: 'warning',
          message: `Element uses positive tabindex: ${tabIndex}. Consider using 0 or -1.`
        });
      }

      // Check if focusable element is visible
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        issues.push({
          type: 'warning',
          message: `Focusable element is not visible`
        });
      }
    });

    return issues;
  },
};

// Screen reader testing utilities
export const screenReaderUtils = {
  // Simulate screen reader navigation
  simulateScreenReaderTab: (container: Element, direction: 'forward' | 'backward' = 'forward') => {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
      )
    ) as HTMLElement[];

    const currentFocus = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentFocus);
    
    let nextIndex: number;
    if (direction === 'forward') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= focusableElements.length) nextIndex = 0;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = focusableElements.length - 1;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      nextElement.focus();
      return nextElement;
    }
    return null;
  },

  // Get accessible name of element
  getAccessibleName: (element: Element): string => {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }

    // Check title attribute
    const title = element.getAttribute('title');
    if (title) return title;

    // Check placeholder for inputs
    if (element instanceof HTMLInputElement && element.placeholder) {
      return element.placeholder;
    }

    // Fall back to text content
    return element.textContent || '';
  },
};

// High contrast mode detection
export const detectHighContrastMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Create a test element to detect high contrast mode
  const testElement = document.createElement('div');
  testElement.style.cssText = `
    position: absolute;
    top: -9999px;
    width: 1px;
    height: 1px;
    background-color: rgb(255, 255, 255);
    color: rgb(0, 0, 0);
  `;
  
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const isHighContrast = (
    computedStyle.backgroundColor === computedStyle.color ||
    computedStyle.backgroundImage !== 'none'
  );
  
  document.body.removeChild(testElement);
  return isHighContrast;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Focus management utilities
export const focusUtils = {
  trapFocus: (container: Element) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const trapTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', trapTabKey);
    
    return () => {
      container.removeEventListener('keydown', trapTabKey);
    };
  },

  restoreFocus: (previousActiveElement: Element | null) => {
    if (previousActiveElement && 'focus' in previousActiveElement) {
      (previousActiveElement as HTMLElement).focus();
    }
  },
};

// Export all utilities
export default {
  ariaLiveManager,
  validateAccessibility,
  screenReaderUtils,
  detectHighContrastMode,
  prefersReducedMotion,
  focusUtils,
};
