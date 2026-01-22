'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemPrompt {
  id: string;
  type: string;
  name: string;
  content: string;
  temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_VARS: Record<string, string[]> = {
  lyrics: ['{{topic}}', '{{langInstruction}}', '{{purposeContext}}', '{{moodContext}}', '{{genreContext}}', '{{notesContext}}'],
  song: ['{{mood}}', '{{genre}}', '{{topic}}', '{{languageContext}}', '{{tempoContext}}', '{{notesContext}}'],
};

export default function AdminPromptsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'song'>('lyrics');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [editTemp, setEditTemp] = useState(0.8);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTemp, setNewTemp] = useState(0.8);

  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchPrompts();
  }, [session, router]);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/admin/prompts');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPrompts(data.prompts);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (prompt: SystemPrompt) => {
    setEditingId(prompt.id);
    setEditContent(prompt.content);
    setEditName(prompt.name);
    setEditTemp(prompt.temperature);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditName('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/prompts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, content: editContent, temperature: editTemp }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchPrompts();
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const activatePrompt = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/prompts/${id}/activate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to activate');
      await fetchPrompts();
    } catch (err) {
      console.error('Failed to activate prompt:', err);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchPrompts();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const createPrompt = async () => {
    if (!newName || !newContent) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, name: newName, content: newContent, temperature: newTemp }),
      });
      if (!res.ok) throw new Error('Failed to create');
      await fetchPrompts();
      setShowNew(false);
      setNewName('');
      setNewContent('');
      setNewTemp(0.8);
    } catch (err) {
      console.error('Failed to create prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredPrompts = prompts.filter(p => p.type === activeTab);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-64 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Prompts</h1>
          <p className="text-gray-400">Manage AI prompts for lyrics and song generation</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/admin')}
          className="border-gray-700 text-gray-300"
        >
          Back to Admin
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={activeTab === 'lyrics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('lyrics')}
          className={activeTab === 'lyrics' ? 'bg-purple-500 hover:bg-purple-600' : 'border-gray-700 text-gray-300'}
        >
          Lyrics Prompts
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'song' ? 'default' : 'outline'}
          onClick={() => setActiveTab('song')}
          className={activeTab === 'song' ? 'bg-purple-500 hover:bg-purple-600' : 'border-gray-700 text-gray-300'}
        >
          Song Prompts
        </Button>
      </div>

      {/* Template Variables Reference */}
      <Card className="bg-gray-900/50 border-gray-800 mb-6">
        <CardContent className="p-4">
          <div className="text-sm text-gray-400 mb-2">Available template variables for <span className="text-purple-400">{activeTab}</span> prompts:</div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARS[activeTab]?.map(v => (
              <code key={v} className="text-xs bg-gray-800 text-green-400 px-2 py-1 rounded">{v}</code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prompts List */}
      <div className="space-y-4">
        {filteredPrompts.map(prompt => (
          <Card key={prompt.id} className={`bg-gray-900 border-gray-800 ${prompt.is_active ? 'ring-1 ring-green-500/50' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-white text-lg">{prompt.name}</CardTitle>
                  {prompt.is_active && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!prompt.is_active && (
                    <Button size="sm" variant="outline" onClick={() => activatePrompt(prompt.id)}
                      className="border-green-700 text-green-400 hover:bg-green-500/10 text-xs">
                      Activate
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startEdit(prompt)}
                    className="border-gray-700 text-gray-300 text-xs">
                    Edit
                  </Button>
                  {!prompt.is_active && (
                    <Button size="sm" variant="outline" onClick={() => deletePrompt(prompt.id)}
                      className="border-red-700 text-red-400 hover:bg-red-500/10 text-xs">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === prompt.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Prompt Content</label>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={12}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono resize-y"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Temperature: <span className="text-purple-400">{editTemp}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editTemp}
                      onChange={e => setEditTemp(parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Precise (0.0)</span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}
                      className="border-gray-700 text-gray-300">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <pre className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {prompt.content}
                  </pre>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Temperature: {prompt.temperature}</span>
                    <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredPrompts.length === 0 && !showNew && (
          <p className="text-gray-500 text-center py-8">No {activeTab} prompts found</p>
        )}
      </div>

      {/* New Prompt Form */}
      {showNew ? (
        <Card className="bg-gray-900 border-gray-800 border-dashed mt-4">
          <CardHeader>
            <CardTitle className="text-white text-lg">New {activeTab} Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Creative Lyrics v2"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Prompt Content</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={10}
                placeholder="Enter the system prompt..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono resize-y"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Temperature: <span className="text-purple-400">{newTemp}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={newTemp}
                onChange={e => setNewTemp(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createPrompt} disabled={saving || !newName || !newContent}
                className="bg-purple-500 hover:bg-purple-600">
                {saving ? 'Creating...' : 'Create Prompt'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}
                className="border-gray-700 text-gray-300">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowNew(true)}
          className="mt-4 border-dashed border-gray-700 text-gray-400 hover:text-white w-full"
        >
          + Add New {activeTab} Prompt
        </Button>
      )}
    </div>
  );
}
