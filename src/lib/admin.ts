/**
 * Admin utility functions
 */

const ADMIN_EMAILS = ['eladrefoua@gmail.com'];

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
