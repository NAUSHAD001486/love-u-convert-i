'use client';

import { useState } from 'react';
import FileDropzone from '@/components/converter/FileDropzone';
import FormatSelector from '@/components/converter/FormatSelector';
import ConvertButton from '@/components/converter/ConvertButton';

export default function WebpToPngPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [isConverting, setIsConverting] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsConverting(true);
    
    // Log to console for now (no API call yet)
    console.log({
      selectedFiles: selectedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      targetFormat,
    });

    // Simulate conversion delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsConverting(false);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">
          WebP to PNG Converter
        </h1>
        <p className="text-slate-400 text-center mb-8">
          Convert your images to various formats
        </p>

        <div className="bg-slate-800 rounded-lg p-8 space-y-6">
          <FileDropzone onFilesSelected={handleFilesSelected} />

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-400 mb-2">
                Selected files ({selectedFiles.length}):
              </p>
              <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-slate-300 text-sm">
                    • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Format
            </label>
            <FormatSelector
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
            />
          </div>

          <ConvertButton
            disabled={selectedFiles.length === 0}
            isLoading={isConverting}
            onClick={handleConvert}
          />

          <div className="mt-8 p-4 bg-slate-900 rounded border border-slate-700">
            <p className="text-sm text-slate-400">
              <strong className="text-slate-300">Backend API:</strong> will call{' '}
              <code className="text-blue-400">/api/convert</code> (implemented on AWS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

