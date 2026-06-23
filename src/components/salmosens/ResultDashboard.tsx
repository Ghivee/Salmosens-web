'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Send,
  ShieldCheck,
  Share2,
  Clock,
  Award,
  QrCode,
  Sparkles,
  Flame,
  Thermometer,
  AlertOctagon,
  FileWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type TestResult = {
  id: string;
  sampleType: string;
  cfuValue: number;
  result: string;
  latitude: number;
  longitude: number;
  locationName: string;
  deviceBattery: number | null;
  variant: string;
  createdAt: string;
};

type ResultDashboardProps = {
  result: TestResult | null;
  onTestAnother: () => void;
};

const SAMPLE_LABELS: Record<string, string> = {
  AYAM: 'Daging Ayam',
  TELUR: 'Telur',
  SUSU_MENTAH: 'Susu Mentah',
  DAGING_SAPI: 'Daging Sapi',
};

/* Sparkle particles around the safe checkmark */
const SPARKLE_POSITIONS = [
  { x: -40, y: -50, delay: 0, size: 4 },
  { x: 35, y: -55, delay: 0.3, size: 3 },
  { x: -55, y: -20, delay: 0.6, size: 5 },
  { x: 50, y: -10, delay: 0.9, size: 3 },
  { x: -30, y: 40, delay: 1.2, size: 4 },
  { x: 45, y: 35, delay: 1.5, size: 3 },
  { x: 0, y: -60, delay: 0.4, size: 5 },
  { x: -50, y: 10, delay: 0.8, size: 4 },
  { x: 55, y: 15, delay: 1.1, size: 3 },
  { x: -20, y: 50, delay: 1.4, size: 4 },
  { x: 25, y: 45, delay: 0.2, size: 5 },
  { x: -60, y: -35, delay: 0.7, size: 3 },
];

