const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const categoriesDir = path.join(__dirname, '../public/images/categories');
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

// Example image URLs (replace with actual image URLs in production)
const categoryImages = [
  {
    name: 'air-suspension.png',
    url: 'https://example.com/placeholder-air-suspension.png',
    fallback: 'https://via.placeholder.com/200x200?text=Air+Suspension'
  },
  {
    name: 'arms.png',
    url: 'https://example.com/placeholder-arms.png',
    fallback: 'https://via.placeholder.com/200x200?text=Arms'
  },
  {
    name: 'filters.png',
    url: 'https://example.com/placeholder-filters.png',
    fallback: 'https://via.placeholder.com/200x200?text=Filters'
  },
  {
    name: 'fuel-pumps.png',
    url: 'https://example.com/placeholder-fuel-pumps.png',
    fallback: 'https://via.placeholder.com/200x200?text=Fuel+Pumps'
  },
  {
    name: 'oil-coolers.png',
    url: 'https://example.com/placeholder-oil-coolers.png',
    fallback: 'https://via.placeholder.com/200x200?text=Oil+Coolers'
  },
  {
    name: 'water-pumps.png',
    url: 'https://example.com/placeholder-water-pumps.png',
    fallback: 'https://via.placeholder.com/200x200?text=Water+Pumps'
  },
  {
    name: 'show-grills.png',
    url: 'https://example.com/placeholder-show-grills.png',
    fallback: 'https://via.placeholder.com/200x200?text=Show+Grills'
  },
  {
    name: 'head-light.png',
    url: 'https://example.com/placeholder-head-light.png',
    fallback: 'https://via.placeholder.com/200x200?text=Head+Light'
  },
  {
    name: 'tail-light.png',
    url: 'https://example.com/placeholder-tail-light.png',
    fallback: 'https://via.placeholder.com/200x200?text=Tail+Light'
  }
];

// Function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${filepath}`);
          resolve();
        });
      } else if (response.statusCode === 404) {
        reject(new Error(`404 - Image not found: ${url}`));
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all images
async function downloadAllImages() {
  for (const image of categoryImages) {
    const filepath = path.join(categoriesDir, image.name);
    
    try {
      // Try the primary URL first
      await downloadImage(image.url, filepath);
    } catch (error) {
      console.error(`Error downloading primary image: ${error.message}`);
      
      try {
        // If primary URL fails, try the fallback
        console.log(`Trying fallback for ${image.name}...`);
        await downloadImage(image.fallback, filepath);
      } catch (fallbackError) {
        console.error(`Fallback also failed: ${fallbackError.message}`);
      }
    }
  }
}

downloadAllImages().then(() => {
  console.log('All images downloaded successfully!');
}).catch(err => {
  console.error('Error in download process:', err);
}); 