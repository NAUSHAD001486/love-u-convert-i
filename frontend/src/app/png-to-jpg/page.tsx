'use client';

import { getToolBySlug } from '@/config/tools';
import { ConverterPageShell } from '@/components/converter/ConverterPageShell';

export default function PngToJpgPage() {
  const tool = getToolBySlug('png-to-jpg');
  if (!tool) return null;
  return <ConverterPageShell tool={tool} />;
}

