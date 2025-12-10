'use client';

import { useState, useRef, useEffect } from 'react';

interface FileDropzoneProps {
  onFilesSelected?: (files: File[]) => void;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

// Allowed input formats: png, bmp, eps, gif, ico, jpeg, jpg, svg, ps, tga, tiff, webp
const ACCEPTED_FORMATS = 'image/png,image/bmp,image/gif,image/jpeg,image/jpg,image/svg+xml,image/webp,image/x-icon,image/vnd.adobe.photoshop,image/tiff,application/postscript,image/x-tga';

export default function FileDropzone({ 
  onFilesSelected, 
  selectedFiles = [],
  onRemoveFile 
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Create thumbnails for image files
  useEffect(() => {
    const newThumbnails = new Map<number, string>();
    selectedFiles.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        newThumbnails.set(index, URL.createObjectURL(file));
      }
    });
    setThumbnails(newThumbnails);

    // Cleanup thumbnails on unmount or when files change
    return () => {
      newThumbnails.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    onFilesSelected?.(fileArray);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="relative w-full">
      <div
        className={`w-full h-[200px] md:h-[310px] rounded-xl border-2 border-dashed bg-[#efeef3] shadow-[0_18px_45px_rgba(15,23,42,0.07)] px-5 md:px-10 py-6 md:py-12 flex flex-col items-center transition-all duration-200 ${
          isDragging
            ? 'border-purple-500 bg-purple-50/60 shadow-[0_22px_55px_rgba(88,28,135,0.35)]'
            : 'border-purple-400 hover:shadow-[0_20px_50px_rgba(124,58,237,0.25)]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FORMATS}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative">
            <button
              onClick={handleSelectFilesClick}
              className="relative inline-flex items-center gap-3 h-12 md:h-14 px-6 md:px-8 bg-gradient-to-r from-[#7D3CFF] to-[#A066FF] hover:from-[#6D2CE6] hover:to-[#8F55E6] text-white text-base md:text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
            >
              {/* Cloud Upload Icon */}
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Select Files</span>
              <div
                onClick={handleArrowClick}
                className="ml-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden"
              >
                <button
                  onClick={handleSelectFilesClick}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3"
                >
                  {/* Laptop/Monitor Icon */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-900">From Device</span>
                </button>
                <button
                  disabled
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 cursor-not-allowed opacity-60"
                  title="Coming soon"
                >
                  {/* Google Drive Icon */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.71 2.5L1.15 15l3.42 5.91L12.85 8.4l-5.14-5.9zm9.58 0L12.85 8.4l8.28 12.51L23.85 15 17.29 2.5zM1.15 15l6.56 11.5 3.42-5.91L4.57 15H1.15z"/>
                  </svg>
                  <span className="font-medium text-gray-900">Google Drive</span>
                </button>
                <button
                  disabled
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 cursor-not-allowed opacity-60"
                  title="Coming soon"
                >
                  {/* OneDrive Icon - Cloud */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="font-medium text-gray-900">OneDrive</span>
                </button>
                <button
                  disabled
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 cursor-not-allowed opacity-60"
                  title="Coming soon"
                >
                  {/* Link/URL Icon */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="font-medium text-gray-900">From URL</span>
                </button>
                <button
                  disabled
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 cursor-not-allowed opacity-60"
                  title="Coming soon"
                >
                  {/* Dropbox Icon */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 2L2 7l4 5-4 5 4 5h12l4-5-4-5 4-5-4-5H6zm10 14.5L12 20l-4-3.5L8 13l4 3.5 4-3.5-2 3.5zm-4-4L8 9l4 3.5L16 9l-4 3.5z"/>
                  </svg>
                  <span className="font-medium text-gray-900">Dropbox</span>
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 md:mt-3 text-xs md:text-sm text-slate-500">
            Or drag and drop files here
          </p>
        </div>
      </div>
    </div>
  );
}
