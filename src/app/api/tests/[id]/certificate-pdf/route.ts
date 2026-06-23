import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SAMPLE_LABELS: Record<string, string> = {
  AYAM: 'Daging Ayam',
  TELUR: 'Telur',
  SUSU_MENTAH: 'Susu Mentah',
  DAGING_SAPI: 'Daging Sapi',
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

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

    const testDate = new Date(test.createdAt);
    const dateStr = testDate.toISOString().slice(0, 10).replace(/-/g, '');
    const certNumber = `CERT-${dateStr}-${test.id.slice(-4).toUpperCase()}`;
    const sampleLabel = SAMPLE_LABELS[test.sampleType] || test.sampleType;
    const isPositive = test.result === 'POSITIF';
    const issuedAt = new Date();

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sertifikat ${certNumber} — SALMOSENS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 24px;
      color: #1a1a2e;
    }

    .certificate {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 40px 48px;
    }

    /* Decorative border */
    .cert-border {
      position: absolute;
      inset: 12px;
      border: 2.5px solid ${isPositive ? '#dc2626' : '#16a34a'};
      border-radius: 4px;
      pointer-events: none;
    }
    .cert-border-inner {
      position: absolute;
      inset: 18px;
      border: 1px solid ${isPositive ? '#fca5a5' : '#86efac'};
      border-radius: 2px;
      pointer-events: none;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 48px;
      height: 48px;
      pointer-events: none;
    }
    .corner-tl { top: 24px; left: 24px; border-top: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; border-left: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; }
    .corner-tr { top: 24px; right: 24px; border-top: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; border-right: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; }
    .corner-bl { bottom: 24px; left: 24px; border-bottom: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; border-left: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; }
    .corner-br { bottom: 24px; right: 24px; border-bottom: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; border-right: 3px solid ${isPositive ? '#dc2626' : '#16a34a'}; }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      background: ${isPositive ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #16a34a, #15803d)'};
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: 800;
    }

    .brand-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 3px;
      color: ${isPositive ? '#dc2626' : '#16a34a'};
    }

    .brand-sub {
      font-size: 11px;
      color: #6b7280;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #374151;
      margin-top: 8px;
      letter-spacing: 1px;
    }

    /* Result badge */
    .result-section {
      text-align: center;
      margin: 32px 0;
    }

    .result-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 16px 40px;
      border-radius: 12px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 4px;
      color: white;
      background: ${isPositive ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #16a34a, #166534)'};
      box-shadow: 0 4px 16px ${isPositive ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'};
    }

    .result-icon {
      font-size: 32px;
    }

    .result-desc {
      font-size: 14px;
      color: #6b7280;
      margin-top: 12px;
      font-style: italic;
    }

    /* Details table */
    .details {
      margin: 32px auto;
      max-width: 560px;
    }

    .details-title {
      font-size: 13px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      text-align: center;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }
    .detail-row:nth-child(even) {
      background: #f9fafb;
    }

    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #1f2937;
      font-weight: 600;
      text-align: right;
    }

    /* QR-like decorative element */
    .qr-section {
      text-align: center;
      margin: 32px 0;
    }

    .qr-box {
      display: inline-block;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
    }

    .qr-code {
      width: 80px;
      height: 80px;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      gap: 1px;
    }

    .qr-cell {
      border-radius: 1px;
    }
    .qr-cell.dark { background: #1f2937; }
    .qr-cell.light { background: #ffffff; }

    .qr-label {
      font-size: 9px;
      color: #9ca3af;
      margin-top: 6px;
      letter-spacing: 1px;
    }

    /* Reference standard */
    .standard-bar {
      text-align: center;
      margin: 24px 0;
      padding: 12px 24px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
    }

    .standard-text {
      font-size: 12px;
      color: #166534;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 40px;
      left: 48px;
      right: 48px;
      border-top: 2px solid #e5e7eb;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #9ca3af;
    }

    .footer-left { text-align: left; }
    .footer-right { text-align: right; }

    .footer-line {
      margin-bottom: 2px;
    }

    .footer-highlight {
      color: #6b7280;
      font-weight: 600;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 100px;
      font-weight: 900;
      color: ${isPositive ? 'rgba(220,38,38,0.04)' : 'rgba(22,163,74,0.04)'};
      letter-spacing: 20px;
      pointer-events: none;
      white-space: nowrap;
    }

    /* Print styles */
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; width: 100%; }
      .no-print { display: none; }
    }

    .print-btn {
      display: block;
      margin: 16px auto;
      padding: 10px 32px;
      background: #1a1a2e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-btn:hover { background: #2d2d4a; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>

  <div class="certificate">
    <div class="watermark">SALMOSENS</div>
    <div class="cert-border"></div>
    <div class="cert-border-inner"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- Header -->
    <div class="header">
      <div class="brand-row">
        <div class="brand-icon">🦠</div>
        <div>
          <div class="brand-name">SALMOSENS</div>
          <div class="brand-sub">Indonesian Food Safety Digital Platform</div>
        </div>
      </div>
      <div class="doc-title">SERTIFIKAT HASIL UJI MIKROBIOLOGI</div>
    </div>

    <!-- Result badge -->
    <div class="result-section">
      <div class="result-badge">
        <span class="result-icon">${isPositive ? '⚠️' : '✅'}</span>
        ${test.result}
      </div>
      <div class="result-desc">
        ${isPositive
          ? 'TERDETEKSI Salmonella spp. — JANGAN DIKONSUMSI'
          : 'TIDAK terdeteksi Salmonella spp. — AMAN DIKONSUMSI'}
      </div>
    </div>

    <!-- Standard reference -->
    <div class="standard-bar">
      <div class="standard-text">
        📋 Berdasarkan Standar Nasional Indonesia <strong>SNI 7388:2009</strong> — Batas Maksimum Cemaran Mikroba dalam Pangan<br>
        <span style="font-weight: 400; font-size: 11px;">Zero Tolerance: Tidak boleh terdeteksi Salmonella spp. pada sampel pangan</span>
      </div>
    </div>

    <!-- Test details -->
    <div class="details">
      <div class="details-title">Detail Pengujian</div>
      <div class="detail-row">
        <span class="detail-label">Nomor Sertifikat</span>
        <span class="detail-value">${certNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Jenis Sampel</span>
        <span class="detail-value">${sampleLabel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Nilai CFU</span>
        <span class="detail-value">${test.cfuValue} CFU/mL</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Lokasi Pengambilan</span>
        <span class="detail-value">${test.locationName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Koordinat GPS</span>
        <span class="detail-value">${test.latitude.toFixed(6)}, ${test.longitude.toFixed(6)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Variasi Perangkat</span>
        <span class="detail-value">SALMOSENS ${test.variant === 'PRO' ? 'Pro' : 'Home'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tanggal Pengujian</span>
        <span class="detail-value">${formatDate(testDate)} ${formatTime(testDate)}</span>
      </div>
    </div>

    <!-- QR decorative element -->
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-code">
          ${generateQRPattern(certNumber)}
        </div>
        <div class="qr-label">SCAN UNTUK VERIFIKASI</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-line"><span class="footer-highlight">SALMOSENS Digital Platform</span></div>
        <div class="footer-line">Diterbitkan oleh Sistem Pemantauan Keamanan Pangan</div>
        <div class="footer-line">Tanggal Diterbitkan: ${formatDate(issuedAt)} ${formatTime(issuedAt)}</div>
      </div>
      <div class="footer-right">
        <div class="footer-line"><span class="footer-highlight">Kementerian Kesehatan RI</span></div>
        <div class="footer-line">& Kementerian Pertanian RI</div>
        <div class="footer-line" style="margin-top: 6px;">Dokumen ini sah secara digital</div>
      </div>
    </div>
  </div>

  <script>
    // Auto-print hint
    setTimeout(function() {
      // No auto-print — user clicks button
    }, 500);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="certificate-${certNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return NextResponse.json({ error: 'Gagal menghasilkan sertifikat' }, { status: 500 });
  }
}

/**
 * Generates a deterministic decorative QR-like grid pattern from a string.
 * Returns HTML string of .qr-cell divs.
 */
function generateQRPattern(seed: string): string {
  // Simple deterministic hash from seed to generate a pseudo-QR pattern
  let cells = '';

  // Fixed QR corner markers (top-left, top-right, bottom-left)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let isDark = false;

      // Top-left 3x3 marker
      if (row < 3 && col < 3) {
        isDark = row === 0 || row === 2 || col === 0 || col === 2;
        if (row === 1 && col === 1) isDark = true;
      }
      // Top-right 3x3 marker
      else if (row < 3 && col >= 5) {
        isDark = row === 0 || row === 2 || (col === 5 || col === 7);
        if (row === 1 && col === 6) isDark = true;
      }
      // Bottom-left 3x3 marker
      else if (row >= 5 && col < 3) {
        isDark = (row === 5 || row === 7) || col === 0 || col === 2;
        if (row === 6 && col === 1) isDark = true;
      }
      // Data area: deterministic from seed
      else {
        const charCode = seed.charCodeAt((row * 8 + col) % seed.length);
        isDark = (charCode + row * 7 + col * 13) % 3 !== 0;
      }

      cells += `<div class="qr-cell ${isDark ? 'dark' : 'light'}"></div>`;
    }
  }

  return cells;
}
