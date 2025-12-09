'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import FileDropzone from '@/components/converter/FileDropzone';
import FormatSelector from '@/components/converter/FormatSelector';
import { uploadAndConvert } from '@/lib/apiClient';

export default function WebpToPngPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [result, setResult] = useState<{
    mode: 'single' | 'multi';
    url: string;
    outputFormat?: string;
    originalName?: string;
    downloadName?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(Array.from(files));
    setResult(null);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setResult(null);
    }
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
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
    } catch (err) {
      console.error('Download error:', err);
      setError('Download failed. Please try again.');
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
    setTotalFiles(selectedFiles.length);

    // Single file: simple progress (no counting)
    if (selectedFiles.length === 1) {
      setProgress(1);
      setProgressStage('Uploading files...');

      let progressInterval: NodeJS.Timeout | null = null;
      let isComplete = false;

      // Continuous smooth progress from 1-95%
      const startProgress = () => {
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (isComplete) {
              if (progressInterval) clearInterval(progressInterval);
              return prev;
            }
            // Slow down as we approach 95%
            if (prev >= 90) {
              return Math.min(prev + 0.3, 95);
            } else if (prev >= 70) {
              return Math.min(prev + 0.5, 95);
            } else if (prev >= 40) {
              return Math.min(prev + 0.8, 95);
            } else {
              return Math.min(prev + 1.2, 95);
            }
          });
        }, 60);
      };

      startProgress();

      try {
        // Update stage messages as progress moves
        setTimeout(() => setProgressStage('Processing...'), 2000);
        setTimeout(() => setProgressStage('Converting...'), 5000);

        const response = await uploadAndConvert(selectedFiles, targetFormat);

        if (response.status === 'success') {
          isComplete = true;
          if (progressInterval) clearInterval(progressInterval);
          
          setProgressStage('Finalizing...');
          
          // Smoothly complete to 100%
          const completeInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 100) {
                clearInterval(completeInterval);
                return 100;
              }
              return Math.min(prev + 2, 100);
            });
          }, 50);

          setTimeout(() => {
            if (response.mode === 'single') {
              setResult({
                mode: 'single',
                url: response.downloadUrl,
                outputFormat: response.meta?.outputFormat,
                originalName: response.meta?.originalName,
                downloadName: response.meta?.downloadName,
              });
            } else if (response.mode === 'multi') {
              setResult({ mode: 'multi', url: response.zipUrl });
            }
            setProgress(0);
            setProgressStage('');
          }, 1000);
        }
      } catch (err: any) {
        isComplete = true;
        if (progressInterval) clearInterval(progressInterval);
        setProgress(0);
        setProgressStage('');
        if (err.message?.includes('fetch') || err.message?.includes('Network')) {
          setError('Network error: Could not connect to the server.');
        } else {
          setError(err.message || 'Conversion failed. Please try again.');
        }
        console.error('Conversion error:', err);
      } finally {
        setIsConverting(false);
      }
    } else {
      // Multiple files: process one by one with individual progress bars
      const processFileWithProgress = async (fileIndex: number, apiPromise: Promise<any>): Promise<void> => {
        return new Promise((resolve) => {
          setCurrentFileIndex(fileIndex);
          setProgress(1);
          setProgressStage(`Uploading file ${fileIndex + 1} of ${selectedFiles.length}...`);

          let progressInterval: NodeJS.Timeout | null = null;
          let isComplete = false;

          // Continuous smooth progress from 1-95%
          const startProgress = () => {
            progressInterval = setInterval(() => {
              setProgress((prev) => {
                if (isComplete) {
                  if (progressInterval) clearInterval(progressInterval);
                  return prev;
                }
                // Slow down as we approach 95%
                if (prev >= 90) {
                  return Math.min(prev + 0.3, 95);
                } else if (prev >= 70) {
                  return Math.min(prev + 0.5, 95);
                } else if (prev >= 40) {
                  return Math.min(prev + 0.8, 95);
                } else {
                  return Math.min(prev + 1.2, 95);
                }
              });
            }, 60);
          };

          startProgress();

          // Update stage messages as progress moves
          setTimeout(() => setProgressStage(`Processing file ${fileIndex + 1} of ${selectedFiles.length}...`), 2000);
          setTimeout(() => setProgressStage(`Converting file ${fileIndex + 1} of ${selectedFiles.length}...`), 5000);

          // Wait for API call to complete (like single file)
          apiPromise.then(() => {
            isComplete = true;
            if (progressInterval) clearInterval(progressInterval);
            
            setProgressStage(`Finalizing file ${fileIndex + 1} of ${selectedFiles.length}...`);
            
            // Smoothly complete to 100% only after API completes
            const completeInterval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 100) {
                  clearInterval(completeInterval);
                  resolve();
                  return 100;
                }
                return Math.min(prev + 2, 100);
              });
            }, 50);
          }).catch(() => {
            isComplete = true;
            if (progressInterval) clearInterval(progressInterval);
            resolve();
          });
        });
      };

      try {
        // Start API call immediately (don't wait for simulated progress)
        const apiPromise = uploadAndConvert(selectedFiles, targetFormat);

        // Process all files sequentially with individual progress
        // Each file shows progress, but we wait for actual API completion
        for (let i = 0; i < selectedFiles.length; i++) {
          await processFileWithProgress(i, apiPromise);
          // Small delay between files for visual effect
          if (i < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Wait for actual API response
        const response = await apiPromise;

        if (response.status === 'success') {
          if (response.mode === 'single') {
            setResult({
              mode: 'single',
              url: response.downloadUrl,
              outputFormat: response.meta?.outputFormat,
              originalName: response.meta?.originalName,
              downloadName: response.meta?.downloadName,
            });
          } else if (response.mode === 'multi') {
            setResult({ mode: 'multi', url: response.zipUrl });
          }
          setProgress(0);
          setProgressStage('');
        }
      } catch (err: any) {
        setProgress(0);
        setProgressStage('');
        if (err.message?.includes('fetch') || err.message?.includes('Network')) {
          setError('Network error: Could not connect to the server.');
        } else {
          setError(err.message || 'Conversion failed. Please try again.');
        }
        console.error('Conversion error:', err);
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleDownloadClick = () => {
    if (!result) return;

    if (result.mode === 'single') {
      const filename =
        result.downloadName ||
        (result.originalName
          ? `${result.originalName.replace(/\.[^/.]+$/, '')}.${result.outputFormat || targetFormat}`
          : `converted.${result.outputFormat || targetFormat}`);
      handleDownload(result.url, filename);
    } else {
      handleDownload(result.url, 'love-u-convert.zip');
    }
  };

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <Header />
      
      <main className="pt-[50px] pb-16">
        {/* Hero Title + Subtitle - Center, no background */}
        <div className="text-center pt-8 md:pt-12 px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-[#7C3AED]">
            WebP to PNG
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-[9px]">
            The best and most advanced way to convert WebP to PNG for free.
          </p>
        </div>

        {/* Main Converter Section */}
        <div className="max-w-[1040px] mx-auto px-4 md:px-6">
          {/* Dropzone Container - 40px below subtitle, leaves space for ads on sides */}
          <div className="max-w-[790px] mx-auto mt-[40px] my-[5px]">
            {/* Drag and Drop Zone */}
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
            />

            {/* File List - Below dropzone, same width, max 5 visible with scrolling */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 relative">
                {/* Left side solid line - matches container height */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 flex items-center">
                  <div className="h-full w-full border-l-2 border-solid border-gray-400 opacity-50"></div>
                </div>
                <div className="max-h-[340px] overflow-y-auto space-y-0 pr-2 pl-5 custom-scrollbar">
                  {selectedFiles.map((file, index) => {
                  const thumbnail = thumbnails.get(index);
                  return (
                    <div
                      key={index}
                      className="w-full flex items-center gap-3 py-2 px-3 bg-[#ffffff] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-md"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs font-medium">IMG</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Settings"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
                {/* Scrolling indicator - shows when more than 5 files */}
                {selectedFiles.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-2 h-16 pointer-events-none flex items-end justify-center pb-2">
                    <div className="bg-gradient-to-t from-white via-white/80 to-transparent w-full h-full flex items-end justify-center">
                      <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="w-1 h-6 bg-gray-400 rounded-full opacity-60"></div>
                        <div className="w-1 h-4 bg-gray-400 rounded-full opacity-40"></div>
                        <div className="w-1 h-2 bg-gray-400 rounded-full opacity-30"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Convert Section - Only show if files are selected, below dropzone */}
            {selectedFiles.length > 0 && (
              <div className="mt-[15px] space-y-4">
                {/* Settings Bar (Output Format) - Right aligned above button */}
                <div className="flex justify-end items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Output:</label>
                  <FormatSelector
                    value={targetFormat}
                    onChange={setTargetFormat}
                  />
                </div>

                {/* Progress Bar - Shows during conversion, above button */}
                {(isConverting || progress > 0) && (
                  <div className="space-y-2">
                    {progressStage && (
                      <p className="text-sm text-gray-600 text-center">{progressStage}</p>
                    )}
                    {totalFiles > 1 && (
                      <p className="text-xs text-gray-500 text-center">
                        File {currentFileIndex + 1} of {totalFiles}
                      </p>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#7D3CFF] to-[#A066FF] h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${progress}%` }}
                      >
                        {progress > 10 && (
                          <span className="text-xs text-white font-medium">{Math.floor(progress)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Convert / Download Button - Same width as dropzone, 15px high (margin) */}
                <button
                  onClick={result ? handleDownloadClick : handleConvert}
                  disabled={isConverting || isDownloading}
                  className={`w-full h-12 md:h-14 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.01] ${
                    result
                      ? 'bg-black hover:bg-gray-800'
                      : isConverting || isDownloading
                      ? 'bg-[#7C3AEE]/70 cursor-not-allowed'
                      : 'bg-[#7C3AEE] hover:bg-[#6D28D9]'
                  }`}
                >
                  {isConverting || isDownloading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {isDownloading
                          ? result?.mode === 'multi'
                            ? 'Preparing ZIP...'
                            : 'Preparing...'
                          : 'Converting...'}
                      </span>
                    </div>
                  ) : result ? (
                    result.mode === 'single' ? 'Download' : 'Download all'
                  ) : selectedFiles.length === 1 ? (
                    'Convert'
                  ) : (
                    'Convert all'
                  )}
                </button>

                {/* Download Complete Message */}
                {downloadComplete && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-sm text-green-700">
                      ✓ Download started! Check your downloads folder.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* How to Convert Section - Always visible, below convert section, same width as dropzone */}
            <div className="w-full rounded-lg py-6 px-4 md:px-6 mt-20 md:mt-24" style={{ backgroundColor: 'rgba(239, 238, 243, 0.4)' }}>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-4 opacity-60">
                How to convert WebP to PNG
              </h2>
              <p className="text-sm md:text-base text-gray-600 text-center opacity-60 mb-8">
                Quick and easy conversion in 3 simple steps:
              </p>
              
              {/* Steps List - Left aligned */}
              <div className="space-y-6 text-left">
                {/* Step 1 */}
                <div className="opacity-60">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-bold text-gray-900">1. -</span>
                    <span className="font-bold text-gray-900">Upload Files</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 ml-6">
                    Drag & drop WebP files or click 'Upload' to select from device.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="opacity-60">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-bold text-gray-900">2. -</span>
                    <span className="font-bold text-gray-900">Convert</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 ml-6">
                    Click 'Convert' button to transform files to PNG format.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="opacity-60">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-bold text-gray-900">3. -</span>
                    <span className="font-bold text-gray-900">Download</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 ml-6">
                    Single file: Click 'Download'. Multiple files: Click 'Download All' for ZIP.
                  </p>
                </div>
              </div>

              {/* Feature Cards Section - Immediately below steps */}
              <div className="w-full mt-8 md:mt-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
                  {/* Card 1: Best WebP to PNG Converter */}
                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
                    {/* Trophy Icon */}
                    <div className="flex justify-center mb-5">
                      <span className="text-5xl">🏆</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Best WebP to PNG Converter
                      </h3>
                      <p className="text-sm text-gray-600">
                        Convert WebP to PNG with high quality. Our tool ensures excellent transparency and also helps convert animated WebP to PNG. Get reliable results instantly.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: SSL/TLS Encryption */}
                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
                    {/* Padlock Icon */}
                    <div className="flex justify-center mb-5">
                      <span className="text-5xl">🔒</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        SSL/TLS Encryption
                      </h3>
                      <p className="text-sm text-gray-600">
                        Your privacy is our priority. All file transfers (uploads and downloads) are secured with SSL/TLS encryption, creating a private, encrypted channel between your device and our servers. They are fully protected from third-party access during transfer.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Free, Fast & Secured */}
                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
                    {/* Lightning Bolt Icon */}
                    <div className="flex justify-center mb-5">
                      <span className="text-5xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Free, Fast & Secured
                      </h3>
                      <p className="text-sm text-gray-600">
                        Experience the difference with our free converter that runs quickly on any web browser. We guarantee file security and privacy. All files are protected by 256-bit SSL encryption and are automatically deleted from our servers within a few hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
