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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [result, setResult] = useState<{ mode: 'single' | 'multi'; url: string; outputFormat?: string; originalName?: string; downloadName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(Array.from(files));
    // Clear previous results when new files are selected
    setResult(null);
    setError(null);
  };

  const handleDownload = async (url: string, filename: string) => {
    setIsDownloading(true);
    setDownloadComplete(false);
    
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
      
      setDownloadComplete(true);
      // Clear confirmation message after 3 seconds
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
    } catch (err) {
      console.error('Download error:', err);
      setError('Download failed. Please try again.');
      // Fallback to direct link if blob download fails
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
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
          setResult({ 
            mode: 'single', 
            url: response.downloadUrl,
            outputFormat: response.meta?.outputFormat,
            originalName: response.meta?.originalName,
            downloadName: response.meta?.downloadName
          });
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

          {isConverting && (
            <div className="mt-4 rounded-md bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-ping rounded-full bg-blue-400" />
              <span>Converting your files… please wait.</span>
            </div>
          )}

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
                <div className="space-y-3">
                  {isDownloading && (
                    <div className="rounded-md bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 flex items-center gap-2">
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      <span>Preparing your ZIP file… this may take 10–20 seconds.</span>
                    </div>
                  )}
                  {downloadComplete && (
                    <div className="rounded-md bg-green-800/50 border border-green-600 px-4 py-2 text-sm text-green-200">
                      ✓ Download started! Check your downloads folder.
                    </div>
                  )}
                  <button
                    onClick={() => handleDownload(result.url, 'love-u-convert.zip')}
                    disabled={isDownloading}
                    className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    {isDownloading ? 'Preparing ZIP...' : 'Download ZIP'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {isDownloading && (
                    <div className="rounded-md bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 flex items-center gap-2">
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      <span>Preparing your file for download…</span>
                    </div>
                  )}
                  {downloadComplete && (
                    <div className="rounded-md bg-green-800/50 border border-green-600 px-4 py-2 text-sm text-green-200">
                      ✓ Download started! Check your downloads folder.
                    </div>
                  )}
                  <button
                    onClick={() => {
                      // Use downloadName from meta if available, otherwise generate
                      const filename = result.downloadName || 
                        (result.originalName 
                          ? `${result.originalName.replace(/\.[^/.]+$/, '')}.${result.outputFormat || targetFormat}`
                          : `converted.${result.outputFormat || targetFormat}`);
                      handleDownload(result.url, filename);
                    }}
                    disabled={isDownloading}
                    className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    {isDownloading ? 'Preparing...' : 'Download File'}
                  </button>
                </div>
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
