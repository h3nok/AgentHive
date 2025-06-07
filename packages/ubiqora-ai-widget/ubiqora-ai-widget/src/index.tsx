import React from 'react';
import ReactDOM from 'react-dom';
import { EmbeddedWidget } from './TscAiEcomWidget';

export function mount(el: HTMLElement, options?: any) {
  ReactDOM.render(<EmbeddedWidget {...options} />, el);
}

export function unmount(el: HTMLElement) {
  ReactDOM.unmountComponentAtNode(el);
}

export { EmbeddedWidget };
