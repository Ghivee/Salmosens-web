'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ShieldCheck,
  Bluetooth,
  FlaskConical,
  FileCheck2,
  MapPin,
  Clock,
  Target,
  TrendingUp,
  ArrowUp,
  Wifi,
  Cpu,
  Radio,
  BadgeCheck,
  Activity,
  ChevronRight,
  CircleDot,
  Beaker,
  AlertTriangle,
  BarChart3,
  CircleHelp,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

/* Animated counter hook using requestAnimationFrame */
function useAnimatedCounter(
  target: number,
  isInView: boolean,
  duration: number = 2000,
  decimals: number = 0
) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * target);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isInView, target, duration]);

  return displayValue;
}

/* Component that formats and renders an animated stat number */
function AnimatedStatNumber({
  target,
  suffix,
  inView,
  duration = 2000,
  decimals = 0,
  formatComma = false,
}: {
  target: number;
  suffix: string;
  inView: boolean;
  duration?: number;
  decimals?: number;
  formatComma?: boolean;
}) {
  const value = useAnimatedCounter(target, inView, duration, decimals);

  let display: string;
  if (decimals > 0) {
    display = value.toFixed(decimals);
  } else if (formatComma) {
    display = Math.round(value).toLocaleString('id-ID');
  } else {
    display = Math.round(value).toString();
  }

  return (
    <span className="animate-shimmer">
      {display}{suffix}
    </span>
  );
}

const PublicMap = dynamic(() => import('./MapView'), { ssr: false, loading: () => (
  <div className="w-full h-80 md:h-[500px] bg-gradient-to-br from-sky-100 via-sky-200/50 to-emerald-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <MapPin className="h-12 w-12 text-sky-300 mx-auto mb-2 animate-pulse" />
      <p className="text-sky-500 text-sm">Memuat peta...</p>
    </div>
  </div>
) });

type LandingPageProps = {
  onNavigate: (view: 'scan' | 'admin') => void;
  onScrollToSection: (sectionId: string) => void;
};

