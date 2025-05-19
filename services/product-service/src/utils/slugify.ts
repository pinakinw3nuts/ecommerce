export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/-+/g, '-')           // Collapse multiple -
    .replace(/^-+|-+$/g, '');      // Trim - from start/end
} 