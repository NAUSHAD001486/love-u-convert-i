import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Love U Convert
        </h1>
        <p className="text-2xl text-slate-300 mb-8">
          Fast Online Image Converter
        </p>
        <p className="text-lg text-slate-400 mb-12">
          Convert WebP to PNG and more, free and fast.
        </p>

        <Link
          href="/webp-to-png"
          className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 mb-16"
        >
          Start Converting
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">⚡ Fast</h3>
            <p className="text-slate-300">
              Lightning-fast conversion powered by cloud infrastructure
            </p>
          </div>
          <div className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-green-400">🔒 Private</h3>
            <p className="text-slate-300">
              Your files are processed securely and never stored permanently
            </p>
          </div>
          <div className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-purple-400">🌍 Global</h3>
            <p className="text-slate-300">
              Available worldwide, accessible from anywhere
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

