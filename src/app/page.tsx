import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="text-xl font-bold">SongForge</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full text-sm font-medium transition-all hover:scale-105"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-32 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            AI-Powered Music Creation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
            Create Songs in
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              YOUR Voice
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 animate-fade-in-up-delayed">
            Transform your ideas into professional songs with AI. Write lyrics, choose your style,
            and generate music in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up-delayed-2">
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Create Your First Song
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-lg font-medium transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 animate-fade-in-up-delayed-2">
            <div>
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-sm text-gray-500">Free Credits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50s</div>
              <div className="text-sm text-gray-500">Song Length</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">12+</div>
              <div className="text-sm text-gray-500">Genres</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need to Create Music
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            From lyrics to full production, SongForge handles it all with cutting-edge AI technology.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-8 bg-gradient-to-b from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Lyrics Writer</h3>
              <p className="text-gray-400">Generate creative, structured lyrics with Gemini AI or write your own. Supports multiple languages.</p>
            </div>

            <div className="group p-8 bg-gradient-to-b from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Music Generation</h3>
              <p className="text-gray-400">Professional-quality music powered by ElevenLabs. Choose from 12+ genres and multiple moods.</p>
            </div>

            <div className="group p-8 bg-gradient-to-b from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl hover:border-pink-500/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-colors">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Voice Cloning</h3>
              <p className="text-gray-400">Coming soon: Clone your voice and create songs that sound like you. Sing without singing.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 py-24 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Describe Your Song</h3>
              <p className="text-gray-400 text-sm">Tell us the topic, language, and occasion. Add any important details you want included.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>

            <div className="relative text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Style</h3>
              <p className="text-gray-400 text-sm">Pick a genre, mood, and tempo. Generate AI lyrics or write your own words.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Generate & Enjoy</h3>
              <p className="text-gray-400 text-sm">Click generate and get a professional song in seconds. Download or share with friends.</p>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="px-6 py-24 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-center mb-16">Start free, upgrade when you need more</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  3 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  AI vocals
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Standard quality
                </li>
              </ul>
            </div>

            <div className="p-8 bg-gradient-to-b from-purple-500/10 to-gray-900 border border-purple-500/30 rounded-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs font-medium">Popular</div>
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <div className="text-3xl font-bold mb-4">$9.99<span className="text-sm text-gray-400 font-normal">/mo</span></div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  20 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  1 voice clone
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  High quality
                </li>
              </ul>
            </div>

            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <div className="text-3xl font-bold mb-4">$49.99<span className="text-sm text-gray-400 font-normal">/mo</span></div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  150 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Unlimited voices
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Commercial license
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-3xl mx-auto p-12 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create?</h2>
            <p className="text-gray-400 mb-8">Join now and get 3 free credits to create your first songs.</p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Get Started Free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-gray-800/50">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <span className="text-sm">SongForge</span>
            </div>
            <p className="text-sm text-gray-600">Powered by ElevenLabs & Google Gemini</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