export default function ResultDashboard({ result, onTestAnother }: ResultDashboardProps) {
  const { toast } = useToast();
  if (!result) return null;

  const isPositive = result.result === 'POSITIF';

  const handleDownloadCertificate = async () => {
    try {
      const res = await fetch(`/api/tests/${result.id}/certificate-pdf`);
      if (res.ok) {
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sertifikat-${result.id.slice(-6).toUpperCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Sertifikat Diunduh', description: 'Sertifikat berhasil diunduh. Buka file lalu "Print to PDF" untuk menyimpan sebagai PDF.' });
      }
    } catch {
      toast({ title: 'Gagal Mengunduh', description: 'Tidak dapat mengunduh sertifikat.', variant: 'destructive' });
    }
  };

  const handleReport = async () => {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: result.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Laporan Terkirim', description: 'Data berhasil dikirim ke dinas terkait via iSIKHNAS.', variant: 'default' });
      } else {
        toast({ title: 'Gagal Mengirim', description: data.error || 'Terjadi kesalahan. Silakan coba lagi.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Gagal Mengirim', description: 'Tidak dapat terhubung ke server. Silakan coba lagi.', variant: 'destructive' });
    }
  };

  const handleShare = () => {
    const shareText = isPositive
      ? `⚠️ BAHAYA - Terkontaminasi Salmonella di ${result.locationName} (${SAMPLE_LABELS[result.sampleType] || result.sampleType}). Segera laporkan ke dinas kesehatan. #SALMOSENS`
      : `✅ AMAN - Sampel ${SAMPLE_LABELS[result.sampleType] || result.sampleType} di ${result.locationName} dinyatakan NEGATIF Salmonella. #SALMOSENS`;

    if (navigator.share) {
      navigator.share({ title: 'Hasil Uji SALMOSENS', text: shareText }).catch(() => {
        // fallback
      });
    }
    toast({
      title: 'Hasil Dibagikan',
      description: 'Link hasil uji telah disalin ke clipboard.',
    });
  };

  const formattedTestTime = new Date(result.createdAt).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {isPositive ? (
          /* ===== DANGER RESULT ===== */
          <motion.div
            key="danger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 bg-gradient-to-b from-red-600 to-red-700 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden border-4 border-red-500/80 animate-pulse-border-red">
              {/* Blinking overlay on first appear */}
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: 6, repeatType: 'reverse' }}
                className="absolute inset-0 bg-white z-10 pointer-events-none"
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative z-20"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                  <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8 relative z-20 w-full max-w-md"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  BAHAYA!
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-red-100 mb-4">
                  TERKONTAMINASI SALMONELLA
                </h2>

                {result.variant === 'PRO' && (
                  <p className="text-red-100 text-lg mb-2">
                    Beban Bakteri: <span className="font-bold text-white">{'>'}45 CFU/mL</span>
                  </p>
                )}

                {/* Glassmorphism Info Card */}
                <Card className="glass-card mt-6 mx-auto">
                  <CardContent className="p-4 text-white">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-red-200 text-xs">Jenis Sampel</p>
                        <p className="font-medium">{SAMPLE_LABELS[result.sampleType] || result.sampleType}</p>
                      </div>
                      <div>
                        <p className="text-red-200 text-xs">Lokasi</p>
                        <p className="font-medium truncate">{result.locationName}</p>
                      </div>
                      <div>
                        <p className="text-red-200 text-xs">Waktu</p>
                        <p className="font-medium">
                          {new Date(result.createdAt).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-red-200 text-xs">Variasi</p>
                        <p className="font-medium">{result.variant}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* JANGAN DIKONSUMSI warning with shake animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="mt-6 bg-white rounded-xl px-6 py-4 inline-block"
                >
                  <p className="text-red-600 font-extrabold text-2xl md:text-3xl tracking-wide animate-shake">
                    ⛔ JANGAN DIKONSUMSI
                  </p>
                </motion.div>

                {/* Food Safety Tips Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="mt-6 mx-auto"
                >
                  <Card className="bg-white/15 backdrop-blur-md border-red-300/30 border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileWarning className="h-5 w-5 text-yellow-300" />
                        <h3 className="text-sm font-bold text-white">Langkah yang Harus Dilakukan:</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <AlertOctagon className="h-4 w-4 text-red-200 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-100">
                            <span className="font-semibold text-white">Jangan konsumsi</span> — produk terkontaminasi harus segera disingkirkan
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Thermometer className="h-4 w-4 text-orange-300 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-100">
                            <span className="font-semibold text-white">Masak hingga 75°C</span> — pastikan suhu internal mencapai standar keamanan
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Flame className="h-4 w-4 text-yellow-300 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-100">
                            <span className="font-semibold text-white">Laporkan ke dinas</span> — gunakan tombol &quot;Laporkan&quot; di bawah
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-gray-900 p-6 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-bold w-full sm:w-auto"
                onClick={handleReport}
              >
                <Send className="h-5 w-5 mr-2" />
                LAPORKAN KE DINAS SEKARANG
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan Hasil
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                onClick={onTestAnother}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Uji Sampel Lain
              </Button>
            </motion.div>

            {/* Timestamp Footer */}
            <div className="bg-gray-950 px-6 py-3 flex items-center justify-center gap-2 border-t border-gray-800">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-500">
                Diuji pada: {formattedTestTime}
              </p>
            </div>
          </motion.div>
        ) : (
          /* ===== SAFE RESULT ===== */
          <motion.div
            key="safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 bg-gradient-to-b from-emerald-500 to-emerald-600 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-10 right-10 w-40 h-40 bg-emerald-400/30 rounded-full blur-2xl" />
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-300/20 rounded-full blur-2xl" />

              {/* Animated sparkle particles around checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative z-20"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                  <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-white" />
                </div>

                {/* Sparkle particles */}
                {SPARKLE_POSITIONS.map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/80"
                    style={{
                      width: p.size,
                      height: p.size,
                      left: `calc(50% + ${p.x}px)`,
                      top: `calc(50% + ${p.y}px)`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.2, 0.8, 0],
                      y: [0, -20, -50, -80],
                    }}
                    transition={{
                      duration: 2.5,
                      delay: p.delay,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 2 + 1,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8 relative z-20 w-full max-w-md"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  NEGATIF SALMONELLA
                </h1>
                <p className="text-emerald-100 text-lg">
                  Sampel Aman untuk Dikonsumsi
                </p>

                {/* SNI 7388:2009 Compliance Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 inline-flex items-center gap-2"
                >
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-200" />
                    <span className="text-sm font-semibold text-white tracking-wide">
                      SNI 7388:2009 COMPLIANT
                    </span>
                  </div>
                </motion.div>

                {result.variant === 'PRO' && (
                  <p className="text-emerald-100 text-base mt-2">
                    Beban Bakteri: <span className="font-bold text-white">0 CFU/mL</span>
                  </p>
                )}

                {/* Glassmorphism Info Card */}
                <Card className="glass-card mt-6 mx-auto">
                  <CardContent className="p-4 text-white">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-emerald-200 text-xs">Jenis Sampel</p>
                        <p className="font-medium">{SAMPLE_LABELS[result.sampleType] || result.sampleType}</p>
                      </div>
                      <div>
                        <p className="text-emerald-200 text-xs">Lokasi</p>
                        <p className="font-medium truncate">{result.locationName}</p>
                      </div>
                      <div>
                        <p className="text-emerald-200 text-xs">Waktu</p>
                        <p className="font-medium">
                          {new Date(result.createdAt).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-200 text-xs">Variasi</p>
                        <p className="font-medium">{result.variant}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* E-Certificate Preview Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-5 mx-auto"
                >
                  <Card className="glass-card overflow-hidden">
                    <CardContent className="p-0">
                      {/* Certificate header strip */}
                      <div className="bg-emerald-700/40 px-4 py-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-200" />
                        <span className="text-xs font-bold text-white tracking-wider">E-SERTIFIKAT PREVIEW</span>
                      </div>
                      <div className="p-4 flex gap-4">
                        {/* Mini QR decorative element */}
                        <div className="shrink-0">
                          <div className="w-16 h-16 bg-white/20 rounded-lg border border-white/30 p-2">
                            <div className="qr-pattern w-full h-full rounded opacity-60" />
                          </div>
                        </div>
                        {/* Certificate key data */}
                        <div className="flex-1 min-w-0 text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <QrCode className="h-3 w-3 text-emerald-200" />
                            <span className="text-emerald-200 text-xs font-mono">SAL-{result.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <p className="text-white font-semibold text-xs">
                            Sertifikat Keamanan Pangan
                          </p>
                          <p className="text-emerald-100 text-xs mt-0.5 truncate">
                            {SAMPLE_LABELS[result.sampleType] || result.sampleType} — {result.locationName}
                          </p>
                          <p className="text-emerald-200 text-xs mt-0.5">
                            Standar: SNI 7388:2009
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-white p-6 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full sm:w-auto"
                onClick={handleDownloadCertificate}
              >
                <Download className="h-5 w-5 mr-2" />
                Unduh E-Sertifikat Aman
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan Hasil
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                onClick={onTestAnother}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Uji Sampel Lain
              </Button>
            </motion.div>

            {/* Timestamp Footer */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-center gap-2 border-t border-emerald-100">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs text-emerald-500">
                Diuji pada: {formattedTestTime}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
