'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  {
    name: 'Free',
    price: 0,
    credits: 3,
    features: ['3 free songs', 'Basic genres', 'MP3 download'],
    current: true,
  },
  {
    name: 'Starter',
    price: 9.99,
    credits: 20,
    features: ['20 songs/month', 'All genres', 'MP3 + WAV download', '1 voice clone'],
    recommended: true,
  },
  {
    name: 'Creator',
    price: 24.99,
    credits: 60,
    features: ['60 songs/month', 'All genres', 'All formats', '3 voice clones', 'Duet mode'],
  },
  {
    name: 'Pro',
    price: 49.99,
    credits: 150,
    features: ['150 songs/month', 'Priority generation', 'Unlimited voice clones', 'Group/choir mode', 'API access'],
  },
];

export default function BillingPage() {
  const { data: session } = useSession();

  const handleSubscribe = (planName: string) => {
    // TODO: Implement Stripe checkout
    alert(`Stripe integration not yet implemented for ${planName} plan`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Credits</h1>
        <p className="text-gray-400">
          Choose a plan that works for you
        </p>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">Current Balance</div>
              <div className="text-4xl font-bold text-white">
                {session?.user?.creditsBalance ?? 0} credits
              </div>
            </div>
            <Button className="bg-purple-500 hover:bg-purple-600">
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`bg-gray-900 border-gray-800 relative ${
              plan.recommended ? 'border-purple-500' : ''
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                  Recommended
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <CardDescription className="text-gray-400">
                <span className="text-3xl font-bold text-white">
                  ${plan.price}
                </span>
                {plan.price > 0 && <span>/month</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-purple-400 font-medium mb-4">
                {plan.credits} credits/month
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan.name)}
                disabled={plan.current}
                className={`w-full ${
                  plan.current
                    ? 'bg-gray-700 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {plan.current ? 'Current Plan' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
