import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    console.log('Testing curl command to product service');
    
    const curlCommand = `curl --location 'http://localhost:3003/api/v1/coupons?skip=0&take=10' --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODYwYmU1MS0wODNiLTQ5ZDAtODAyYy1lNDU3YjBmMmEwZDUiLCJlbWFpbCI6ImRlbW8zQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzQ4MzUwMzAxLCJleHAiOjE3NDgzNTEyMDEsImF1ZCI6InVzZXItc2VydmljZSIsImlzcyI6ImF1dGgtc2VydmljZSJ9.W3yYuXfyVQ0H-8r2tYG_7DtkWt0CYXR6oL_PGVqT3qs'`;
    
    try {
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.error('Curl command error:', stderr);
      }
      
      console.log('Curl command output:', stdout);
      
      try {
        // Try to parse the response as JSON
        const data = JSON.parse(stdout);
        
        return NextResponse.json({
          success: true,
          method: 'curl',
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : (data.coupons ? data.coupons.length : 'unknown'),
          data: data
        });
      } catch (parseError) {
        return NextResponse.json({
          success: false,
          method: 'curl',
          error: 'Failed to parse JSON response',
          rawOutput: stdout
        });
      }
    } catch (execError) {
      console.error('Error executing curl command:', execError);
      
      return NextResponse.json({
        success: false,
        method: 'curl',
        error: execError.message || 'Unknown error',
        errorType: execError.name
      });
    }
  } catch (error) {
    console.error('Error in test curl API route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 