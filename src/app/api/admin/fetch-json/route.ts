import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch JSON from URL' }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Fetch JSON error:', error);
    return NextResponse.json({ error: 'Failed to fetch or parse JSON' }, { status: 500 });
  }
}