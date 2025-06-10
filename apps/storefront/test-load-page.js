// Test script to fetch data from API endpoints
const fetch = require('node-fetch');

async function testApiEndpoints() {
  console.log('Testing API endpoints...');
  
  try {
    // Test /api/v1/products
    console.log('\nTesting /api/v1/products...');
    const productsResponse = await fetch('http://localhost:3100/api/v1/products');
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('Products API Response:', {
        status: productsResponse.status,
        total: productsData.total,
        productsCount: productsData.products?.length || 0
      });
    } else {
      console.error('Products API error:', productsResponse.status, productsResponse.statusText);
    }
    
    // Test /api/v1/categories
    console.log('\nTesting /api/v1/categories...');
    const categoriesResponse = await fetch('http://localhost:3100/api/v1/categories');
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('Categories API Response:', {
        status: categoriesResponse.status,
        categoriesCount: categoriesData.categories?.length || 0
      });
    } else {
      console.error('Categories API error:', categoriesResponse.status, categoriesResponse.statusText);
    }
    
    // Test /api/v1/brands
    console.log('\nTesting /api/v1/brands...');
    const brandsResponse = await fetch('http://localhost:3100/api/v1/brands');
    if (brandsResponse.ok) {
      const brandsData = await brandsResponse.json();
      console.log('Brands API Response:', {
        status: brandsResponse.status,
        brandsCount: brandsData.brands?.length || 0
      });
    } else {
      console.error('Brands API error:', brandsResponse.status, brandsResponse.statusText);
    }
    
    // Test fallback /api/products
    console.log('\nTesting fallback /api/products...');
    const fallbackResponse = await fetch('http://localhost:3100/api/products');
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      console.log('Fallback API Response:', {
        status: fallbackResponse.status,
        total: fallbackData.total,
        productsCount: fallbackData.products?.length || 0
      });
    } else {
      console.error('Fallback API error:', fallbackResponse.status, fallbackResponse.statusText);
    }
    
  } catch (error) {
    console.error('Test script error:', error);
  }
}

// Execute the test
testApiEndpoints().then(() => {
  console.log('\nTest completed');
}); 