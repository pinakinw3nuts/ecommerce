import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../../../lib/make-request';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  console.log('Orders API called at:', new Date().toISOString());
  try {
    // Get the admin token from the request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      console.log('No admin token found');
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    
    // Check if search looks like an ID (UUIDs are typically 36 chars, but users might copy partial IDs)
    const isSearchingForId = searchParam && (
      // Full UUID format
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchParam) ||
      // Partial UUID (at least 8 chars, no spaces, mostly hex)
      (searchParam.length >= 8 && /^[0-9a-f-]+$/i.test(searchParam))
    );
    
    if (isSearchingForId) {
      console.log('Searching for order with ID pattern:', searchParam);
      
      // Get more orders to filter client-side
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search'); // Remove search to get all orders for the current status filter
      newParams.set('limit', '100'); // Fetch more orders to increase chance of finding the right one
      
      const requestUrl = `${ORDERS_SERVICE_URL}/api/v1/orders?${newParams.toString()}`;
      console.log('Making request for ID search:', requestUrl);
      
      const response = await makeRequest(
        requestUrl,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Admin-Role': 'admin'
          },
          cache: 'no-store',
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching orders for ID search:', errorData);
        return NextResponse.json(
          { 
            message: errorData?.message || 'Failed to fetch orders',
            code: errorData?.code || 'API_ERROR'
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      if (data.orders && Array.isArray(data.orders)) {
        // Filter orders by ID or order number
        const filteredOrders = data.orders.filter((order: any) => {
          // Match by ID
          if (order.id && order.id.toLowerCase().includes(searchParam.toLowerCase())) {
            return true;
          }
          
          // Match by order number (often stored in metadata)
          if (order.metadata && order.metadata.orderNumber && 
              order.metadata.orderNumber.toLowerCase().includes(searchParam.toLowerCase())) {
            return true;
          }
          
          return false;
        });
        
        // Enhance order data with customer information
        const enhancedOrders = filteredOrders.map((order: any) => {
          // Extract customer name and email from metadata if available
          const customerName = order.metadata?.customerName || 
                              order.metadata?.customer?.name || 
                              order.metadata?.userName || 
                              null;
                              
          const customerEmail = order.metadata?.customerEmail || 
                               order.metadata?.customer?.email || 
                               order.metadata?.userEmail || 
                               null;
          
          // Extract customer phone from metadata if available
          const customerPhone = order.metadata?.customerPhone || 
                               order.metadata?.customer?.phone || 
                               order.metadata?.customer?.phoneNumber ||
                               order.metadata?.userPhone || 
                               null;
          
          // Extract order number from metadata if not already set
          const orderNumber = order.orderNumber || 
                             order.metadata?.orderNumber || 
                             null;
          
          return {
            ...order,
            customerName,
            customerEmail,
            customerPhone,
            orderNumber
          };
        });
        
        // Get pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        
        // Apply pagination to filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = enhancedOrders.slice(startIndex, endIndex);
        
        return NextResponse.json({
          orders: paginatedOrders,
          pagination: {
            total: enhancedOrders.length,
            page,
            limit,
            pages: Math.ceil(enhancedOrders.length / limit)
          }
        });
      }
    }
    
    // Check if we have a comma-separated status parameter
    if (statusParam && statusParam.includes(',')) {
      console.log('Multiple status values detected:', statusParam);
      const statusValues = statusParam.split(',');
      let allOrders: any[] = [];
      let totalOrders = 0;
      
      // Make separate requests for each status value
      for (const status of statusValues) {
        // Create a new query parameter set for each request
        const newParams = new URLSearchParams(searchParams);
        newParams.set('status', status);
        
        const requestUrl = `${ORDERS_SERVICE_URL}/api/v1/orders?${newParams.toString()}`;
        console.log('Making request for status:', status, 'URL:', requestUrl);
        
        const response = await makeRequest(
          requestUrl,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'X-Admin-Role': 'admin' 
            },
            cache: 'no-store',
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Error fetching orders for status ${status}:`, errorData);
          continue; // Skip this status and continue with others
        }
        
        const data = await response.json();
        if (data.orders && Array.isArray(data.orders)) {
          allOrders = [...allOrders, ...data.orders];
          totalOrders += data.pagination?.total || 0;
        }
      }
      
      // Get pagination parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const order = searchParams.get('order') || 'DESC';
      
      // Sort the combined results
      if (sortBy) {
        allOrders.sort((a, b) => {
          const valA = a[sortBy];
          const valB = b[sortBy];
          
          if (order.toUpperCase() === 'DESC') {
            return valA > valB ? -1 : valA < valB ? 1 : 0;
          } else {
            return valA < valB ? -1 : valA > valB ? 1 : 0;
          }
        });
      }
      
      // Enhance order data with customer information
      const enhancedOrders = allOrders.map((order: any) => {
        // Extract customer name and email from metadata if available
        const customerName = order.metadata?.customerName || 
                            order.metadata?.customer?.name || 
                            order.metadata?.userName || 
                            null;
                            
        const customerEmail = order.metadata?.customerEmail || 
                             order.metadata?.customer?.email || 
                             order.metadata?.userEmail || 
                             null;
        
        // Extract customer phone from metadata if available
        const customerPhone = order.metadata?.customerPhone || 
                             order.metadata?.customer?.phone || 
                             order.metadata?.customer?.phoneNumber ||
                             order.metadata?.userPhone || 
                             null;
        
        // Extract order number from metadata if not already set
        const orderNumber = order.orderNumber || 
                           order.metadata?.orderNumber || 
                           null;
        
        return {
          ...order,
          customerName,
          customerEmail,
          customerPhone,
          orderNumber
        };
      });
      
      // Apply pagination to the combined results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = enhancedOrders.slice(startIndex, endIndex);
      
      return NextResponse.json({
        orders: paginatedOrders,
        pagination: {
          total: totalOrders,
          page,
          limit,
          pages: Math.ceil(totalOrders / limit)
        }
      });
    }
    
    // Standard request for a single status or no status filter
    console.log('Making request with token:', adminToken);
    const requestUrl = `${ORDERS_SERVICE_URL}/api/v1/orders?${searchParams.toString()}`;
    console.log('Full request URL:', requestUrl);
    
    // Add custom header to indicate admin role
    const response = await makeRequest(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Admin-Role': 'admin' // Add explicit admin role header
        },
        cache: 'no-store', // Prevent caching
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from orders API:', errorData);
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      // If we get a 403 Forbidden with "Access denied. Required role: admin" message
      if (response.status === 403 && errorData?.message?.includes('Access denied. Required role: admin')) {
        // Try the refresh token endpoint to get a new token
        const refreshResponse = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (refreshResponse.ok) {
          // If refresh was successful, return a response that will trigger a retry
          return NextResponse.json(
            { message: 'Token refreshed, please retry', code: 'TOKEN_REFRESHED' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to fetch orders',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Orders fetched successfully. Response format:', {
      isArray: Array.isArray(data),
      hasDataProperty: data && 'data' in data,
      hasOrdersProperty: data && 'orders' in data,
      orderCount: Array.isArray(data) ? data.length : 
                  (data?.data && Array.isArray(data.data)) ? data.data.length :
                  (data?.orders && Array.isArray(data.orders)) ? data.orders.length : 0,
      responseKeys: Object.keys(data)
    });
    
    // Enhance order data with customer information from metadata
    if (data?.orders && Array.isArray(data.orders)) {
      data.orders = data.orders.map((order: any) => {
        // Extract customer name and email from metadata if available
        const customerName = order.metadata?.customerName || 
                            order.metadata?.customer?.name || 
                            order.metadata?.userName || 
                            null;
                            
        const customerEmail = order.metadata?.customerEmail || 
                             order.metadata?.customer?.email || 
                             order.metadata?.userEmail || 
                             null;
        
        // Extract customer phone from metadata if available
        const customerPhone = order.metadata?.customerPhone || 
                             order.metadata?.customer?.phone || 
                             order.metadata?.customer?.phoneNumber ||
                             order.metadata?.userPhone || 
                             null;
        
        // Extract order number from metadata if not already set
        const orderNumber = order.orderNumber || 
                           order.metadata?.orderNumber || 
                           null;
        
        return {
          ...order,
          customerName,
          customerEmail,
          customerPhone,
          orderNumber
        };
      });
    }
    
    // Return the exact response format from the order service
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        details: error.cause ? {
          code: error.cause.code,
          syscall: error.cause.syscall,
          address: error.cause.address,
          port: error.cause.port
        } : undefined
      },
      { status: error.status || 500 }
    );
  }
}

// POST /api/orders - Create a new order (typically not used in admin panel)
export async function POST(request: NextRequest) {
  try {
    // Get the admin token from the request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const orderData = await request.json();
    console.log('Creating order with data:', orderData);
    
    const response = await makeRequest(
      `${ORDERS_SERVICE_URL}/api/v1/orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
          'X-Admin-Role': 'admin' // Add explicit admin role header
        },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error creating order:', errorData);
      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to create order',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Order created successfully:', result);
    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get('page') || '1');
//     const pageSize = parseInt(searchParams.get('pageSize') || '10');
//     const search = searchParams.get('search') || undefined;
//     const status = searchParams.get('status') || undefined;
//     const paymentStatus = searchParams.get('paymentStatus') || undefined;
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const minValue = searchParams.get('minValue');
//     const maxValue = searchParams.get('maxValue');
//     const sortBy = searchParams.get('sortBy') || 'createdAt';
//     const sortOrder = searchParams.get('sortOrder') || 'desc';

//     // Create filters for the order service
//     const filters: OrderFilters = {
//       status,
//       search,
//       startDate: fromDate ? new Date(fromDate) : undefined,
//       endDate: toDate ? new Date(toDate) : undefined,
//       minAmount: minValue ? parseFloat(minValue) : undefined,
//       maxAmount: maxValue ? parseFloat(maxValue) : undefined,
//     };

//     // Create pagination options
//     const pagination: PaginationOptions = {
//       page,
//       limit: pageSize,
//       sortBy,
//       order: sortOrder === 'asc' ? 'ASC' : 'DESC',
//     };

//     // Use the order service to fetch orders
//     const result = await orderService.listOrders(filters, pagination);

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch orders' },
//       { status: 500 }
//     );
//   }
// } 