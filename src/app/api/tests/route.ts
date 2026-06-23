import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleType = searchParams.get('sampleType');
    const result = searchParams.get('result');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const variant = searchParams.get('variant');

    const where: Record<string, unknown> = {};
    if (sampleType) where.sampleType = sampleType;
    if (result) where.result = result;
    if (variant) where.variant = variant;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const tests = await db.testResult.findMany({
      where,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('GET /api/tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sampleType, cfuValue, latitude, longitude, locationName, deviceBattery, variant, userId } = body;

    if (!sampleType || cfuValue === undefined || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const testResult = cfuValue > 0 ? 'POSITIF' : 'NEGATIF';

    const test = await db.testResult.create({
      data: {
        userId: userId || null,
        sampleType,
        cfuValue: Number(cfuValue),
        result: testResult,
        latitude: Number(latitude),
        longitude: Number(longitude),
        locationName: locationName || 'Lokasi Tidak Diketahui',
        deviceBattery: deviceBattery || null,
        variant: variant || 'HOME',
      },
    });

    // Check for outbreak: ≥3 positive in 10km radius within 24h
    if (testResult === 'POSITIF') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentPositives = await db.testResult.findMany({
        where: {
          id: { not: test.id },
          result: 'POSITIF',
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      const nearbyPositives = recentPositives.filter(
        (t) => haversineKm(latitude, longitude, t.latitude, t.longitude) <= 10
      );

      if (nearbyPositives.length >= 2) {
        // nearbyPositives + this test = ≥3
        const newAlert = await db.alert.create({
          data: {
            type: 'OUTBREAK',
            title: `Wabah Salmonella - ${locationName || 'Area Terdeteksi'}`,
            message: `Terdeteksi ${nearbyPositives.length + 1} titik positif Salmonella dalam radius 10km di wilayah ${locationName || 'tersebut'} dalam 24 jam terakhir. Dimohon segera dilakukan tindakan karantina.`,
            latitude,
            longitude,
            radiusKm: 10,
          },
        });

        // Broadcast alert to WebSocket clients
        try {
          await fetch('http://localhost:3005', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'alert:new', payload: newAlert }),
          });
        } catch { /* WebSocket service may not be running */ }
      }
    }

    // Broadcast new test to WebSocket clients
    try {
      await fetch('http://localhost:3005', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test:new', payload: test }),
      });
    } catch { /* WebSocket service may not be running */ }

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('POST /api/tests error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}