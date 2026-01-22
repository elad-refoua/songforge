'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VoicesPage() {
  const [voices, setVoices] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    // TODO: Implement voice upload
    alert('Voice cloning is not yet implemented. Kits.AI integration required.');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Voices</h1>
          <p className="text-gray-400">
            Clone your voice to sing in AI-generated songs
          </p>
        </div>
        <Button onClick={handleUpload} className="bg-purple-500 hover:bg-purple-600">
          Upload Voice Sample
        </Button>
      </div>

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
              <h4 className="text-white font-medium mb-1">Upload Sample</h4>
              <p className="text-gray-400 text-sm">Record or upload 30-60 seconds of your voice</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-white font-medium mb-1">AI Processing</h4>
              <p className="text-gray-400 text-sm">Our AI learns your unique voice characteristics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-white font-medium mb-1">Create Songs</h4>
              <p className="text-gray-400 text-sm">Generate songs that sound like you singing!</p>
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
                Upload a voice sample to create your first voice clone
              </p>
              <Button onClick={handleUpload} className="bg-purple-500 hover:bg-purple-600">
                Upload Voice Sample
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Voice profiles will be rendered here */}
        </div>
      )}
    </div>
  );
}
