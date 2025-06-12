const axios = require('axios');

async function testCheckoutService() {
  const CHECKOUT_API_URL = 'http://localhost:3005/api/v1';
  
  try {
    console.log('Testing checkout service API...');
    
    // Test the preview endpoint
    const previewData = {
      userId: 'test-user-123',
      cartItems: [
        {
          productId: 'product-123',
          quantity: 1,
          price: 29.99,
          name: 'Test Product'
        }
      ]
    };
    
    console.log('Sending preview request:', JSON.stringify(previewData));
    
    const response = await axios.post(`${CHECKOUT_API_URL}/preview`, previewData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed!');
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testCheckoutService().catch(console.error); 