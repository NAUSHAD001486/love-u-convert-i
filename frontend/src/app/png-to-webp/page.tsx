'use client';

import { getToolBySlug } from '@/config/tools';
import { ConverterPageShell } from '@/components/converter/ConverterPageShell';

export default function PngToWebpPage() {
  const tool = getToolBySlug('png-to-webp');
  if (!tool) return null;
  return <ConverterPageShell tool={tool} />;
}