export default function LandingPage({ onNavigate, onScrollToSection }: LandingPageProps) {
  const [publicTests, setPublicTests] = useState<Array<{
    id: string;
    sampleType: string;
    cfuValue: number;
    result: string;
    latitude: number;
    longitude: number;
    locationName: string;
    createdAt: string;
  }>>([]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [statsData, setStatsData] = useState<{
    totalThisMonth: number;
    positiveRate: number;
    mostVulnerable: string;
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Refs for useInView
  const statsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' });
  const counterInView = useInView(counterRef, { once: true, margin: '-60px' });

  useEffect(() => {
    fetch('/api/tests?variant=HOME')
      .then((r) => r.json())
      .then(setPublicTests)
      .catch(() => {});
  }, []);

  // Fetch live stats
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => setStatsData(data))
      .catch(() => {});
  }, []);

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live clock for map info bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Shared animation variants for sections
  const sectionFadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-sky-500" />
              <span className="text-xl font-bold tracking-tight text-sky-600">
                SALMOSENS
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onScrollToSection('hero')}
                className="text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
              >
                Beranda
              </button>
              <button
                onClick={() => onScrollToSection('how-it-works')}
                className="text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
              >
                Cara Kerja
              </button>
              <button
                onClick={() => onScrollToSection('peta')}
                className="text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
              >
                Peta Edukasi
              </button>
              <button
                onClick={() => onScrollToSection('stats')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Statistik
              </button>
              <button
                onClick={() => onScrollToSection('faq')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
              >
                <CircleHelp className="h-3.5 w-3.5" />
                FAQ
              </button>
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-sky-200 transition-all duration-200"
                onClick={() => onNavigate('scan')}
              >
                Scan & Uji
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-sky-200 text-sky-600 hover:bg-sky-50 hover:scale-105 hover:shadow-md transition-all duration-200"
                onClick={() => onNavigate('admin')}
              >
                Admin
              </Button>
            </nav>
            {/* Mobile menu */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs"
                onClick={() => onNavigate('scan')}
              >
                Scan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-sky-600 text-xs"
                onClick={() => onNavigate('admin')}
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-sky-100" />
        {/* Animated dot grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, #0ea5e9 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Decorative blurs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-200/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-4 py-1.5 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Platform Resmi Ketahanan Pangan Indonesia
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-medium border border-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Powered by SNI 7388:2009
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                Ketahanan Pangan Dimulai dari Dini.{' '}
                <span className="text-sky-500">Cek Bebas Salmonella</span>{' '}
                dalam 15 Menit.
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl">
                SALMOSENS adalah perangkat deteksi Salmonella berbasis IoT yang terhubung
                langsung ke sistem monitoring nasional. Dapatkan hasil akurat dengan
                sertifikat digital dalam hitungan menit.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-sky-200/50 transition-all duration-300"
                  onClick={() => onNavigate('scan')}
                >
                  Mulai Uji Sekarang
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sky-300 text-sky-600 hover:bg-sky-50 font-semibold hover:scale-105 hover:shadow-lg hover:shadow-sky-100/50 transition-all duration-300"
                  onClick={() => onScrollToSection('peta')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Lihat Peta Risiko
                </Button>
              </div>
            </motion.div>

            {/* Right: Floating sensor device illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center items-center"
            >
              <div className="animate-float-gentle relative">
                {/* Pulse rings behind */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-2 border-sky-300/30 animate-sensor-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-52 h-52 rounded-full border border-sky-200/20 animate-sensor-pulse" style={{ animationDelay: '0.8s' }} />
                </div>

                {/* Main sensor device card */}
                <div className="relative w-64 h-72 rounded-3xl bg-gradient-to-br from-white to-sky-50 shadow-2xl shadow-sky-200/40 border border-sky-100/80 flex flex-col items-center justify-center gap-4 p-6">
                  {/* Device screen */}
                  <div className="w-44 h-20 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-300/30">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Activity className="h-4 w-4 text-sky-100" />
                        <span className="text-sky-100 text-[10px] font-semibold tracking-wider uppercase">Status</span>
                      </div>
                      <span className="text-white text-lg font-bold tracking-wide">NEGATIF</span>
                    </div>
                  </div>

                  {/* Device icon row */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Cpu className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Bluetooth className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Radio className="h-5 w-5 text-violet-600" />
                    </div>
                  </div>

                  {/* Device label */}
                  <div className="text-center mt-1">
                    <p className="text-xs font-semibold text-gray-700 tracking-wide">SALMOSENS v2.0</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">IoT Salmonella Detector</p>
                  </div>

                  {/* Connection indicator */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <Wifi className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-600">Connected</span>
                  </div>
                </div>

                {/* Floating mini badges around the device */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 px-3 py-2 flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-gray-700">SNI Certified</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-2 -left-6 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 px-3 py-2 flex items-center gap-2"
                >
                  <FlaskConical className="h-4 w-4 text-sky-500" />
                  <span className="text-[10px] font-semibold text-gray-700">99.7% Akurat</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <motion.section
        id="how-it-works"
        className="py-20 bg-gray-50 relative"
        variants={sectionFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Cara Kerja SALMOSENS
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Tiga langkah sederhana untuk memastikan keamanan pangan Anda
            </p>
          </div>

          {/* Step cards with connecting lines */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Connecting dashed lines - hidden on mobile, visible on md+ */}
            <div className="hidden md:block absolute top-1/2 left-[calc(33.33%+0.5rem)] right-[calc(33.33%+0.5rem)] -translate-y-1/2 pointer-events-none z-10">
              <div className="relative w-full h-0">
                {/* Line from card 1 to card 2 */}
                <div className="absolute left-0 top-0 w-[calc(50%-2rem)] border-t-2 border-dashed border-sky-300/60" />
                {/* Arrow indicator 1-2 */}
                <div className="absolute left-[calc(50%-2rem)] top-0 -translate-y-1/2 text-sky-300">
                  <ChevronRight className="h-5 w-5" />
                </div>
                {/* Line from card 2 to card 3 */}
                <div className="absolute left-[calc(50%+2rem)] top-0 w-[calc(50%-2rem)] border-t-2 border-dashed border-sky-300/60" />
                {/* Arrow indicator 2-3 */}
                <div className="absolute right-0 top-0 -translate-y-1/2 text-sky-300">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>

            {[
              {
                icon: Bluetooth,
                step: '01',
                title: 'Hubungkan Alat',
                description:
                  'Nyalakan perangkat SALMOSENS dan hubungkan melalui Bluetooth ke smartphone Anda. Koneksi otomatis dalam 5 detik.',
              },
              {
                icon: FlaskConical,
                step: '02',
                title: 'Pilih Sampel & Mulai Analisis',
                description:
                  'Pilih jenis sampel (ayam, telur, susu, daging sapi), masukkan ke sensor, dan tekan mulai. Analisis berjalan otomatis.',
              },
              {
                icon: FileCheck2,
                step: '03',
                title: 'Hasil Instan + Sertifikat Digital',
                description:
                  'Dapatkan hasil dalam 15 menit dengan akurasi 99.7%. Unduh e-sertifikat langsung dari aplikasi.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="border-white/60 bg-white/70 backdrop-blur-sm hover:border-sky-300/60 hover:shadow-xl hover:shadow-sky-100/30 hover:-translate-y-0.5 transition-all duration-300 h-full relative overflow-hidden">
                  {/* Subtle glassmorphism shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-sky-50/30 pointer-events-none" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-500 shadow-sm">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-sky-300 to-sky-400 bg-clip-text text-transparent select-none">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        ref={counterRef}
        className="py-20 bg-white"
        variants={sectionFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                value: '15 Menit',
                label: 'Waktu Deteksi',
                description: 'Hasil cepat tanpa menunggu lab',
                animatedValue: 15,
                suffix: ' Menit',
                decimals: 0,
                formatComma: false,
                duration: 1500,
              },
              {
                icon: Target,
                value: '99.7%',
                label: 'Akurasi',
                description: 'Sensitivitas tinggi setara metode laboratorium',
                animatedValue: 99.7,
                suffix: '%',
                decimals: 1,
                formatComma: false,
                duration: 2000,
              },
              {
                icon: TrendingUp,
                value: '10,000+',
                label: 'Titik Pengujian',
                description: 'Tersebar di seluruh Indonesia',
                animatedValue: 10000,
                suffix: '+',
                decimals: 0,
                formatComma: true,
                duration: 2500,
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-sky-50 to-white border border-sky-100 hover:shadow-lg hover:shadow-sky-100/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-100 text-sky-500 mb-4">
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <AnimatedStatNumber
                    target={stat.animatedValue}
                    suffix={stat.suffix}
                    inView={counterInView}
                    duration={stat.duration}
                    decimals={stat.decimals}
                    formatComma={stat.formatComma}
                  />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Wave separator between stats and map */}
      <div className="relative -mt-1 mb-[-1px]">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 md:h-20 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
            fill="#f9fafb"
          />
        </svg>
      </div>

      {/* Public Map Section */}
      <motion.section
        id="peta"
        className="py-20 bg-gray-50"
        variants={sectionFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Peta Risiko Salmonella Indonesia
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Pantau sebaran kasus Salmonella secara real-time di seluruh Indonesia
            </p>
          </div>

          {/* Info bar above map */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-gray-600">Live data</span>
              <span className="text-gray-300">•</span>
              <span>Last updated: {currentTime || '--:--:--'}</span>
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">
              {publicTests.length} titik pengujian ditampilkan
            </span>
          </div>

          <Card className="overflow-hidden border-sky-100 shadow-lg shadow-sky-100/20">
            <CardContent className="p-0">
              <div className="relative h-80 md:h-[500px]">
                <PublicMap tests={publicTests} zoom={5} showPublicView={true} />
              </div>
            </CardContent>
          </Card>

          {/* Legend bar below map */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
              <span className="text-sm text-gray-600">Aman (Negatif)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></span>
              <span className="text-sm text-gray-600">Positif Salmonella</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-200"></span>
              <span className="text-sm text-gray-600">Perlu Verifikasi</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Statistik Nasional Section */}
      <section
        id="stats"
        ref={statsRef}
        className="py-20 bg-gradient-to-b from-gray-50 to-white relative"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <BarChart3 className="h-4 w-4" />
              Data Real-Time
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Statistik Nasional
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Data pengujian Salmonella terkini dari seluruh Indonesia
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Beaker,
                iconBg: 'bg-sky-100',
                iconColor: 'text-sky-500',
                label: 'Total Pengujian Bulan Ini',
                value: statsData ? statsData.totalThisMonth.toLocaleString('id-ID') : '—',
                sublabel: 'pengujian selesai',
              },
              {
                icon: TrendingUp,
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-500',
                label: 'Tingkat Positif',
                value: statsData ? `${statsData.positiveRate}%` : '—',
                sublabel: 'terdeteksi Salmonella',
              },
              {
                icon: AlertTriangle,
                iconBg: 'bg-red-100',
                iconColor: 'text-red-500',
                label: 'Komoditas Paling Rentan',
                value: statsData?.mostVulnerable || '—',
                sublabel: 'perlu perhatian khusus',
              },
              {
                icon: Clock,
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-500',
                label: 'Waktu Rata-rata Analisis',
                value: '15 menit',
                sublabel: 'jauh lebih cepat dari lab',
              },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 25 }}
                animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
              >
                <div className="relative group rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-white/60 backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-sky-100/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  {/* Glassmorphism shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-sky-50/20 pointer-events-none group-hover:from-white/90 transition-all duration-500" />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} mb-4 shadow-sm`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 animate-shimmer mb-0.5">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-400">{card.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        ref={faqRef}
        className="py-20 bg-gray-50 relative"
      >
        <div className="absolute top-10 left-10 w-72 h-72 bg-sky-100/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <CircleHelp className="h-4 w-4" />
              Bantuan
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Pertanyaan Umum (FAQ)
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Temukan jawaban untuk pertanyaan yang sering diajukan
            </p>
          </motion.div>

          <div className="space-y-3">
            {[
              {
                q: 'Apa itu SALMOSENS?',
                a: 'SALMOSENS adalah platform deteksi Salmonella cepat dan akurat menggunakan biosensor berbasis Bluetooth Low Energy (BLE). Hasil dapat diketahui dalam 15 menit, jauh lebih cepat dibanding metode konvensional yang membutuhkan 3-5 hari.',
              },
              {
                q: 'Bagaimana cara kerja biosensor?',
                a: 'Biosensor SALMOSENS menggunakan teknologi imunosensor elektrokimia yang mendeteksi antigen Salmonella spp. secara spesifik. Sampel makanan ditempatkan pada cartridge disposable, dan hasil dibaca secara digital melalui koneksi Bluetooth ke smartphone.',
              },
              {
                q: 'Apakah hasilnya diakui secara resmi?',
                a: 'Ya, SALMOSENS mengacu pada standar SNI 7388:2009 tentang Batas Maksimum Cemaran Mikroba dalam Pangan. Setiap hasil uji dilengkapi dengan e-sertifikat digital yang dapat digunakan untuk pelaporan ke iSIKHNAS (Sistem Informasi Kesehatan Hewan).',
              },
              {
                q: 'Jenis sampel apa saja yang bisa diuji?',
                a: 'Saat ini SALMOSENS mendukung pengujian untuk 4 jenis komoditas pangan: Daging Ayam, Telur (ayam/itik), Susu Mentah (tanpa pasteurisasi), dan Daging Sapi. Keempat komoditas ini merupakan sumber utama Salmonella di Indonesia.',
              },
              {
                q: 'Bagaimana jika hasilnya POSITIF?',
                a: 'Jika terdeteksi Salmonella (POSITIF), platform akan otomatis mengirimkan peringatan dan Anda dapat langsung melaporkan ke dinas kesehatan terkait melalui integrasi iSIKHNAS. JANGAN mengkonsumsi produk yang terdeteksi positif. Segera masak hingga suhu internal 75°C atau singkirkan produk tersebut.',
              },
            ].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className={`w-full text-left rounded-xl border backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg hover:shadow-sky-100/20 ${
                      isOpen
                        ? 'bg-white border-sky-200 shadow-md shadow-sky-100/20 border-l-4 border-l-sky-300'
                        : 'bg-white/70 border-gray-200 border-l-4 border-l-transparent hover:border-l-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-semibold transition-colors duration-200 ${isOpen ? 'text-sky-600' : 'text-gray-900'}`}>
                        {item.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className={`h-5 w-5 transition-colors duration-200 ${isOpen ? 'text-sky-500' : 'text-gray-400'}`} />
                      </motion.span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? 'auto' : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-gray-500 leading-relaxed text-sm pr-8">
                        {item.a}
                      </p>
                    </motion.div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-auto">
        {/* Gradient top border */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-500" />

        <div className="bg-gray-900 text-gray-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Top row: branding + SNI badge */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-8 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-sky-400" />
                <span className="text-xl font-bold text-white tracking-tight">SALMOSENS</span>
              </div>
              {/* SNI Compliance Badge */}
              <div className="flex items-center gap-2.5 bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Memenuhi Standar</p>
                  <p className="text-[10px] text-gray-400">SNI 7388:2009 — Batas Maksimum Cemaran Mikroba dalam Pangan</p>
                </div>
              </div>
            </div>

            {/* 3-column footer content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
              {/* Tentang SALMOSENS */}
              <div>
                <h4 className="text-white font-semibold mb-3">Tentang SALMOSENS</h4>
                <p className="text-sm leading-relaxed">
                  Platform deteksi Salmonella cepat berbasis biosensor IoT untuk ketahanan pangan Indonesia.
                  Terintegrasi dengan sistem monitoring nasional iSIKHNAS.
                </p>
              </div>

              {/* Fitur Utama */}
              <div>
                <h4 className="text-white font-semibold mb-3">Fitur Utama</h4>
                <ul className="space-y-2.5 text-sm">
                  {[
                    'Deteksi 15 Menit',
                    'Sertifikat Digital',
                    'Peta Risiko',
                    'Pelaporan Otomatis',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kontak & Dukungan */}
              <div>
                <h4 className="text-white font-semibold mb-3">Kontak & Dukungan</h4>
                <div className="space-y-2.5 text-sm">
                  <p>📧 info@salmosens.go.id</p>
                  <p>📞 (021) 150-567</p>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1 text-xs font-medium text-sky-400 border border-gray-700/50">
                    <Cpu className="h-3 w-3" />
                    Versi 2.1
                  </span>
                </div>
              </div>
            </div>

            {/* Integration badges section */}
            <div className="border-t border-gray-800 pt-8 mb-8">
              <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-wider font-medium">
                Platform ini terintegrasi dengan
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {[
                  { label: 'iSIKHNAS', sublabel: 'Sistem Informasi Kesehatan Hewan Nasional' },
                  { label: 'BPOM RI', sublabel: 'Badan Pengawas Obat dan Makanan' },
                  { label: 'Kemenkes', sublabel: 'Kementerian Kesehatan RI' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-700/40 hover:border-gray-600/60 transition-colors"
                  >
                    <CircleDot className="h-4 w-4 text-sky-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{item.label}</p>
                      <p className="text-[10px] text-gray-500 hidden sm:block">{item.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-800 pt-6 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} SALMOSENS - Platform Ketahanan Pangan Indonesia. Hak Cipta Dilindungi.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-300/40 flex items-center justify-center hover:bg-sky-600 hover:scale-110 hover:shadow-xl hover:shadow-sky-300/50 transition-all duration-300 animate-fade-in-up"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}