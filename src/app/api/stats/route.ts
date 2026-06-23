import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = from ? new Date(from) : startOfMonth;
    const endDate = to ? new Date(to + 'T23:59:59.999') : now;

    // --- Batch query: fetch ALL results for the month (or date range) in ONE go ---
    const [allThisMonth, totalThisMonth, positiveThisMonth] = await Promise.all([
      db.testResult.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { sampleType: true, result: true, locationName: true, createdAt: true },
      }),
      db.testResult.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      db.testResult.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          result: 'POSITIF',
        },
      }),
    ]);

    const positiveRate = totalThisMonth > 0 ? Math.round((positiveThisMonth / totalThisMonth) * 1000) / 10 : 0;

    // --- Commodity distribution ---
    const commodityCounts: Record<string, { total: number; positive: number }> = {};
    for (const t of allThisMonth) {
      if (!commodityCounts[t.sampleType]) {
        commodityCounts[t.sampleType] = { total: 0, positive: 0 };
      }
      commodityCounts[t.sampleType].total++;
      if (t.result === 'POSITIF') commodityCounts[t.sampleType].positive++;
    }

    let mostVulnerable = 'Tidak ada data';
    let maxPositiveRate = 0;
    for (const [commodity, counts] of Object.entries(commodityCounts)) {
      if (counts.total >= 2) {
        const rate = counts.positive / counts.total;
        if (rate > maxPositiveRate) {
          maxPositiveRate = rate;
          mostVulnerable = commodity;
        }
      }
    }

    const commodityLabels: Record<string, string> = {
      AYAM: 'Daging Ayam',
      TELUR: 'Telur',
      SUSU_MENTAH: 'Susu Mentah',
      DAGING_SAPI: 'Daging Sapi',
    };

    const commodityDistribution = Object.entries(commodityCounts)
      .map(([type, counts]) => ({
        type,
        label: commodityLabels[type] || type,
        total: counts.total,
        positive: counts.positive,
        negative: counts.total - counts.positive,
        positiveRate: counts.total > 0 ? Math.round((counts.positive / counts.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    mostVulnerable = commodityLabels[mostVulnerable] || mostVulnerable;

    // --- Daily trend: use a single query for the 30-day range instead of 30 separate queries ---
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const allDailyResults = await db.testResult.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { result: true, createdAt: true },
    });

    const dayMap: Record<string, { positif: number; negatif: number }> = {};
    for (const r of allDailyResults) {
      const dayStr = r.createdAt.toISOString().split('T')[0];
      if (!dayMap[dayStr]) dayMap[dayStr] = { positif: 0, negatif: 0 };
      if (r.result === 'POSITIF') dayMap[dayStr].positif++;
      else dayMap[dayStr].negatif++;
    }

    const dailyTrend: Array<{ date: string; positif: number; negatif: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      const dayStr = dayStart.toISOString().split('T')[0];
      dailyTrend.push({
        date: dayStr,
        positif: dayMap[dayStr]?.positif ?? 0,
        negatif: dayMap[dayStr]?.negatif ?? 0,
      });
    }

    // --- City ranking: top 5 cities by positive count ---
    const cityMap: Record<string, { total: number; positive: number }> = {};
    for (const t of allThisMonth) {
      if (!cityMap[t.locationName]) {
        cityMap[t.locationName] = { total: 0, positive: 0 };
      }
      cityMap[t.locationName].total++;
      if (t.result === 'POSITIF') cityMap[t.locationName].positive++;
    }

    const cityRanking = Object.entries(cityMap)
      .map(([cityName, counts]) => ({
        cityName,
        total: counts.total,
        positive: counts.positive,
        positiveRate: Math.round((counts.positive / counts.total) * 1000) / 10,
      }))
      .sort((a, b) => b.positive - a.positive || b.positiveRate - a.positiveRate)
      .slice(0, 5);

    // --- Result distribution for pie chart ---
    const resultDistribution = {
      POSITIF: positiveThisMonth,
      NEGATIF: totalThisMonth - positiveThisMonth,
    };

    return NextResponse.json({
      totalThisMonth,
      positiveRate,
      mostVulnerable,
      dailyTrend,
      commodityDistribution,
      cityRanking,
      resultDistribution,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}
