const genreGradients: Record<string, string> = {
  pop: 'from-pink-500 to-purple-500',
  rock: 'from-red-500 to-orange-500',
  hiphop: 'from-yellow-500 to-amber-500',
  electronic: 'from-cyan-500 to-blue-500',
  jazz: 'from-amber-500 to-yellow-600',
  classical: 'from-gray-400 to-gray-600',
  rnb: 'from-purple-500 to-pink-500',
  country: 'from-orange-500 to-amber-600',
  reggae: 'from-green-500 to-yellow-500',
  latin: 'from-red-500 to-pink-500',
  folk: 'from-amber-600 to-orange-700',
  indie: 'from-teal-500 to-cyan-600',
};

export function getGenreGradient(genre: string): string {
  return genreGradients[genre?.toLowerCase()] || 'from-purple-500 to-blue-500';
}
