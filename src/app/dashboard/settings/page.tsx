'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
          <CardDescription className="text-gray-400">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-purple-500 text-xl">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-medium text-white">
                {session?.user?.name || 'User'}
              </div>
              <div className="text-gray-400">
                {session?.user?.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Subscription</CardTitle>
          <CardDescription className="text-gray-400">
            Your current plan and credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Free Plan</div>
              <div className="text-gray-400 text-sm">
                {session?.user?.creditsBalance ?? 0} credits remaining
              </div>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/dashboard/settings/billing" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span className="text-gray-300">Billing & Credits</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/terms" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span className="text-gray-300">Terms of Service</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/privacy" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span className="text-gray-300">Privacy Policy</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
