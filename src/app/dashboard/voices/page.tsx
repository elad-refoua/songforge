'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface VoiceProfile {
  id: string;
  name: string;
  kitsai_voice_id: string | null;
  sample_audio_url: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  is_default: boolean;
  created_at: string;
}

export default function VoicesPage() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'record'>('file');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  // Cleanup recording URL on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  // Poll for processing voices
  useEffect(() => {
    const processingVoices = voices.filter(v => v.status === 'processing');
    if (processingVoices.length === 0) return;

    const interval = setInterval(async () => {
      for (const voice of processingVoices) {
        try {
          const res = await fetch(`/api/voices/${voice.id}/status`);
          const data = await res.json();
          if (data.status !== 'processing') {
            setVoices(prev => prev.map(v =>
              v.id === voice.id ? { ...v, status: data.status } : v
            ));
          }
        } catch {}
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [voices]);

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      if (res.ok) setVoices(data.voices);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setSelectedFile(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err: any) {
      setError('Could not access microphone. Please allow microphone access.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!voiceName.trim()) {
      setError('Please provide a name for your voice');
      return;
    }

    const audioToUpload = inputMode === 'record' ? recordedBlob : selectedFile;
    if (!audioToUpload) {
      setError('Please select a file or record your voice');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', voiceName.trim());

      if (inputMode === 'record' && recordedBlob) {
        formData.append('audio', recordedBlob, 'recording.webm');
      } else if (selectedFile) {
        formData.append('audio', selectedFile);
      }

      const res = await fetch('/api/voices', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setVoices(prev => [data.voice, ...prev]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setVoiceName('');
    setSelectedFile(null);
    discardRecording();
    setInputMode('file');
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice?')) return;

    try {
      const res = await fetch(`/api/voices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVoices(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete voice:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/voices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      if (res.ok) {
        setVoices(prev => prev.map(v => ({
          ...v,
          is_default: v.id === id,
        })));
      }
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const getStatusIndicator = (status: VoiceProfile['status']) => {
    switch (status) {
      case 'ready':
        return <span className="flex items-center gap-1.5 text-green-400 text-xs"><span className="w-2 h-2 bg-green-400 rounded-full"></span>Ready</span>;
      case 'processing':
        return <span className="flex items-center gap-1.5 text-yellow-400 text-xs"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>Processing...</span>;
      case 'failed':
        return <span className="flex items-center gap-1.5 text-red-400 text-xs"><span className="w-2 h-2 bg-red-400 rounded-full"></span>Failed</span>;
      default:
        return <span className="flex items-center gap-1.5 text-gray-400 text-xs"><span className="w-2 h-2 bg-gray-400 rounded-full"></span>Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading voices...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Voices</h1>
          <p className="text-gray-400 text-sm">
            Clone your voice to sing in AI-generated songs
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Add Voice
        </Button>
      </div>

      {/* Upload/Record Form */}
      {showUploadForm && (
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Add Voice Sample</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Voice Name</label>
              <Input
                placeholder="e.g. My Singing Voice"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Input Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setInputMode('file'); discardRecording(); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'file'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => { setInputMode('record'); setSelectedFile(null); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'record'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Record Now
              </button>
            </div>

            {/* File Upload */}
            {inputMode === 'file' && (
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">
                  Audio Sample (30-60 seconds of clean vocals)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/mp3,audio/x-wav,audio/webm,.mp3,.wav,.webm"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-purple-500 file:text-white
                    hover:file:bg-purple-600
                    file:cursor-pointer cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
              </div>
            )}

            {/* Recording UI */}
            {inputMode === 'record' && (
              <div className="bg-gray-800 rounded-lg p-4">
                {!isRecording && !recordedBlob && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-4">
                      Record 30-60 seconds of clean vocals
                    </p>
                    <Button
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="6" />
                      </svg>
                      Start Recording
                    </Button>
                  </div>
                )}

                {isRecording && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-white text-2xl font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      {recordingTime < 30 ? `Keep going... (${30 - recordingTime}s minimum)` : 'You can stop now or keep recording'}
                    </p>
                    <Button
                      onClick={stopRecording}
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" />
                      </svg>
                      Stop Recording
                    </Button>
                  </div>
                )}

                {recordedBlob && !isRecording && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm">Recording ({formatTime(recordingTime)})</span>
                      <button
                        onClick={discardRecording}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Discard
                      </button>
                    </div>
                    <audio
                      src={recordedUrl || undefined}
                      controls
                      className="w-full h-10"
                      style={{ filter: 'invert(1)' }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !voiceName.trim() || (inputMode === 'file' ? !selectedFile : !recordedBlob)}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isUploading ? 'Uploading...' : 'Upload & Clone'}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white">How Voice Cloning Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-white font-medium mb-1">Upload or Record</h4>
              <p className="text-gray-400 text-sm">30-60 seconds of your voice</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-white font-medium mb-1">AI Processing</h4>
              <p className="text-gray-400 text-sm">We learn your voice characteristics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-white font-medium mb-1">Create Songs</h4>
              <p className="text-gray-400 text-sm">Songs that sound like you!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {voices.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No voice profiles yet</h3>
              <p className="text-gray-400 mb-6">
                Add a voice sample to create your first voice clone
              </p>
              <Button onClick={() => setShowUploadForm(true)} className="bg-purple-500 hover:bg-purple-600">
                Add Voice Sample
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voices.map((voice) => (
            <Card key={voice.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">{voice.name}</h3>
                    <div className="mt-1">{getStatusIndicator(voice.status)}</div>
                  </div>
                  {voice.is_default && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">Default</span>
                  )}
                </div>

                {/* Audio preview */}
                {voice.sample_audio_url && (
                  <audio
                    src={voice.sample_audio_url}
                    controls
                    className="w-full h-8 mt-2 mb-3"
                    style={{ filter: 'invert(1)' }}
                  />
                )}

                <div className="text-xs text-gray-500 mb-3">
                  Created {new Date(voice.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  {voice.status === 'ready' && !voice.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(voice.id)}
                      className="border-gray-700 text-gray-300 text-xs"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(voice.id)}
                    className="border-red-800 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
