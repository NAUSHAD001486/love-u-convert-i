export type ConverterToolId =
  | 'webp-to-png'
  | 'png-to-webp'
  | 'jpg-to-png'
  | 'png-to-jpg';

export type ConverterTool = {
  id: ConverterToolId;
  slug: string; // route path
  title: string; // page hero title
  subtitle: string; // hero subtitle
  inputLabel: string; // e.g. "Upload WebP images"
  defaultTargetFormat: string; // "png", "webp", ...
  allowedOutputFormats: string[]; // dropdown options for that page
  seoTitle: string;
  seoDescription: string;
};

export const CONVERTER_TOOLS: ConverterTool[] = [
  {
    id: 'webp-to-png',
    slug: 'webp-to-png',
    title: 'WebP to PNG',
    subtitle: 'The best and most advanced way to convert WebP to PNG for free.',
    inputLabel: 'Upload WebP images',
    defaultTargetFormat: 'png',
    allowedOutputFormats: ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'],
    seoTitle:
      'WebP to PNG, WebP to PNG Converter – Free, Fast & Secure | Love U convert',
    seoDescription:
      'Convert WebP to PNG free, fast, and secure. No installation required. Batch convert multiple WebP files to PNG format online with our easy-to-use converter tool.',
  },
  {
    id: 'png-to-webp',
    slug: 'png-to-webp',
    title: 'PNG to WebP',
    subtitle: 'Compress PNG images to modern WebP format without losing quality.',
    inputLabel: 'Upload PNG images',
    defaultTargetFormat: 'webp',
    allowedOutputFormats: ['webp', 'png', 'jpg', 'jpeg'],
    seoTitle:
      'PNG to WebP, PNG to WebP Converter – Free, Fast & Secure | Love U convert',
    seoDescription:
      'Convert PNG to WebP online. Reduce file size while keeping quality for faster websites and apps.',
  },
  {
    id: 'jpg-to-png',
    slug: 'jpg-to-png',
    title: 'JPG to PNG',
    subtitle: 'Convert JPG images to transparent-ready PNG in seconds.',
    inputLabel: 'Upload JPG images',
    defaultTargetFormat: 'png',
    allowedOutputFormats: ['png', 'jpg', 'jpeg', 'webp'],
    seoTitle:
      'JPG to PNG, JPG to PNG Converter – Free, Fast & Secure | Love U convert',
    seoDescription:
      'Convert JPG to PNG online with high quality and support for transparency.',
  },
  {
    id: 'png-to-jpg',
    slug: 'png-to-jpg',
    title: 'PNG to JPG',
    subtitle: 'Turn PNG images into lightweight JPGs optimized for the web.',
    inputLabel: 'Upload PNG images',
    defaultTargetFormat: 'jpg',
    allowedOutputFormats: ['jpg', 'jpeg', 'png', 'webp'],
    seoTitle:
      'PNG to JPG, PNG to JPG Converter – Free, Fast & Secure | Love U convert',
    seoDescription:
      'Convert PNG to JPG with smart compression for smaller file sizes.',
  },
];

export function getToolBySlug(slug: string): ConverterTool | undefined {
  return CONVERTER_TOOLS.find((t) => t.slug === slug);
}

