import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Love U Convert
          </Link>
          <nav>
            <Link
              href="/webp-to-png"
              className="text-slate-300 hover:text-white transition-colors px-4 py-2 rounded hover:bg-slate-800"
            >
              WebP to PNG
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

