'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const genres = [
  { id: 'pop', name: 'Pop', color: 'from-pink-500 to-purple-500' },
  { id: 'rock', name: 'Rock', color: 'from-red-500 to-orange-500' },
  { id: 'hiphop', name: 'Hip-Hop', color: 'from-yellow-500 to-amber-500' },
  { id: 'electronic', name: 'Electronic', color: 'from-cyan-500 to-blue-500' },
  { id: 'jazz', name: 'Jazz', color: 'from-amber-500 to-yellow-600' },
  { id: 'classical', name: 'Classical', color: 'from-gray-400 to-gray-600' },
  { id: 'rnb', name: 'R&B', color: 'from-purple-500 to-pink-500' },
  { id: 'country', name: 'Country', color: 'from-orange-500 to-amber-600' },
];

export default function CreateSongPage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const creditsBalance = session?.user?.creditsBalance ?? 0;

  const handleGenerate = async () => {
    if (!prompt || !selectedGenre) return;

    setIsGenerating(true);
    // TODO: Implement actual song generation
    setTimeout(() => {
      setIsGenerating(false);
      alert('Song generation is not yet implemented. ElevenLabs API key required.');
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Song</h1>
        <p className="text-gray-400">
          Describe your song and let AI create it for you
        </p>
      </div>

      {/* Credits Warning */}
      {creditsBalance === 0 && (
        <Card className="bg-red-500/10 border-red-500/30 mb-6">
          <CardContent className="p-4">
            <p className="text-red-400">
              You have no credits remaining. Please purchase more credits to create songs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Song Title */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Song Title</CardTitle>
          <CardDescription className="text-gray-400">
            Give your song a name (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="My Awesome Song"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Genre Selection */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Select Genre</CardTitle>
          <CardDescription className="text-gray-400">
            Choose a musical style for your song
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGenre === genre.id
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

      {/* Song Description */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Describe Your Song</CardTitle>
          <CardDescription className="text-gray-400">
            Tell the AI what kind of song you want. Be descriptive!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="A happy upbeat song about summer adventures with friends, featuring catchy melodies and energetic drums..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white min-h-32"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div className="text-gray-400">
          <span className="text-white font-bold">1 credit</span> will be used
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!prompt || !selectedGenre || creditsBalance === 0 || isGenerating}
          className="bg-purple-500 hover:bg-purple-600 px-8"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Song'
          )}
        </Button>
      </div>
    </div>
  );
}
