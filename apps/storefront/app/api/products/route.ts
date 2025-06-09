import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// Define product template type
type ProductTemplate = {
  name: string;
  description: string;
  image?: string;
};

// Define categories type
type CategoryKey = 'clothing' | 'electronics' | 'home' | 'accessories' | 'beauty';

// Generate realistic product data
const generateProducts = () => {
  const categories: CategoryKey[] = ['clothing', 'electronics', 'home', 'accessories', 'beauty'];
  const brands = ['Acme', 'TechPro', 'HomeStyle', 'FashionX', 'LuxeLife', 'EcoWare', 'PrimeBrand', 'CoreBasics'];
  
  // Real product images by category
  const productImages = {
    clothing: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format',
      'https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=500&auto=format',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&auto=format',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format',
    ],
    electronics: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format',
      'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500&auto=format',
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500&auto=format',
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format',
      'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=500&auto=format',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format',
      'https://images.unsplash.com/photo-1600003263720-95b45a4035d5?w=500&auto=format',
    ],
    home: [
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500&auto=format',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&auto=format',
      'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=500&auto=format',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=500&auto=format',
      'https://images.unsplash.com/photo-1556911220-bda9f33a8b1f?w=500&auto=format',
    ],
    accessories: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format',
      'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&auto=format',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format',
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format',
      'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=500&auto=format',
      'https://images.unsplash.com/photo-1600721391776-039ce1473b2c?w=500&auto=format',
    ],
    beauty: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format',
      'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&auto=format',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format',
      'https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?w=500&auto=format',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format',
      'https://images.unsplash.com/photo-1597931663114-456e68a1651c?w=500&auto=format',
    ],
  };
  
  // Define specific matching for a few showcase products
  const specificProducts = [
    {
      name: 'Leather Jacket',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format',
      price: 199.99,
      discountedPrice: null,
      rating: 4.8,
      reviewCount: 127,
      category: 'clothing' as CategoryKey,
    },
    {
      name: 'Classic Cotton T-Shirt',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
      price: 29.99,
      discountedPrice: null,
      rating: 4.7,
      reviewCount: 203,
      category: 'clothing' as CategoryKey,
    },
    {
      name: 'Slim Fit Jeans',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format',
      price: 59.99,
      discountedPrice: null,
      rating: 4.6,
      reviewCount: 145,
      category: 'clothing' as CategoryKey,
    },
    {
      name: 'Polarized Sunglasses',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format',
      price: 79.99,
      discountedPrice: null,
      rating: 4.5,
      reviewCount: 98,
      category: 'accessories' as CategoryKey,
    },
  ];
  
  const clothingProducts: ProductTemplate[] = [
    { name: 'Classic Cotton T-Shirt', description: 'Soft and comfortable 100% cotton t-shirt with a relaxed fit.' },
    { name: 'Slim Fit Jeans', description: 'Modern slim fit jeans made from premium denim with slight stretch for comfort.' },
    { name: 'Wool Blend Sweater', description: 'Warm and stylish sweater made from a premium wool blend that\'s soft to the touch.' },
    { name: 'Leather Jacket', description: 'Classic leather jacket with a modern cut and premium hardware.' },
    { name: 'Casual Chino Pants', description: 'Versatile chino pants perfect for both casual and semi-formal occasions.' },
    { name: 'Oxford Button-Down Shirt', description: 'Timeless oxford shirt made from high-quality cotton with a button-down collar.' },
    { name: 'Knit Beanie', description: 'Warm knit beanie made from soft acrylic yarn for cold weather comfort.' },
    { name: 'Fleece Hoodie', description: 'Cozy fleece hoodie with kangaroo pocket and adjustable drawstring hood.' },
    { name: 'Athletic Performance Shorts', description: 'Lightweight performance shorts with moisture-wicking technology for workouts.' },
    { name: 'Graphic Print T-Shirt', description: 'Cotton t-shirt featuring unique graphic design on the front.' },
    { name: 'Linen Summer Shirt', description: 'Breathable linen shirt perfect for warm weather and casual outings.' },
    { name: 'Formal Dress Shirt', description: 'Crisp formal shirt with French cuffs and a spread collar for professional settings.' },
    { name: 'Cargo Shorts', description: 'Durable cargo shorts with multiple pockets for practical everyday wear.' },
    { name: 'Patterned Socks Set', description: 'Set of colorful patterned socks made from comfortable cotton blend.' },
    { name: 'Quilted Vest', description: 'Lightweight quilted vest for layering in transitional weather.' },
    { name: 'Denim Jacket', description: 'Classic denim jacket with button closures and chest pockets.' },
    { name: 'Polo Shirt', description: 'Classic polo shirt made from breathable piqué cotton.' },
    { name: 'Leather Belt', description: 'Premium leather belt with a classic buckle for everyday wear.' },
    { name: 'Swim Trunks', description: 'Quick-dry swim trunks with elastic waistband and mesh lining.' },
    { name: 'Winter Parka', description: 'Insulated winter parka with faux fur hood and water-resistant exterior.' }
  ];
  
  const electronicsProducts: ProductTemplate[] = [
    { name: 'Wireless Earbuds', description: 'True wireless earbuds with Bluetooth 5.0 and 24-hour battery life with charging case.' },
    { name: 'Smart Watch', description: 'Feature-rich smartwatch with health tracking, notifications, and customizable watch faces.' },
    { name: 'Bluetooth Speaker', description: 'Portable Bluetooth speaker with 360° sound and 12-hour battery life.' },
    { name: 'Noise-Cancelling Headphones', description: 'Over-ear headphones with active noise cancellation and premium audio quality.' },
    { name: 'Ultra HD Monitor', description: '27-inch 4K monitor with HDR support and adjustable stand.' },
    { name: 'Wireless Charging Pad', description: 'Fast wireless charging pad compatible with all Qi-enabled devices.' },
    { name: 'Smart Home Hub', description: 'Central hub for controlling all your smart home devices with voice commands.' },
    { name: 'Portable Power Bank', description: '20,000mAh power bank with fast charging and multiple ports.' },
    { name: 'Mechanical Keyboard', description: 'Tactile mechanical keyboard with customizable RGB lighting.' },
    { name: 'Gaming Mouse', description: 'Ergonomic gaming mouse with adjustable DPI and programmable buttons.' },
    { name: 'Webcam Pro', description: 'Full HD webcam with auto-focus and built-in noise-cancelling microphone.' },
    { name: 'Wireless Router', description: 'Dual-band mesh router system for whole-home coverage and fast speeds.' },
    { name: 'Digital Camera', description: 'Compact digital camera with 20MP sensor and 10x optical zoom.' },
    { name: 'Smart Light Bulbs Set', description: 'Set of 4 smart LED bulbs with millions of colors and app control.' },
    { name: 'Portable SSD', description: '1TB portable SSD with USB-C connection and durable aluminum casing.' },
    { name: 'Wireless Gaming Controller', description: 'Ergonomic wireless controller compatible with PC and console gaming.' },
    { name: 'Smart Doorbell', description: 'Video doorbell with motion detection and two-way audio communication.' },
    { name: 'Tablet Stand', description: 'Adjustable aluminum stand for tablets and smartphones with cable management.' },
    { name: 'Mini Projector', description: 'Compact HD projector for home theater and outdoor movie nights.' },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI, USB, and card reader ports.' }
  ];
  
  const homeProducts: ProductTemplate[] = [
    { name: 'Non-Stick Cookware Set', description: '10-piece non-stick cookware set with tempered glass lids and ergonomic handles.' },
    { name: 'Memory Foam Pillow', description: 'Contoured memory foam pillow for optimal neck support and better sleep.' },
    { name: 'Cotton Bed Sheet Set', description: '400 thread count 100% cotton sheet set with fitted sheet, flat sheet, and pillowcases.' },
    { name: 'Stainless Steel Cutlery Set', description: '24-piece stainless steel cutlery set with modern design and dishwasher safe.' },
    { name: 'Ceramic Dinner Plate Set', description: 'Set of 6 ceramic dinner plates with elegant design and chip-resistant construction.' },
    { name: 'Glass Food Storage Containers', description: '10-piece glass food storage set with leak-proof lids and oven-safe construction.' },
    { name: 'Bamboo Cutting Board', description: 'Sustainable bamboo cutting board with juice groove and non-slip edges.' },
    { name: 'Plush Throw Blanket', description: 'Super soft plush throw blanket perfect for cozy evenings on the couch.' },
    { name: 'Scented Candle Set', description: 'Set of 3 scented soy candles in decorative glass jars with 40-hour burn time each.' },
    { name: 'Decorative Throw Pillows', description: 'Set of 2 decorative throw pillows with removable, washable covers.' },
    { name: 'Stainless Steel Water Bottle', description: 'Vacuum insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours.' },
    { name: 'Indoor Plant Pot Set', description: 'Set of 3 ceramic plant pots in varying sizes with drainage holes and saucers.' },
    { name: 'Wall Clock', description: 'Modern wall clock with silent movement and easy-to-read numbers.' },
    { name: 'Table Lamp', description: 'Stylish table lamp with fabric shade and adjustable brightness levels.' },
    { name: 'Shower Curtain', description: 'Water-repellent fabric shower curtain with reinforced buttonholes and modern pattern.' },
    { name: 'Bath Towel Set', description: 'Set of 6 cotton bath towels, hand towels, and washcloths with high absorbency.' },
    { name: 'Spice Rack Organizer', description: 'Tiered spice rack organizer with 24 jars and pre-printed labels.' },
    { name: 'Picture Frame Set', description: 'Set of 5 picture frames in various sizes with stand and wall-mounting options.' },
    { name: 'Area Rug', description: 'Soft area rug with non-slip backing and stain-resistant fibers.' },
    { name: 'Knife Block Set', description: '15-piece knife set with wooden block, kitchen shears, and sharpening rod.' }
  ];
  
  const accessoriesProducts: ProductTemplate[] = [
    { name: 'Leather Wallet', description: 'Genuine leather wallet with multiple card slots and RFID blocking technology.' },
    { name: 'Polarized Sunglasses', description: 'Lightweight polarized sunglasses with UV400 protection and durable frame.' },
    { name: 'Canvas Backpack', description: 'Durable canvas backpack with laptop compartment and multiple pockets.' },
    { name: 'Stainless Steel Watch', description: 'Classic stainless steel watch with Japanese quartz movement and mineral crystal face.' },
    { name: 'Leather Messenger Bag', description: 'Premium leather messenger bag with adjustable strap and multiple compartments.' },
    { name: 'Knitted Scarf', description: 'Soft knitted scarf made from acrylic yarn in a versatile solid color.' },
    { name: 'Touchscreen Gloves', description: 'Warm winter gloves with touchscreen-compatible fingertips.' },
    { name: 'Minimalist Jewelry Set', description: 'Elegant set including necklace, earrings, and bracelet in stainless steel.' },
    { name: 'Travel Luggage Set', description: 'Set of 3 hardshell spinner luggage pieces with TSA-approved locks.' },
    { name: 'Laptop Sleeve', description: 'Padded laptop sleeve with water-resistant exterior and soft interior lining.' },
    { name: 'Adjustable Baseball Cap', description: 'Classic baseball cap with adjustable strap and embroidered logo.' },
    { name: 'Leather Keychain', description: 'Handcrafted leather keychain with stainless steel hardware.' },
    { name: 'Crossbody Phone Bag', description: 'Compact crossbody bag designed specifically for carrying your phone and essentials.' },
    { name: 'Woven Straw Hat', description: 'Woven straw hat with wide brim for sun protection and style.' },
    { name: 'Patterned Necktie', description: 'Silk blend necktie with modern pattern and standard width.' },
    { name: 'Leather Card Holder', description: 'Slim leather card holder for essential cards with minimal bulk.' },
    { name: 'Weekend Duffle Bag', description: 'Spacious duffle bag perfect for weekend trips with shoe compartment.' },
    { name: 'Fitness Tracker Band', description: 'Replacement band for fitness trackers made from comfortable silicone.' },
    { name: 'Foldable Shopping Tote', description: 'Reusable shopping tote that folds into a compact pouch when not in use.' },
    { name: 'Bandana Set', description: 'Set of 3 cotton bandanas in different patterns for versatile styling.' }
  ];
  
  const beautyProducts: ProductTemplate[] = [
    { name: 'Facial Cleanser', description: 'Gentle facial cleanser suitable for all skin types that removes makeup and impurities.' },
    { name: 'Moisturizing Face Cream', description: 'Hydrating face cream with hyaluronic acid and vitamin E for daily use.' },
    { name: 'Eyeshadow Palette', description: '12-color eyeshadow palette with matte and shimmer finishes for versatile looks.' },
    { name: 'Volumizing Mascara', description: 'Volumizing and lengthening mascara with smudge-proof formula.' },
    { name: 'Facial Serum', description: 'Antioxidant-rich facial serum with vitamin C for brighter, more even skin tone.' },
    { name: 'Lip Balm Set', description: 'Set of 4 moisturizing lip balms with natural ingredients and subtle tints.' },
    { name: 'Hair Styling Kit', description: 'Complete hair styling kit including heat protectant spray, mousse, and finishing serum.' },
    { name: 'Sheet Mask Bundle', description: 'Bundle of 10 sheet masks targeting different skin concerns from hydration to brightening.' },
    { name: 'Makeup Brush Set', description: '12-piece makeup brush set with synthetic bristles and bamboo handles.' },
    { name: 'Natural Deodorant', description: 'Aluminum-free natural deodorant with essential oils and long-lasting protection.' },
    { name: 'Bath Bomb Set', description: 'Set of 6 handcrafted bath bombs with essential oils and moisturizing ingredients.' },
    { name: 'Nail Polish Collection', description: 'Collection of 5 nail polishes in complementary colors with chip-resistant formula.' },
    { name: 'Beard Grooming Kit', description: 'Complete beard care kit with oil, balm, brush, and scissors.' },
    { name: 'Exfoliating Body Scrub', description: 'Natural exfoliating body scrub with sea salt and nourishing oils.' },
    { name: 'Hair Repair Mask', description: 'Deep conditioning hair mask for damaged hair with argan oil and keratin.' },
    { name: 'Perfume Gift Set', description: 'Gift set featuring three travel-sized fragrances with notes of citrus, floral, and musk.' },
    { name: 'Makeup Remover Wipes', description: 'Pack of 50 gentle makeup remover wipes suitable for sensitive skin.' },
    { name: 'Facial Roller', description: 'Jade facial roller for massage and improved skincare product absorption.' },
    { name: 'Dry Shampoo', description: 'Volumizing dry shampoo that refreshes hair between washes without residue.' },
    { name: 'Sunscreen Lotion', description: 'Broad-spectrum SPF 50 sunscreen lotion with water-resistant formula.' }
  ];
  
  const allProductsByCategory: Record<CategoryKey, ProductTemplate[]> = {
    clothing: clothingProducts,
    electronics: electronicsProducts,
    home: homeProducts,
    accessories: accessoriesProducts,
    beauty: beautyProducts
  };
  
  const products = [];
  
  // First, add the specific showcase products
  specificProducts.forEach((product, index) => {
    const slug = product.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
    
    products.push({
      id: `prod-special-${index + 1}`,
      name: product.name,
      slug: `${slug}-special-${index + 1}`,
      description: allProductsByCategory[product.category].find(p => p.name === product.name)?.description || 
                  'High-quality product with premium materials and exceptional craftsmanship.',
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountedPrice ? Math.round((1 - product.discountedPrice / product.price) * 100) : 0,
      rating: product.rating,
      reviewCount: product.reviewCount,
      category: product.category,
      brand: brands[Math.floor(Math.random() * brands.length)],
      image: product.image,
      inStock: true,
      featured: true,
      new: Math.random() > 0.5,
      bestSeller: true,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
    });
  });
  
  // Generate remaining products to reach 100 total
  for (let i = 1; i <= (100 - specificProducts.length); i++) {
    // Determine category
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryProducts = allProductsByCategory[category];
    const productTemplate = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
    
    // Get a random image for this category
    const categoryImages = productImages[category];
    const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
    
    // Generate price
    const basePrice = Math.floor(Math.random() * 150) + 10;
    const price = parseFloat((basePrice + Math.random() * 0.99).toFixed(2));
    
    // Determine if product has discount
    const hasDiscount = Math.random() > 0.6;
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
    const discountedPrice = hasDiscount ? parseFloat((price * (1 - discountPercentage / 100)).toFixed(2)) : null;
    
    // Generate rating
    const rating = parseFloat((3 + Math.random() * 2).toFixed(1));
    const reviewCount = Math.floor(Math.random() * 200) + 5;
    
    // Generate slug
    const slug = productTemplate.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
    
    // Create product
    const product = {
      id: `prod-${i}`,
      name: productTemplate.name,
      slug: `${slug}-${i}`,
      description: productTemplate.description,
      price,
      discountedPrice,
      discountPercentage,
      rating,
      reviewCount,
      category,
      brand: brands[Math.floor(Math.random() * brands.length)],
      image: randomImage,
      inStock: Math.random() > 0.1,
      featured: Math.random() > 0.8,
      new: Math.random() > 0.7,
      bestSeller: Math.random() > 0.85,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
    };
    
    products.push(product);
  }
  
  return products;
};

