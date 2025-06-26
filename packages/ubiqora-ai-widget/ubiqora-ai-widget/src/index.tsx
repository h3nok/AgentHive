import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EmbeddedWidget } from './TscAiEcomWidget';

// Store root instances for proper unmounting
const rootInstances = new WeakMap<HTMLElement, Root>();

export function mount(el: HTMLElement, options?: any) {
  const root = createRoot(el);
  rootInstances.set(el, root);
  root.render(<EmbeddedWidget {...options} />);
}

export function unmount(el: HTMLElement) {
  const root = rootInstances.get(el);
  if (root) {
    root.unmount();
    rootInstances.delete(el);
  }
}

export { EmbeddedWidget };
