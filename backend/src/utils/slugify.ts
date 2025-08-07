import { logger } from './logger';

/**
 * Convert a string to a SEO-friendly slug
 * 
 * @param text - The text to convert to a slug
 * @param options - Options for slug generation
 * @returns A SEO-friendly slug
 * 
 * @example
 * ```ts
 * slugify('Hello World!'); // 'hello-world'
 * slugify('50% Off Sale Today!'); // '50-percent-off-sale-today'
 * slugify('My  Page', { lowercase: false }); // 'My-Page'
 * slugify('About Us', { maxLength: 10 }); // 'about-us'
 * ```
 */
export function slugify(
  text: string,
  options: {
    lowercase?: boolean;
    maxLength?: number;
    preserveNumbers?: boolean;
    preserveCharacters?: string;
  } = {}
): string {
  try {
    // Set default options
    const {
      lowercase = true,
      maxLength = 100,
      preserveNumbers = true,
      preserveCharacters = '',
    } = options;

    if (!text) {
      return '';
    }

    // Characters to preserve
    const preserveChars = preserveCharacters || '';
    const preserveCharsRegex = preserveChars ? new RegExp(`[${preserveChars}]`, 'g') : null;

    let slug = text;

    // Common word replacements for better readability
    const replacements: Record<string, string> = {
      '&': 'and',
      '%': 'percent',
      '+': 'plus',
      '@': 'at',
      '#': 'hash',
      '$': 'dollar',
    };

    // Apply replacements
    Object.keys(replacements).forEach((key) => {
      slug = slug.replace(new RegExp('\\' + key, 'g'), ` ${replacements[key]} `);
    });

    // Handle accented characters by converting them to their base form
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Temporarily replace preserved characters with placeholders
    const preserved: { pattern: RegExp; replacement: string }[] = [];
    if (preserveCharsRegex) {
      let match;
      let i = 0;
      while ((match = preserveCharsRegex.exec(slug)) !== null) {
        const placeholder = `__PRESERVE_${i}__`;
        preserved.push({
          pattern: new RegExp(placeholder, 'g'),
          replacement: match[0],
        });
        slug = slug.substring(0, match.index) + placeholder + slug.substring(match.index + 1);
        i++;
      }
    }

    // Remove any character that is not a letter, number, hyphen, or underscore
    // If preserveNumbers is false, also remove numbers
    const allowedCharsRegex = preserveNumbers
      ? /[^a-zA-Z0-9-_\s]/g
      : /[^a-zA-Z-_\s]/g;
    
    slug = slug.replace(allowedCharsRegex, '');

    // Replace multiple spaces with a single space
    slug = slug.replace(/\s+/g, ' ').trim();

    // Replace spaces with hyphens
    slug = slug.replace(/\s/g, '-');

    // Replace multiple hyphens with a single hyphen
    slug = slug.replace(/-+/g, '-');

    // Apply lowercase if required
    if (lowercase) {
      slug = slug.toLowerCase();
    }

    // Restore preserved characters
    preserved.forEach(({ pattern, replacement }) => {
      slug = slug.replace(pattern, replacement);
    });

    // Trim the slug to maxLength if it's longer
    if (maxLength && slug.length > maxLength) {
      // Try to cut at the last hyphen before maxLength to avoid cutting words
      const lastHyphenBeforeMax = slug.substring(0, maxLength).lastIndexOf('-');
      if (lastHyphenBeforeMax !== -1) {
        slug = slug.substring(0, lastHyphenBeforeMax);
      } else {
        // If no hyphen is found, just cut at maxLength
        slug = slug.substring(0, maxLength);
      }
    }

    // Trim hyphens from the beginning and end
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
  } catch (error) {
    logger.error('Error generating slug:', { text, error });
    // Fallback to a simple slug in case of error
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

/**
 * Make a slug unique by appending a number if needed
 * 
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 * 
 * @example
 * ```ts
 * makeSlugUnique('about', ['about', 'contact']); // 'about-1'
 * makeSlugUnique('about', ['about', 'about-1']); // 'about-2'
 * ```
 */
export function makeSlugUnique(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Generate a unique slug for a page title, optionally checking against existing slugs
 * 
 * @param title - The page title
 * @param existingSlugs - Optional array of existing slugs to check against
 * @param options - Options for slug generation
 * @returns A unique SEO-friendly slug
 */
export function generateUniqueSlug(
  title: string,
  existingSlugs: string[] = [],
  options = {}
): string {
  const baseSlug = slugify(title, options);
  return makeSlugUnique(baseSlug, existingSlugs);
} 