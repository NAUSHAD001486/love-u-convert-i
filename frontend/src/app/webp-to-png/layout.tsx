import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'WebP to PNG Converter – Free, Fast & Secure | Love U convert',
  description:
    'Convert WebP to PNG free, fast, and secure. No installation required. Batch convert multiple WebP files to PNG format online with our easy-to-use converter tool.',
  robots: 'index,follow',
  alternates: {
    canonical: 'https://loveuconvert.com/webp-to-png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Love U convert',
    title: 'WebP to PNG Converter – Free, Fast & Secure | Love U convert',
    description:
      'Convert WebP to PNG free, fast, and secure. No installation required. Batch convert multiple WebP files to PNG format online with our easy-to-use converter tool.',
    url: 'https://loveuconvert.com/webp-to-png',
    images: ['/webp-to-png-og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebP to PNG Converter – Free, Fast & Secure | Love U convert',
    description:
      'Convert WebP to PNG free, fast, and secure. No installation required. Batch convert multiple WebP files to PNG format online with our easy-to-use converter tool.',
  },
};

export default function WebpToPngLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANT: just return children; html/body yahan dubara mat likho
  return <>{children}</>;
}
