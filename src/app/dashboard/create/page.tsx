'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Step definitions
const STEPS = ['Topic', 'Style', 'Lyrics', 'Generate'];

const purposes = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'motivation', label: 'Motivation', emoji: '💪' },
  { id: 'fun', label: 'Just for Fun', emoji: '🎉' },
  { id: 'farewell', label: 'Farewell', emoji: '👋' },
  { id: 'celebration', label: 'Celebration', emoji: '🥂' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

const languages = [
  { id: 'english', label: 'English', flag: '🇺🇸' },
  { id: 'hebrew', label: 'Hebrew', flag: '🇮🇱' },
  { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'french', label: 'French', flag: '🇫🇷' },
  { id: 'other', label: 'Other', flag: '🌍' },
];

const genres = [
  { id: 'pop', name: 'Pop', color: 'from-pink-500 to-purple-500' },
  { id: 'rock', name: 'Rock', color: 'from-red-500 to-orange-500' },
  { id: 'hiphop', name: 'Hip-Hop', color: 'from-yellow-500 to-amber-500' },
  { id: 'electronic', name: 'Electronic', color: 'from-cyan-500 to-blue-500' },
  { id: 'jazz', name: 'Jazz', color: 'from-amber-500 to-yellow-600' },
  { id: 'classical', name: 'Classical', color: 'from-gray-400 to-gray-600' },
  { id: 'rnb', name: 'R&B', color: 'from-purple-500 to-pink-500' },
  { id: 'country', name: 'Country', color: 'from-orange-500 to-amber-600' },
  { id: 'reggae', name: 'Reggae', color: 'from-green-500 to-yellow-500' },
  { id: 'latin', name: 'Latin', color: 'from-red-500 to-pink-500' },
  { id: 'folk', name: 'Folk', color: 'from-amber-600 to-orange-700' },
  { id: 'indie', name: 'Indie', color: 'from-teal-500 to-cyan-600' },
];

const moods = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'calm', label: 'Calm', emoji: '🧘' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
  { id: 'epic', label: 'Epic', emoji: '🔥' },
  { id: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
  { id: 'dark', label: 'Dark', emoji: '🌙' },
];

const tempos = [
  { id: 'slow', label: 'Slow', bpm: '60-90 BPM' },
  { id: 'medium', label: 'Medium', bpm: '90-120 BPM' },
  { id: 'fast', label: 'Fast', bpm: '120-160 BPM' },
];

type LyricsMode = 'ai' | 'manual';

interface WizardData {
  topic: string;
  language: string;
  customLanguage: string;
  purpose: string;
  importantNotes: string;
  genre: string;
  mood: string;
  tempo: string;
  lyricsMode: LyricsMode;
  lyrics: string;
  title: string;
}

export default function CreateSongPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<WizardData>({
    topic: '',
    language: 'english',
    customLanguage: '',
    purpose: '',
    importantNotes: '',
    genre: '',
    mood: 'happy',
    tempo: 'medium',
    lyricsMode: 'ai',
    lyrics: '',
    title: '',
  });

  const creditsBalance = session?.user?.creditsBalance ?? 0;

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.topic.trim().length > 0 && data.language && data.purpose;
      case 1: return data.genre;
      case 2: return data.lyricsMode === 'ai' || data.lyrics.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const getEffectiveLanguage = () => {
    return data.language === 'other' ? (data.customLanguage || 'english') : data.language;
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    setError(null);
    try {
      const res = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: data.topic,
          language: getEffectiveLanguage(),
          purpose: data.purpose,
          importantNotes: data.importantNotes,
          genre: data.genre,
          mood: data.mood,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to generate lyrics');
      updateData({ lyrics: result.lyrics, title: result.title || data.title });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleGenerate = async () => {
    if (creditsBalance <= 0) {
      setError('No credits remaining');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/songs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, language: getEffectiveLanguage() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to generate song');
      router.push(`/dashboard/songs?new=${result.songId}`);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Song</h1>
        <p className="text-gray-400">Follow the steps to create your AI-generated song</p>
        <div className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
          <span className="text-blue-400 text-lg">&#9998;</span>
          <span className="text-blue-300 text-sm">
            Got your own lyrics? You can paste or write them in Step 3, or let AI generate them for you!
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mb-8 gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-purple-500 text-white' :
              'bg-gray-700 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden md:inline ${
              i === step ? 'text-white font-medium' : 'text-gray-500'
            }`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30 mb-6">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Topic & Purpose */}
      {step === 0 && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">What is the song about?</CardTitle>
              <CardDescription className="text-gray-400">
                Describe the topic or story of your song
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="A song about finding strength after a difficult time, about new beginnings and hope..."
                value={data.topic}
                onChange={(e) => updateData({ topic: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white min-h-24"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Language</CardTitle>
              <CardDescription className="text-gray-400">
                What language should the song be in?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => updateData({ language: lang.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      data.language === lang.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    <div className="text-2xl mb-1">{lang.flag}</div>
                    <span className="text-white text-sm">{lang.label}</span>
                  </button>
                ))}
              </div>
              {data.language === 'other' && (
                <div className="mt-4">
                  <Input
                    placeholder="Type your language (e.g., Arabic, Russian, German...)"
                    value={data.customLanguage}
                    onChange={(e) => updateData({ customLanguage: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Purpose</CardTitle>
              <CardDescription className="text-gray-400">
                What is the song for?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {purposes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateData({ purpose: p.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      data.purpose === p.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <span className="text-white text-sm">{p.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Important Details</CardTitle>
              <CardDescription className="text-gray-400">
                Anything specific you want included? Names, phrases, themes?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Include the name 'Sarah', mention the beach, use a metaphor about flying..."
                value={data.importantNotes}
                onChange={(e) => updateData({ importantNotes: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={2}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Style */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Genre</CardTitle>
              <CardDescription className="text-gray-400">Choose a musical style</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => updateData({ genre: genre.id })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.genre === genre.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${genre.color} mb-2`} />
                    <span className="text-white font-medium">{genre.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Mood</CardTitle>
              <CardDescription className="text-gray-400">How should the song feel?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateData({ mood: m.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      data.mood === m.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.emoji}</div>
                    <span className="text-white text-sm">{m.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Tempo</CardTitle>
              <CardDescription className="text-gray-400">How fast should it be?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {tempos.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateData({ tempo: t.id })}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      data.tempo === t.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                  >
                    <span className="text-white font-medium block">{t.label}</span>
                    <span className="text-gray-400 text-xs">{t.bpm}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Lyrics */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Lyrics</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to create your lyrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => updateData({ lyricsMode: 'ai' })}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    data.lyricsMode === 'ai'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="text-3xl mb-2">🤖</div>
                  <span className="text-white font-medium block">AI Generated</span>
                  <span className="text-gray-400 text-xs">Let AI write lyrics based on your topic</span>
                </button>
                <button
                  onClick={() => updateData({ lyricsMode: 'manual' })}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    data.lyricsMode === 'manual'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="text-3xl mb-2">✍️</div>
                  <span className="text-white font-medium block">Write My Own</span>
                  <span className="text-gray-400 text-xs">Enter or paste your own lyrics</span>
                </button>
              </div>

              {data.lyricsMode === 'ai' && !data.lyrics && (
                <Button
                  onClick={handleGenerateLyrics}
                  disabled={isGeneratingLyrics}
                  className="w-full bg-blue-500 hover:bg-blue-600 mb-4"
                >
                  {isGeneratingLyrics ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Lyrics...
                    </span>
                  ) : 'Generate Lyrics with AI'}
                </Button>
              )}

              {(data.lyricsMode === 'manual' || data.lyrics) && (
                <div>
                  {data.lyrics && data.lyricsMode === 'ai' && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400 text-sm">AI lyrics generated! You can edit them below.</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateLyrics}
                        disabled={isGeneratingLyrics}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Regenerate
                      </Button>
                    </div>
                  )}
                  <Textarea
                    placeholder={`[Verse 1]\nWrite your first verse here...\n\n[Chorus]\nWrite the chorus here...\n\n[Verse 2]\nWrite the second verse...`}
                    value={data.lyrics}
                    onChange={(e) => updateData({ lyrics: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-64 font-mono"
                    rows={12}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Song Title</CardTitle>
              <CardDescription className="text-gray-400">Give your song a name (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="My Song Title"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review & Generate */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Review Your Song</CardTitle>
              <CardDescription className="text-gray-400">
                Make sure everything looks good before generating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Topic</span>
                  <p className="text-white">{data.topic}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Language</span>
                  <p className="text-white capitalize">{data.language === 'other' ? (data.customLanguage || 'Other') : data.language}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Purpose</span>
                  <p className="text-white capitalize">{data.purpose}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Genre</span>
                  <p className="text-white capitalize">{data.genre}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Mood</span>
                  <p className="text-white capitalize">{data.mood}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Tempo</span>
                  <p className="text-white capitalize">{data.tempo}</p>
                </div>
              </div>
              {data.importantNotes && (
                <div>
                  <span className="text-gray-400 text-sm">Important Details</span>
                  <p className="text-white">{data.importantNotes}</p>
                </div>
              )}
              {data.lyrics && (
                <div>
                  <span className="text-gray-400 text-sm">Lyrics</span>
                  <pre className="text-white text-sm whitespace-pre-wrap bg-gray-800 rounded-lg p-4 mt-1 max-h-48 overflow-auto">
                    {data.lyrics}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Cost: 1 credit</div>
                  <div className="text-gray-400 text-sm">
                    Balance after: {creditsBalance - 1} credits
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={creditsBalance <= 0 || isGenerating}
                  className="bg-purple-500 hover:bg-purple-600 px-8 py-6 text-lg"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Song...
                    </span>
                  ) : 'Generate Song'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
