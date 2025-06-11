import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EnterpriseAiEcomWidget } from './EnterpriseAiEcomWidget';

// Store roots by element reference to properly unmount later
const roots = new Map<HTMLElement, Root>();

export function mount(el: HTMLElement, options?: any) {
  const root = createRoot(el);
  roots.set(el, root);
  root.render(<EnterpriseAiEcomWidget {...options} />);
}

export function unmount(el: HTMLElement) {
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
}

export { EnterpriseAiEcomWidget };
