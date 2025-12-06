interface FormatSelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const formats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'ico', label: 'ICO' },
    { value: 'psd', label: 'PSD' },
    { value: 'webp', label: 'WebP' },
    { value: 'eps', label: 'EPS' },
    { value: 'gif', label: 'GIF' },
    { value: 'svg', label: 'SVG' },
    { value: 'tga', label: 'TGA' },
    { value: 'tiff', label: 'TIFF' },
  ];

  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {formats.map((format) => (
        <option key={format.value} value={format.value}>
          {format.label}
        </option>
      ))}
    </select>
  );
}

