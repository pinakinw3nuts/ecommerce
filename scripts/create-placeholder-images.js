const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const categoriesDir = path.join(__dirname, '../public/images/categories');
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

// Function to create a simple SVG image with text
function createSVG(text, width = 200, height = 200) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8f8f8"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
}

// Category images to create
const categories = [
  { name: 'air-suspension.png', text: 'Air Suspension' },
  { name: 'arms.png', text: 'Arms' },
  { name: 'filters.png', text: 'Filters' },
  { name: 'fuel-pumps.png', text: 'Fuel Pumps' },
  { name: 'oil-coolers.png', text: 'Oil Coolers' },
  { name: 'water-pumps.png', text: 'Water Pumps' },
  { name: 'show-grills.png', text: 'Show Grills' },
  { name: 'head-light.png', text: 'Head Light' },
  { name: 'tail-light.png', text: 'Tail Light' }
];

// Create SVG files for each category
categories.forEach(category => {
  const filePath = path.join(categoriesDir, category.name);
  const svgContent = createSVG(category.text);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${filePath}`);
});

console.log('All placeholder images created successfully!'); 