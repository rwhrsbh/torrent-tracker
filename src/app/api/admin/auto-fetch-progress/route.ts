import { NextRequest, NextResponse } from 'next/server';

// Глобальное состояние прогресса (в реальном приложении лучше использовать Redis)
let progressState: {
  isRunning: boolean;
  current: number;
  total: number;
  currentSource: string;
  phase: string;
  startTime?: number;
} = {
  isRunning: false,
  current: 0,
  total: 0,
  currentSource: '',
  phase: ''
};

export function getProgressState() {
  return progressState;
}

export function updateProgressState(update: Partial<typeof progressState>) {
  progressState = { ...progressState, ...update };
}

export function resetProgressState() {
  progressState = {
    isRunning: false,
    current: 0,
    total: 0,
    currentSource: '',
    phase: ''
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    if (token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(progressState);
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}