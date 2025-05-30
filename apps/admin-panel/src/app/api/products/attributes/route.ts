import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/products/attributes - Starting request');
    
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      console.log('GET /api/products/attributes - No authentication token found');
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Log all search parameters for debugging
    console.log('GET /api/products/attributes - Search parameters:');
    searchParams.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Create a new URLSearchParams object for the backend API
    const apiParams = new URLSearchParams();
    
    // Map and transform frontend parameters to backend API parameters
    // Pagination parameters
    if (searchParams.has('page')) apiParams.set('page', searchParams.get('page')!);
    if (searchParams.has('pageSize')) apiParams.set('limit', searchParams.get('pageSize')!);
    
    // Sorting parameters
    if (searchParams.has('sortBy')) apiParams.set('sortBy', searchParams.get('sortBy')!);
    if (searchParams.has('sortOrder')) apiParams.set('sortOrder', searchParams.get('sortOrder')!);
    
    // Search parameter
    if (searchParams.has('search')) apiParams.set('search', searchParams.get('search')!);
    
    // Filter parameters
    if (searchParams.has('type')) {
      const types = searchParams.get('type')!.split(',');
      types.forEach(type => apiParams.append('type', type));
    }
    
    if (searchParams.has('isFilterable')) {
      apiParams.set('isFilterable', searchParams.get('isFilterable')!);
    }
    
    if (searchParams.has('isRequired')) {
      apiParams.set('isRequired', searchParams.get('isRequired')!);
    }
    
    // If isActive filter is specified, use it; otherwise don't filter by isActive
    // This will return both active and inactive attributes by default
    if (searchParams.has('isActive')) {
      apiParams.set('isActive', searchParams.get('isActive')!);
    } else {
      // Don't set isActive parameter to get all attributes
      console.log('GET /api/products/attributes - Fetching both active and inactive attributes');
    }
    
    // Log the full URL being requested
    const fullUrl = `${PRODUCT_SERVICE_URL}/api/v1/attributes?${apiParams.toString()}`;
    console.log(`GET /api/products/attributes - Requesting: ${fullUrl}`);
    
    // Forward request to product service with correct API path
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.log(`GET /api/products/attributes - Error response: ${response.status} ${response.statusText}`);
      let error;
      try {
        error = await response.json();
        console.log('GET /api/products/attributes - Error details:', error);
      } catch (e) {
        console.log('GET /api/products/attributes - Could not parse error response as JSON');
      }
      
      return NextResponse.json(
        { message: error?.message || `Failed to fetch attributes: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Parse the response data
    const responseData = await response.json();
    console.log(`GET /api/products/attributes - Raw response:`, responseData);
    
    // Check if the response is an array (the backend returns an array of attributes)
    // If it is, transform it to the expected format with attributes and pagination properties
    let transformedData;
    if (Array.isArray(responseData)) {
      console.log(`GET /api/products/attributes - Transforming array response to expected format`);
      
      // Apply client-side filtering if the backend didn't filter correctly
      let processedAttributes = [...responseData];
      
      // Apply client-side search if specified
      if (searchParams.has('search') && searchParams.get('search')!.trim() !== '') {
        const searchTerm = searchParams.get('search')!.toLowerCase().trim();
        console.log(`GET /api/products/attributes - Applying client-side search for "${searchTerm}"`);
        processedAttributes = processedAttributes.filter(attr => 
          attr.name.toLowerCase().includes(searchTerm) || 
          (attr.description && attr.description.toLowerCase().includes(searchTerm))
        );
      }
      
      // Filter by isFilterable if specified
      if (searchParams.has('isFilterable')) {
        const isFilterableValue = searchParams.get('isFilterable') === 'true';
        console.log(`GET /api/products/attributes - Applying client-side filter for isFilterable=${isFilterableValue}`);
        processedAttributes = processedAttributes.filter(attr => attr.isFilterable === isFilterableValue);
      }
      
      // Filter by isRequired if specified
      if (searchParams.has('isRequired')) {
        const isRequiredValue = searchParams.get('isRequired') === 'true';
        console.log(`GET /api/products/attributes - Applying client-side filter for isRequired=${isRequiredValue}`);
        processedAttributes = processedAttributes.filter(attr => attr.isRequired === isRequiredValue);
      }
      
      // Filter by type if specified
      if (searchParams.has('type')) {
        const types = searchParams.get('type')!.split(',');
        console.log(`GET /api/products/attributes - Applying client-side filter for types=${types.join(', ')}`);
        processedAttributes = processedAttributes.filter(attr => types.includes(attr.type));
      }
      
      // Apply client-side sorting
      if (searchParams.has('sortBy')) {
        const sortBy = searchParams.get('sortBy')!;
        const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'DESC' ? -1 : 1;
        console.log(`GET /api/products/attributes - Applying client-side sorting by ${sortBy} ${sortOrder === 1 ? 'ASC' : 'DESC'}`);
        
        processedAttributes.sort((a, b) => {
          // Handle different data types
          if (typeof a[sortBy] === 'string' && typeof b[sortBy] === 'string') {
            return a[sortBy].localeCompare(b[sortBy]) * sortOrder;
          } else if (typeof a[sortBy] === 'boolean' && typeof b[sortBy] === 'boolean') {
            return (a[sortBy] === b[sortBy] ? 0 : a[sortBy] ? 1 : -1) * sortOrder;
          } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            return (new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime()) * sortOrder;
          } else {
            return ((a[sortBy] > b[sortBy]) ? 1 : -1) * sortOrder;
          }
        });
      }
      
      // Apply client-side pagination
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const totalItems = processedAttributes.length;
      const totalPages = Math.ceil(totalItems / pageSize) || 1;
      
      // Get the current page of items
      const paginatedAttributes = processedAttributes.slice(startIndex, endIndex);
      
      console.log(`GET /api/products/attributes - Applied pagination: page ${page}, size ${pageSize}, total ${totalItems}, pages ${totalPages}`);
      
      transformedData = {
        attributes: paginatedAttributes,
        pagination: {
          total: totalItems,
          totalPages: totalPages,
          currentPage: page,
          pageSize: pageSize,
          hasMore: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } else {
      // If it's already in the expected format, use it as is
      transformedData = responseData;
      
      // Apply client-side filtering if needed
      if (transformedData.attributes && Array.isArray(transformedData.attributes)) {
        let processedAttributes = [...transformedData.attributes];
        let needsProcessing = false;
        
        // Apply client-side search if specified
        if (searchParams.has('search') && searchParams.get('search')!.trim() !== '') {
          const searchTerm = searchParams.get('search')!.toLowerCase().trim();
          console.log(`GET /api/products/attributes - Applying client-side search for "${searchTerm}"`);
          processedAttributes = processedAttributes.filter(attr => 
            attr.name.toLowerCase().includes(searchTerm) || 
            (attr.description && attr.description.toLowerCase().includes(searchTerm))
          );
          needsProcessing = true;
        }
        
        // Filter by isFilterable if specified
        if (searchParams.has('isFilterable')) {
          const isFilterableValue = searchParams.get('isFilterable') === 'true';
          console.log(`GET /api/products/attributes - Applying client-side filter for isFilterable=${isFilterableValue}`);
          processedAttributes = processedAttributes.filter(attr => attr.isFilterable === isFilterableValue);
          needsProcessing = true;
        }
        
        // Filter by isRequired if specified
        if (searchParams.has('isRequired')) {
          const isRequiredValue = searchParams.get('isRequired') === 'true';
          console.log(`GET /api/products/attributes - Applying client-side filter for isRequired=${isRequiredValue}`);
          processedAttributes = processedAttributes.filter(attr => attr.isRequired === isRequiredValue);
          needsProcessing = true;
        }
        
        // Filter by type if specified
        if (searchParams.has('type')) {
          const types = searchParams.get('type')!.split(',');
          console.log(`GET /api/products/attributes - Applying client-side filter for types=${types.join(', ')}`);
          processedAttributes = processedAttributes.filter(attr => types.includes(attr.type));
          needsProcessing = true;
        }
        
        // Apply client-side sorting
        if (searchParams.has('sortBy')) {
          const sortBy = searchParams.get('sortBy')!;
          const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'DESC' ? -1 : 1;
          console.log(`GET /api/products/attributes - Applying client-side sorting by ${sortBy} ${sortOrder === 1 ? 'ASC' : 'DESC'}`);
          
          processedAttributes.sort((a, b) => {
            // Handle different data types
            if (typeof a[sortBy] === 'string' && typeof b[sortBy] === 'string') {
              return a[sortBy].localeCompare(b[sortBy]) * sortOrder;
            } else if (typeof a[sortBy] === 'boolean' && typeof b[sortBy] === 'boolean') {
              return (a[sortBy] === b[sortBy] ? 0 : a[sortBy] ? 1 : -1) * sortOrder;
            } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
              return (new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime()) * sortOrder;
            } else {
              return ((a[sortBy] > b[sortBy]) ? 1 : -1) * sortOrder;
            }
          });
          needsProcessing = true;
        }
        
        if (needsProcessing) {
          // Apply client-side pagination
          const page = parseInt(searchParams.get('page') || '1', 10);
          const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const totalItems = processedAttributes.length;
          const totalPages = Math.ceil(totalItems / pageSize) || 1;
          
          // Get the current page of items
          const paginatedAttributes = processedAttributes.slice(startIndex, endIndex);
          
          console.log(`GET /api/products/attributes - Applied pagination: page ${page}, size ${pageSize}, total ${totalItems}, pages ${totalPages}`);
          
          transformedData = {
            attributes: paginatedAttributes,
            pagination: {
              total: totalItems,
              totalPages: totalPages,
              currentPage: page,
              pageSize: pageSize,
              hasMore: page < totalPages,
              hasPrevious: page > 1
            }
          };
        }
      }
    }
    
    console.log(`GET /api/products/attributes - Success response with ${transformedData.attributes?.length || 0} attributes`);
    
    // Log a sample of the data structure
    if (transformedData.attributes && transformedData.attributes.length > 0) {
      console.log('GET /api/products/attributes - First attribute sample:', {
        id: transformedData.attributes[0].id,
        name: transformedData.attributes[0].name,
        type: transformedData.attributes[0].type
      });
    } else {
      console.log('GET /api/products/attributes - No attributes returned in the response');
    }
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/products/attributes - Starting request');
    
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      console.log('POST /api/products/attributes - No authentication token found');
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log('POST /api/products/attributes - Request body:', body);
    
    // Ensure boolean values are explicitly set
    const formattedBody = {
      ...body,
      isActive: body.isActive === undefined ? true : !!body.isActive,
      isFilterable: body.isFilterable === undefined ? false : !!body.isFilterable,
      isRequired: body.isRequired === undefined ? false : !!body.isRequired
    };
    
    console.log('POST /api/products/attributes - Formatted body:', {
      ...formattedBody,
      isActive: formattedBody.isActive,
      isFilterable: formattedBody.isFilterable,
      isRequired: formattedBody.isRequired
    });
    
    // Forward request to product service with correct API path for admin operations
    const fullUrl = `${PRODUCT_SERVICE_URL}/api/v1/admin/attributes`;
    console.log(`POST /api/products/attributes - Requesting: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedBody),
    });

    if (!response.ok) {
      console.log(`POST /api/products/attributes - Error response: ${response.status} ${response.statusText}`);
      let error;
      try {
        error = await response.json();
        console.log('POST /api/products/attributes - Error details:', error);
      } catch (e) {
        console.log('POST /api/products/attributes - Could not parse error response as JSON');
      }
      
      return NextResponse.json(
        { message: error?.message || `Failed to create attribute: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('POST /api/products/attributes - Success response:', {
      id: data.id,
      name: data.name,
      type: data.type
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating attribute:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 