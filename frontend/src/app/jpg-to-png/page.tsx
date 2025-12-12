'use client';

import { getToolBySlug } from '@/config/tools';
import { ConverterPageShell } from '@/components/converter/ConverterPageShell';

export default function JpgToPngPage() {
  const tool = getToolBySlug('jpg-to-png');
  if (!tool) return null;
  return <ConverterPageShell tool={tool} />;
}

