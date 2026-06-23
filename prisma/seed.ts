import { db } from '../src/lib/db';

const LOCATIONS = [
  { name: 'Pasar Minggu, Jakarta Selatan', lat: -6.2912, lng: 106.8436 },
  { name: 'Kemayoran, Jakarta Pusat', lat: -6.1684, lng: 106.8505 },
  { name: 'Cibubur, Jakarta Timur', lat: -6.3692, lng: 106.8824 },
  { name: 'Dago, Bandung', lat: -6.8847, lng: 107.6133 },
  { name: 'Cibiru, Bandung', lat: -6.9278, lng: 107.7181 },
  { name: 'Rungkut, Surabaya', lat: -7.3274, lng: 112.7866 },
  { name: 'Tandes, Surabaya', lat: -7.2819, lng: 112.7383 },
  { name: 'Malioboro, Yogyakarta', lat: -7.7927, lng: 110.3658 },
  { name: 'Sleman, Yogyakarta', lat: -7.7157, lng: 110.3907 },
  { name: 'Semarang Tengah', lat: -6.9666, lng: 110.4196 },
  { name: 'Pedurungan, Semarang', lat: -6.9932, lng: 110.4439 },
  { name: 'Medan Kota', lat: 3.5952, lng: 98.6722 },
  { name: 'Makassar Kota', lat: -5.1477, lng: 119.4327 },
  { name: 'Denpasar Selatan', lat: -8.6695, lng: 115.2393 },
  { name: 'Boyolali Kota', lat: -7.5156, lng: 110.5942 },
  { name: 'RPH Boyolali', lat: -7.5200, lng: 110.5980 },
  { name: 'Malang Kota', lat: -7.9666, lng: 112.6326 },
  { name: 'Kedungkandang, Malang', lat: -7.9833, lng: 112.6500 },
  { name: 'Bekasi Timur', lat: -6.2382, lng: 106.9605 },
  { name: 'Tangerang Selatan', lat: -6.3149, lng: 106.7408 },
];

const SAMPLE_TYPES = ['AYAM', 'TELUR', 'SUSU_MENTAH', 'DAGING_SAPI'];

async function seed() {
  console.log('🌱 Seeding database...');

  // Create users
  const gov = await db.user.create({
    data: { name: 'Dinas Kesehatan DKI Jakarta', email: 'dinas@salmonsens.id', role: 'GOVERNMENT' },
  });
  const pro = await db.user.create({
    data: { name: 'PT Sejahtera Poultry', email: 'peternak@salmonsens.id', role: 'PRO' },
  });
  const home = await db.user.create({
    data: { name: 'Ibu Sari', email: 'user@salmonsens.id', role: 'HOME' },
  });
  console.log('✅ Users created');

  // Create 60 test results
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length];
    const daysAgo = Math.floor(i * 0.5);
    const isPositive = Math.random() < 0.30;
    const cfuValue = isPositive ? Math.floor(Math.random() * 100) + 1 : 0;
    const sampleType = SAMPLE_TYPES[Math.floor(Math.random() * SAMPLE_TYPES.length)];
    const variant = i % 3 === 0 ? 'HOME' : 'PRO';
    const userId = variant === 'HOME' ? home.id : variant === 'PRO' ? pro.id : gov.id;

    await db.testResult.create({
      data: {
        userId,
        sampleType,
        cfuValue,
        result: cfuValue > 0 ? 'POSITIF' : 'NEGATIF',
        latitude: loc.lat + (Math.random() - 0.5) * 0.05,
        longitude: loc.lng + (Math.random() - 0.5) * 0.05,
        locationName: loc.name,
        deviceBattery: Math.floor(Math.random() * 40) + 60,
        variant,
        reported: false,
        createdAt: new Date(now - daysAgo * 86400000 - Math.random() * 86400000),
      },
    });
  }
  console.log('✅ Test results created');

  // Create alerts
  await db.alert.create({
    data: {
      type: 'OUTBREAK',
      title: 'Wabah Salmonella - Boyolali',
      message: 'Terdeteksi ≥3 titik positif Salmonella dalam radius 10km di wilayah Boyolali dalam 24 jam terakhir. Dimohon segera dilakukan tindakan karantina.',
      latitude: -7.5156,
      longitude: 110.5942,
      radiusKm: 10,
      resolved: false,
    },
  });
  await db.alert.create({
    data: {
      type: 'WARNING',
      title: 'Peringatan - Jakarta Selatan',
      message: 'Terdeteksi 2 titik positif Salmonella di area Pasar Minggu. Perlu pengawasan lebih lanjut.',
      latitude: -6.2912,
      longitude: 106.8436,
      radiusKm: 10,
      resolved: false,
    },
  });
  await db.alert.create({
    data: {
      type: 'INFO',
      title: 'Pembaruan Sistem',
      message: 'Sistem deteksi SALMOSENS telah diperbarui ke versi 2.1. Akurasi peningkatan 0.3%.',
      resolved: true,
    },
  });
  console.log('✅ Alerts created');
  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { db.$disconnect(); process.exit(0); });