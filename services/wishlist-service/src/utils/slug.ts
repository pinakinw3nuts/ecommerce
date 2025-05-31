/**
 * Generates a URL-friendly slug from a product name
 * 
 * @param productName - The product name to convert to a slug
 * @param maxLength - Optional maximum length for the slug (default: 60)
 * @returns A URL-friendly slug
 */
export function generateSlug(productName: string, maxLength = 60): string {
  if (!productName) {
    return '';
  }

  // Convert to lowercase and replace spaces with hyphens
  let slug = productName
    .toLowerCase()
    // Replace special characters with spaces
    .replace(/[^\w\s-]/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim()
    // Replace spaces with hyphens
    .replace(/\s/g, '-');

  // Truncate if longer than maxLength
  if (slug.length > maxLength) {
    // Cut at maxLength and ensure we don't cut in the middle of a word
    slug = slug.substring(0, maxLength).replace(/-[^-]*$/, '');
  }

  // Ensure no trailing hyphens
  slug = slug.replace(/-+$/, '');

  return slug;
}

/**
 * Generates a visual ID for a wishlist item
 * Combines a prefix with a slug and optional random suffix
 * 
 * @param productName - The product name
 * @param prefix - Optional prefix (default: 'wl')
 * @param addRandomSuffix - Whether to add a random suffix (default: true)
 * @returns A visual ID for the wishlist item
 */
export function generateVisualId(
  productName: string,
  prefix = 'wl',
  addRandomSuffix = true
): string {
  const slug = generateSlug(productName, 20);
  
  if (addRandomSuffix) {
    // Add a random 4-character suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${slug}-${randomSuffix}`;
  }
  
  return `${prefix}-${slug}`;
} 