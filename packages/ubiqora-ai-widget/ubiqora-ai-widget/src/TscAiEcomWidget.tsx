import React, { useState } from 'react';
import { WidgetLauncher } from './WidgetLauncher';
import { WidgetWindow } from './WidgetWindow';

export function EmbeddedWidget(props: any) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <WidgetLauncher onClick={() => setOpen(true)} />
      {open && <WidgetWindow onClose={() => setOpen(false)} />}
    </>
  );
}
