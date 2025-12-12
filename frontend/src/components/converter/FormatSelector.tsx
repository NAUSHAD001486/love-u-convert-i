'use client';

import { useState, useRef, useEffect } from 'react';

interface FormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
  allowedFormats?: string[]; // Optional: filter formats by allowed list
}

const allFormats = [
  { value: 'png', label: 'PNG' },
  { value: 'bmp', label: 'BMP' },
  { value: 'eps', label: 'EPS' },
  { value: 'gif', label: 'GIF' },
  { value: 'ico', label: 'ICO' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'svg', label: 'SVG' },
  { value: 'psd', label: 'PSD' },
  { value: 'tga', label: 'TGA' },
  { value: 'tiff', label: 'TIFF' },
  { value: 'webp', label: 'WebP' },
];

export default function FormatSelector({ value, onChange, allowedFormats }: FormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter formats if allowedFormats is provided
  const formats = allowedFormats
    ? allFormats.filter((f) => allowedFormats.includes(f.value))
    : allFormats;

  const selectedFormat = formats.find((f) => f.value === value) || formats[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        {selectedFormat.label}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => {
                onChange(format.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                format.value === value
                  ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
