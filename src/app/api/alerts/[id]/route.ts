import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const alert = await db.alert.update({
      where: { id },
      data: {
        resolved: body.resolved === true,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('PATCH /api/alerts/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui notifikasi' }, { status: 500 });
  }
}