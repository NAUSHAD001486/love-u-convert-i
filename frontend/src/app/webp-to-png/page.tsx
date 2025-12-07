'use client';

import { useState } from 'react';
import FileDropzone from '@/components/converter/FileDropzone';
import FormatSelector from '@/components/converter/FormatSelector';
import ConvertButton from '@/components/converter/ConvertButton';
import { uploadAndConvert } from '@/lib/apiClient';

export default function WebpToPngPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ mode: 'single' | 'multi'; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(Array.from(files));
    // Clear previous results when new files are selected
    setResult(null);
    setError(null);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to direct link if blob download fails
      window.open(url, '_blank');
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadAndConvert(selectedFiles, targetFormat);

      if (response.status === 'success') {
        if (response.mode === 'single') {
          setResult({ mode: 'single', url: response.downloadUrl });
        } else if (response.mode === 'multi') {
          setResult({ mode: 'multi', url: response.zipUrl });
        }
      }
    } catch (err: any) {
      // Handle network errors or API errors
      if (err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError('Network error: Could not connect to the server.');
      } else {
        setError(err.message || 'Conversion failed. Please try again.');
      }
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
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

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg">
              <p className="text-green-300 text-sm mb-3">
                {result.mode === 'single'
                  ? 'Your file is ready!'
                  : 'Your ZIP file is ready!'}
              </p>
              {result.mode === 'multi' ? (
                <button
                  onClick={() => handleDownload(result.url, 'love-u-convert.zip')}
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Download ZIP
                </button>
              ) : (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Download File
                </a>
              )}
            </div>
          )}

          <ConvertButton
            disabled={isConverting || selectedFiles.length === 0}
            isLoading={isConverting}
            onClick={handleConvert}
          />

          <div className="mt-8 p-4 bg-slate-900 rounded border border-slate-700">
            <p className="text-sm text-slate-400">
              <strong className="text-slate-300">Backend API:</strong> calling{' '}
              <code className="text-blue-400">/api/convert</code> (implemented on AWS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
