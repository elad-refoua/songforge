'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Provider {
  id: string;
  name: string;
  configured: boolean;
}

interface Settings {
  musicProvider: string;
  availableProviders: Provider[];
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchSettings();
  }, [session, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      setSelectedProvider(data.musicProvider);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicProvider: selectedProvider }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      await fetchSettings();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-64 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-gray-400">Configure music generation providers and system options</p>
      </div>

      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Music Generation Provider
          </CardTitle>
          <CardDescription>
            Choose which API to use for generating songs. Suno offers a free trial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings?.availableProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={() => provider.configured && setSelectedProvider(provider.id)}
                className={`relative flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedProvider === provider.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : provider.configured
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{provider.name}</span>
                    {provider.id === 'suno' && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                        Free Trial
                      </span>
                    )}
                    {provider.id === 'elevenlabs' && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {provider.id === 'elevenlabs' && 'High quality music generation. Requires paid subscription.'}
                    {provider.id === 'suno' && 'AI music with vocals. Free trial credits available.'}
                  </p>
                  {!provider.configured && (
                    <p className="text-red-400 text-xs mt-2">
                      API key not configured. Add {provider.id.toUpperCase()}_API_KEY to environment variables.
                    </p>
                  )}
                </div>
                {selectedProvider === provider.id && (
                  <div className="absolute right-4">
                    <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <Button
              onClick={handleSave}
              disabled={saving || selectedProvider === settings?.musicProvider}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {selectedProvider !== settings?.musicProvider && (
              <span className="text-yellow-400 text-sm ml-4">Unsaved changes</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings?.availableProviders.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between py-2">
                <span className="text-gray-300">{provider.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${provider.configured ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-sm ${provider.configured ? 'text-green-400' : 'text-red-400'}`}>
                    {provider.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-white font-medium mb-2">Environment Variables Required</h4>
            <code className="text-sm text-gray-400 block">
              ELEVENLABS_API_KEY=your_elevenlabs_key<br />
              SUNO_API_KEY=your_suno_api_key
            </code>
            <p className="text-gray-500 text-xs mt-2">
              Get a free Suno API key at{' '}
              <a href="https://sunoapi.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                sunoapi.org
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
