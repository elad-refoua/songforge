import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Home Page
 *
 * Redirects authenticated users to dashboard,
 * shows landing page for unauthenticated users.
 */
export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  // For now, redirect to login
  // TODO: Create a proper landing page
  redirect('/login');
}
