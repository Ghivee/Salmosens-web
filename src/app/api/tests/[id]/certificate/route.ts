import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SAMPLE_LABELS: Record<string, string> = {
  AYAM: 'Daging Ayam',
  TELUR: 'Telur',
  SUSU_MENTAH: 'Susu Mentah',
  DAGING_SAPI: 'Daging Sapi',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const test = await db.testResult.findUnique({ where: { id } });

    if (!test) {
      return NextResponse.json({ error: 'Hasil uji tidak ditemukan' }, { status: 404 });
    }

    const date = new Date(test.createdAt);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const certNumber = `CERT-${dateStr}-${test.id.slice(-4).toUpperCase()}`;

    return NextResponse.json({
      certificateNumber: certNumber,
      sampleType: SAMPLE_LABELS[test.sampleType] || test.sampleType,
      sampleTypeCode: test.sampleType,
      result: test.result,
      cfuValue: test.cfuValue,
      cfuUnit: 'CFU/mL',
      standard: 'SNI 7388:2009',
      standardDescription: 'Zero Tolerance - Tidak boleh terdeteksi Salmonella spp.',
      locationName: test.locationName,
      latitude: test.latitude,
      longitude: test.longitude,
      testDate: test.createdAt,
      deviceVariant: test.variant,
      issuedAt: new Date().toISOString(),
      issuer: 'SALMOSENS Digital Platform',
      authority: 'Kementerian Kesehatan & Kementerian Pertanian RI',
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Gagal mengambil data sertifikat' }, { status: 500 });
  }
}