// Generate all products
const allProducts = generateProducts();

/**
 * GET handler for /api/products
 * Proxies requests to the API gateway
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    
    // Build params object
    const params: Record<string, string> = {
      limit,
      page,
    };
    
    // Add optional params - correct parameter names for the API
    if (category) {
      // Check if it's a test category (test01, test08, etc.)
      if (/^test\d+$/i.test(category)) {
        // For test categories, use them as search terms
        params.search = category;
        console.log('Using test category as search term:', category);
      } else {
        params.categoryId = category;
        console.log('Using category parameter:', category);
      }
    }
    
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    
    // Handle sort parameter mapping from frontend to backend format
    if (sort) {
      // Map frontend sort options to backend format
      switch (sort) {
        case 'price-asc':
          params.sortBy = 'price';
          params.sortOrder = 'ASC';
          break;
        case 'price-desc':
          params.sortBy = 'price';
          params.sortOrder = 'DESC';
          break;
        case 'newest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'DESC';
          break;
        case 'popular':
          params.sortBy = 'rating';
          params.sortOrder = 'DESC';
          break;
        case 'name-asc':
          params.sortBy = 'name';
          params.sortOrder = 'ASC';
          break;
        case 'name-desc':
          params.sortBy = 'name';
          params.sortOrder = 'DESC';
          break;
        case 'rating-desc':
          params.sortBy = 'rating';
          params.sortOrder = 'DESC';
          break;
        default:
          // Pass the sort parameter as is if it doesn't match our mappings
          params.sort = sort;
      }
    }
    
    console.log('Query parameters being sent to API:', params);
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
        
    console.log('Making API request to:', `${baseUrl}/v1/products`);
    
    // Forward request to API gateway
    const response = await axios.get(`${baseUrl}/v1/products`, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the API response to match the expected format
    const apiData = response.data;
    
    // Check if the API returned data in the expected format
    if (apiData && Array.isArray(apiData.data)) {
      // API returned data in a different format, transform it
      const transformedData = {
        products: apiData.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          image: product.mediaUrl || '/images/placeholder.jpg',
          category: product.category?.name?.toLowerCase() || 'uncategorized',
          categoryId: product.category?.id || '',
          rating: product.rating || 4.5,
          reviewCount: product.reviewCount || Math.floor(Math.random() * 50) + 5,
          inStock: true,
          discountedPrice: product.salePrice || null,
          isFeatured: product.isFeatured || false,
          isNew: product.isNew || false
        })),
        total: apiData.total || apiData.data.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((apiData.total || apiData.data.length) / parseInt(limit))
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response already has the expected format, return it as is
    return NextResponse.json(apiData);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}