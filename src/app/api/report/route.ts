import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: 'testId wajib diisi' }, { status: 400 });
    }

    // Mark the test as reported
    const test = await db.testResult.update({
      where: { id: testId },
      data: { reported: true },
    });

    // Create an alert for this report
    await db.alert.create({
      data: {
        type: 'WARNING',
        title: `Laporan Kontaminasi - ${test.sampleType}`,
        message: `Sampel ${test.sampleType} di ${test.locationName} dilaporkan terkontaminasi Salmonella. CFU: ${test.cfuValue}`,
        latitude: test.latitude,
        longitude: test.longitude,
        radiusKm: 1,
        resolved: false,
      },
    });

    return NextResponse.json({ success: true, message: 'Laporan berhasil dikirim ke dinas terkait' });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Gagal mengirim laporan' }, { status: 500 });
  }
}