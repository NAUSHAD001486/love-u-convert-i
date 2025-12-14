import Link from 'next/link';
import { CONVERTER_TOOLS } from '@/config/tools';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white pt-[50px]">
      {/* Hero Section */}
      <section className="text-center pt-12 md:pt-16 px-4 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
          Love U convert
        </h1>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
          Fast online image converter – convert WebP, PNG, JPG and more.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONVERTER_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={`/${tool.slug}`}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 hover:border-purple-300 hover:-translate-y-1"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                {tool.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {tool.subtitle}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
                Open tool →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
