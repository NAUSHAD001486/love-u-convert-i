export const SUPPORTED_FORMATS = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
  ARCHIVE: ['zip', 'rar', '7z'],
} as const;

export function isValidFormat(format: string, category: keyof typeof SUPPORTED_FORMATS): boolean {
  const formats = SUPPORTED_FORMATS[category] as readonly string[];
  return formats.includes(format.toLowerCase());
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

