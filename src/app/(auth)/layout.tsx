/**
 * Auth Layout
 *
 * Layout for authentication pages (login, signup).
 * Clean, minimal layout without navigation.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  );
}
