// src/components/ClarixLogo.tsx
import React from 'react';

export const ClarixLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* THE <rect> WAS DELETED HERE! THE BACKDROP IS NOW TRANSPARENT. */}

      {/* incoming information */}
      <path
        d="M52 80 L104 116"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.25"
      />

      <path
        d="M52 128 L104 128"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.55"
      />

      <path
        d="M52 176 L104 140"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* clarity prism */}
      <path
        d="M128 78
           L178 128
           L128 178
           L78 128
           Z"
        fill="none"
        stroke="white"
        strokeWidth="10"
        strokeLinejoin="round"
      />

      {/* internal focus */}
      <circle
        cx="128"
        cy="128"
        r="12"
        fill="white"
      />

      {/* verified output */}
      <path
        d="M152 128 L208 128"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
};