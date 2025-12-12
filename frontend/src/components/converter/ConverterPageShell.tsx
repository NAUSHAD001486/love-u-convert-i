'use client';

import { useState, useEffect, useRef } from 'react';
import { ConverterTool } from '@/config/tools';
import FileDropzone from '@/components/converter/FileDropzone';
import FormatSelector from '@/components/converter/FormatSelector';
import { uploadAndConvert } from '@/lib/apiClient';

type Props = { tool: ConverterTool };

export function ConverterPageShell({ tool }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>(tool.defaultTargetFormat);
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showFileSizeNotification, setShowFileSizeNotification] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const convertButtonRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

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

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  // Auto-scroll to convert button when files are first selected
  useEffect(() => {
    if (selectedFiles.length > 0 && !hasScrolledRef.current && convertButtonRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        const element = convertButtonRef.current;
        if (element) {
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 40;
          
          const startPosition = window.pageYOffset;
          const distance = (offsetPosition - startPosition) * 0.3;
          const duration = 800;
          let startTime: number | null = null;

          const animateScroll = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const ease = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      }, 100);
    }
    if (selectedFiles.length === 0) {
      hasScrolledRef.current = false;
    }
  }, [selectedFiles.length]);

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
    'Hindi'
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prevFiles) => {
      const newFiles = Array.from(files);
      const combinedFiles = [...prevFiles];
      newFiles.forEach((newFile) => {
        const isDuplicate = combinedFiles.some(
          (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size
        );
        if (!isDuplicate) {
          combinedFiles.push(newFile);
        }
      });
      return combinedFiles;
    });
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

    if (selectedFiles.length === 1) {
      setProgress(1);
      setProgressStage('Uploading files...');

      let progressInterval: NodeJS.Timeout | null = null;
      let isComplete = false;

      const startProgress = () => {
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (isComplete) {
              if (progressInterval) clearInterval(progressInterval);
              return prev;
            }
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
        setTimeout(() => setProgressStage('Processing...'), 2000);
        setTimeout(() => setProgressStage('Converting...'), 5000);

        const response = await uploadAndConvert(selectedFiles, targetFormat);

        if (response.status === 'success') {
          isComplete = true;
          if (progressInterval) clearInterval(progressInterval);
          
          setProgressStage('Finalizing...');
          
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
        } else if (err.message?.includes('File size too large') || err.message?.includes('10485760') || err.message?.includes('Maximum is') || err.message?.includes('too large')) {
          setShowFileSizeNotification(true);
          setTimeout(() => {
            setShowFileSizeNotification(false);
          }, 1000);
          setError('File size exceeds the limit. Please use a smaller file or upgrade your plan for higher limits.');
        } else {
          setError(err.message || 'Conversion failed. Please try again.');
        }
        console.error('Conversion error:', err);
      } finally {
        setIsConverting(false);
      }
    } else {
      const processFileWithProgress = async (fileIndex: number, apiPromise: Promise<any>): Promise<void> => {
        return new Promise((resolve) => {
          setCurrentFileIndex(fileIndex);
          setProgress(1);
          setProgressStage(`Uploading file ${fileIndex + 1} of ${selectedFiles.length}...`);

          let progressInterval: NodeJS.Timeout | null = null;
          let isComplete = false;

          const startProgress = () => {
            progressInterval = setInterval(() => {
              setProgress((prev) => {
                if (isComplete) {
                  if (progressInterval) clearInterval(progressInterval);
                  return prev;
                }
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

          setTimeout(() => setProgressStage(`Processing file ${fileIndex + 1} of ${selectedFiles.length}...`), 2000);
          setTimeout(() => setProgressStage(`Converting file ${fileIndex + 1} of ${selectedFiles.length}...`), 5000);

          apiPromise.then(() => {
            isComplete = true;
            if (progressInterval) clearInterval(progressInterval);
            
            setProgressStage(`Finalizing file ${fileIndex + 1} of ${selectedFiles.length}...`);
            
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
        const apiPromise = uploadAndConvert(selectedFiles, targetFormat);

        for (let i = 0; i < selectedFiles.length; i++) {
          await processFileWithProgress(i, apiPromise);
          if (i < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

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
        } else if (err.message?.includes('File size too large') || err.message?.includes('10485760') || err.message?.includes('Maximum is') || err.message?.includes('too large')) {
          setShowFileSizeNotification(true);
          setTimeout(() => {
            setShowFileSizeNotification(false);
          }, 1000);
          setError('File size exceeds the limit. Please use a smaller file or upgrade your plan for higher limits.');
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

  // Dynamic format names for "How to convert" section
  const inputFormat = tool.title.split(' to ')[0];
  const outputFormat = tool.title.split(' to ')[1] || tool.defaultTargetFormat.toUpperCase();

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
        .language-dropdown-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8f9fa;
        }
        .language-dropdown-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .language-dropdown-scrollbar::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 3px;
        }
        .language-dropdown-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .language-dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        {showFileSizeNotification && (
          <div className="fixed top-[60px] left-0 right-0 z-50 flex justify-center animate-in fade-in slide-in-from-top duration-300">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg mx-4 max-w-md">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">
                  File size exceeds the limit. Please use a smaller file or upgrade your plan for higher limits.
                </p>
              </div>
            </div>
          </div>
        )}
      
      <main className="pt-[50px] pb-16">
        <div className="text-center pt-8 md:pt-12 px-4">
          <h1 className="text-[2.16rem] md:text-[3.45rem] font-bold text-black">
            {tool.title}
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-[9px]">
            {tool.subtitle}
          </p>
        </div>

        <div className="max-w-[1040px] mx-auto px-4 md:px-6">
          <div className="max-w-[790px] mx-auto mt-[40px] my-[5px]">
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
            />

            {selectedFiles.length > 0 && (
              <div className="mt-4 relative">
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

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div ref={convertButtonRef} className="mt-[15px] space-y-4">
                <div className="flex justify-end items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Output:</label>
                  <FormatSelector
                    value={targetFormat}
                    onChange={setTargetFormat}
                    allowedFormats={tool.allowedOutputFormats}
                  />
                </div>

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

                {downloadComplete && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-sm text-green-700">
                      ✓ Download started! Check your downloads folder.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="w-full rounded-lg py-6 px-4 md:px-6 mt-20 md:mt-24" style={{ backgroundColor: 'rgba(239, 238, 243, 0.4)' }}>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-4 opacity-60">
                How to convert {inputFormat} to {outputFormat}
              </h2>
              <p className="text-sm md:text-base text-gray-600 text-center opacity-60 mb-8">
                Quick and easy conversion in 3 simple steps:
              </p>
              
              <div className="space-y-6 text-left">
                <div className="opacity-60">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-bold text-gray-900">1. -</span>
                    <span className="font-bold text-gray-900">Upload Files</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 ml-6">
                    Drag & drop {inputFormat} files or click 'Upload' to select from device.
                  </p>
                </div>

                <div className="opacity-60">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-bold text-gray-900">2. -</span>
                    <span className="font-bold text-gray-900">Convert</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 ml-6">
                    Click 'Convert' button to transform files to {outputFormat} format.
                  </p>
                </div>

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

              <div className="w-full mt-8 md:mt-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
                    <div className="flex justify-center mb-5">
                      <span className="text-5xl">🏆</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Best {tool.title} Converter
                      </h3>
                      <p className="text-sm text-gray-600">
                        Convert {inputFormat} to {outputFormat} with high quality. Our tool ensures excellent results and reliable conversions instantly.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
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

                  <div className="bg-white rounded-lg shadow-md p-7 md:p-8 text-center min-h-[420px] flex flex-col opacity-70">
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

      <section className="w-full py-16 md:py-20 px-4">
        <div className="max-w-[1040px] mx-auto px-4 md:px-6">
          <div className="max-w-[790px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-12 md:mb-16 opacity-75">
              Frequently Asked Questions (FAQs)
            </h2>
            
            <div className="space-y-0">
            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  What is {inputFormat} image?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 0 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 0 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    {inputFormat} is a popular image format used for various purposes. It offers good quality and compatibility across different platforms and applications.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  What is {outputFormat} image?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 1 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 1 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    {outputFormat} is a widely used image format known for its quality and features. It's suitable for various applications and provides excellent results.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  Is it free to convert {inputFormat} to {outputFormat} using Love U Convert?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 2 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 2 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    Yes, Love U Convert converts {inputFormat} to {outputFormat} for free.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  Are all my files safe when converting {inputFormat} to {outputFormat}?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 3 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 3 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    Yes, Love U Convert's {tool.title} converter secures all file transfers (uploads and downloads) with SSL/TLS encryption.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  Do I need to install any software/app to convert {inputFormat} to {outputFormat}?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 4 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 4 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    No, you don't need to install any software/app to convert {inputFormat} to {outputFormat}. The conversion happens directly in your web browser.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 rounded-lg shadow-sm opacity-90">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
                className="w-full flex items-center justify-between py-4 px-4 bg-white hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <span className="font-bold text-gray-900 text-base md:text-lg opacity-75">
                  Can I convert multiple {inputFormat} files to {outputFormat} at once?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    openFaqIndex === 5 ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === 5 && (
                <div className="px-4 pb-4 bg-white rounded-b-lg">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed opacity-75">
                    Absolutely! Our tool is built for maximum efficiency and handles batch conversions effortlessly. You can upload as many {inputFormat} files as you need simultaneously. Once the conversion is done: If you uploaded just one file, you can download the resulting {outputFormat} directly. If you uploaded multiple files, the tool automatically bundles all your new {outputFormat}s into a single, convenient ZIP file for quick download. This saves you a ton of time compared to converting images one by one!
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#292931] text-white py-16 md:py-20 mt-20 md:mt-24">
        <div className="max-w-[1040px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 mb-16">
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Support</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Tutorial
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white transition-colors text-sm block">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Language</h3>
              <div className="relative inline-block" ref={languageDropdownRef}>
                {showComingSoon && (
                  <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-purple-500/60 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap animate-in fade-in duration-200">
                    Coming soon
                  </div>
                )}
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full md:w-[200px] px-5 py-2.5 bg-white hover:bg-white/90 rounded-lg text-black text-sm flex items-center justify-between gap-3 transition-colors"
                >
                  <span>{selectedLanguage}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 text-black ${
                      showLanguageDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-full md:w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto language-dropdown-scrollbar">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            if (lang !== 'English') {
                              setShowComingSoon(true);
                              setShowLanguageDropdown(false);
                              setTimeout(() => {
                                setShowComingSoon(false);
                                setSelectedLanguage('English');
                              }, 1000);
                            } else {
                              setSelectedLanguage(lang);
                              setShowLanguageDropdown(false);
                            }
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedLanguage === lang
                              ? 'bg-purple-500/20 text-black font-medium'
                              : 'text-black/80 hover:bg-gray-50 hover:text-black'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-white/80 text-sm">
              © 2024 Love U Convert. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                Facebook
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                Twitter
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
