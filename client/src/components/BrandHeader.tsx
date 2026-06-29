// src/components/BrandHeader.tsx
import React from 'react';
import { ClarixLogo } from './ClarixLogo';

export const BrandHeader: React.FC = () => {
  return (
    <div className="flex items-center gap-3 px-2 pt-2">
      {/* Bumped to w-9 h-9, added shrink-0 so long text never squishes the logo */}
      <ClarixLogo className="w-9 h-9 shrink-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
      <span className="font-serif text-xl tracking-widest uppercase font-medium">Clarix</span>
    </div>
  );
};