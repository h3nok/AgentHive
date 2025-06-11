import React, { useState } from 'react';
import { WidgetLauncher } from './WidgetLauncher';
import { WidgetWindow } from './WidgetWindow';
import SupportWidget from './SupportWidget';

export function EnterpriseAiEcomWidget(props: any) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <WidgetLauncher onClick={() => setOpen(true)} />
      {open && <WidgetWindow onClose={() => setOpen(false)} />}
    </>
  );
}
