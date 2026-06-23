import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.alert.count({
      where: { resolved: false },
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('GET /api/alerts/count error:', error);
    return NextResponse.json({ count: 0 });
  }
}