import axios from 'axios';

async function testAdminLogin() {
  try {
    console.log('Attempting admin login...');
    
    const response = await axios.post('http://localhost:3001/api/auth/admin/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    console.log('Login successful:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Login failed:', {
        status: error.response?.status,
        data: error.response?.data
      });
    } else {
      console.error('Error:', error);
    }
  }
}

testAdminLogin(); 