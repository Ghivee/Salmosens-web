'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bluetooth, BluetoothConnected, MapPin, Smartphone, Battery, Loader2,
  Egg, Milk, Beef, Drumstick, Wifi, Signal, RefreshCw, Check, ChevronRight,
  FlaskConical, Clock, History, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SIMULATED_LOCATIONS = [
  { name: 'Pasar Senen, Jakarta Pusat', lat: -6.1775, lng: 106.8375 },
  { name: 'Pasar Induk Kramat Jati, Jakarta Timur', lat: -6.2606, lng: 106.8589 },
  { name: 'Pasar Rawa Belong, Jakarta Barat', lat: -6.1862, lng: 106.7903 },
  { name: 'Pasar Cihampelas, Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Pasar Beringharjo, Yogyakarta', lat: -7.7928, lng: 110.3658 },
  { name: 'Pasar Senggol, Denpasar', lat: -8.6500, lng: 115.2167 },
  { name: 'Pasar Rakyat, Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Pasar Sentral, Makassar', lat: -5.1477, lng: 119.4327 },
];

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

type ScanSyncPanelProps = {
  onTestComplete: (result: TestResult) => void;
};

const SAMPLE_OPTIONS = [
  {
    value: 'AYAM',
    label: 'Daging Ayam',
    description: 'Potongan daging ayam segar atau beku',
    icon: Drumstick,
    color: 'amber',
    bgClass: 'bg-amber-50 border-amber-200',
    activeBgClass: 'bg-amber-100 border-amber-400',
    iconColor: 'text-amber-600',
    activeIconBg: 'bg-amber-500',
  },
  {
    value: 'TELUR',
    label: 'Telur',
    description: 'Telur ayam atau telur itik',
    icon: Egg,
    color: 'orange',
    bgClass: 'bg-orange-50 border-orange-200',
    activeBgClass: 'bg-orange-100 border-orange-400',
    iconColor: 'text-orange-600',
    activeIconBg: 'bg-orange-500',
  },
  {
    value: 'SUSU_MENTAH',
    label: 'Susu Mentah',
    description: 'Susu segar tanpa pasteurisasi',
    icon: Milk,
    color: 'sky',
    bgClass: 'bg-sky-50 border-sky-200',
    activeBgClass: 'bg-sky-100 border-sky-400',
    iconColor: 'text-sky-600',
    activeIconBg: 'bg-sky-500',
  },
  {
    value: 'DAGING_SAPI',
    label: 'Daging Sapi',
    description: 'Potongan daging sapi segar',
    icon: Beef,
    color: 'red',
    bgClass: 'bg-red-50 border-red-200',
    activeBgClass: 'bg-red-100 border-red-400',
    iconColor: 'text-red-600',
    activeIconBg: 'bg-red-500',
  },
] as const;

export default function ScanSyncPanel({ onTestComplete }: ScanSyncPanelProps) {
  const [bleConnected, setBleConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sampleType, setSampleType] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recentTests, setRecentTests] = useState<Array<{
    id: string; sampleType: string; result: string; locationName: string; createdAt: string;
  }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [location] = useState(
    SIMULATED_LOCATIONS[Math.floor(Math.random() * SIMULATED_LOCATIONS.length)]
  );
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived step state
  const currentStep = analyzing ? 3 : sampleType ? 2 : bleConnected ? 1 : 0;

  const handleConnectBLE = useCallback(() => {
    setConnecting(true);
    setTimeout(() => {
      setBleConnected(true);
      setConnecting(false);
    }, 2000);
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!sampleType) return;
    setAnalyzing(true);
    setCountdown(3);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (countdownRef.current) clearInterval(countdownRef.current);

    const isPositive = Math.random() < 0.3;
    const cfuValue = isPositive ? Math.floor(Math.random() * 80) + 10 : 0;

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleType,
          latitude: location.lat,
          longitude: location.lng,
          locationName: location.name,
          deviceBattery: 80,
          variant: 'HOME',
          cfuValue,
        }),
      });
      const result: TestResult = await res.json();
      onTestComplete(result);
    } catch {
      onTestComplete({
        id: 'demo-' + Date.now(),
        sampleType,
        cfuValue,
        result: cfuValue > 0 ? 'POSITIF' : 'NEGATIF',
        latitude: location.lat,
        longitude: location.lng,
        locationName: location.name,
        deviceBattery: 80,
        variant: 'HOME',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setAnalyzing(false);
      setCountdown(3);
    }
  }, [sampleType, location, onTestComplete]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Fetch recent test history
  useEffect(() => {
    fetch('/api/tests?variant=HOME')
      .then((r) => r.json())
      .then((data) => setRecentTests(data.slice(0, 10)))
      .catch(() => {});
  }, []);

  const selectedOption = SAMPLE_OPTIONS.find((s) => s.value === sampleType);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-sky-50/80 via-white to-gray-50 -z-10" />
      <div
        className="fixed inset-0 opacity-[0.15] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #0ea5e9 0.8px, transparent 0.8px)',
          backgroundSize: '28px 28px',
        }}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* ===== STEP PROGRESS INDICATOR ===== */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1">
          {[
            { num: 1, label: 'Hubungkan' },
            { num: 2, label: 'Sampel' },
            { num: 3, label: 'Analisis' },
          ].map((step, i) => {
            const isActive = currentStep >= step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{
                      scale: isCurrent ? [1, 1.15, 1] : 1,
                      backgroundColor: isActive ? '#0ea5e9' : '#f3f4f6',
                    }}
                    transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-200/50'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isActive && step.num < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.num
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-300 ${
                      isActive ? 'text-sky-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="flex-1 mx-3 mt-[-16px]">
                    <div className="h-0.5 rounded-full bg-gray-200 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: currentStep > step.num ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-sky-400 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== STEP 1: BLE CONNECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={`border transition-all duration-300 ${bleConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-sky-100 bg-white/80 backdrop-blur-sm'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {connecting ? (
                      <motion.div
                        key="connecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100"
                      >
                        <Loader2 className="h-7 w-7 text-gray-400 animate-spin" />
                      </motion.div>
                    ) : bleConnected ? (
                      <motion.div
                        key="connected"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100"
                      >
                        <BluetoothConnected className="h-7 w-7 text-sky-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="disconnected"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100"
                      >
                        {/* Radar pulse rings */}
                        {!connecting && !bleConnected && (
                          <>
                            <div className="absolute w-20 h-20 rounded-full border-2 border-sky-300/20 animate-radar-ping" />
                            <div className="absolute w-28 h-28 rounded-full border border-sky-200/10 animate-radar-ping" style={{ animationDelay: '0.6s' }} />
                          </>
                        )}
                        <Bluetooth className="h-7 w-7 text-gray-400 animate-ble-search" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 min-w-0">
                  {connecting ? (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Menghubungkan...</p>
                      <p className="text-xs text-gray-400 mt-0.5">Mencari SALMOSENS Bio-Sensor v2</p>
                    </div>
                  ) : bleConnected ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-emerald-700">Perangkat Terhubung</p>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Battery className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs text-gray-500">80%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Signal className="h-3.5 w-3.5 text-sky-500" />
                          <span className="text-xs text-gray-500">Kuat</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 font-mono">SN-0847</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-600">SALMOSENS Bio-Sensor v2</p>
                      <p className="text-xs text-gray-400 mt-0.5">Nyalakan dan pastikan Bluetooth aktif</p>
                    </div>
                  )}
                </div>
                {!bleConnected && !connecting && (
                  <Button
                    size="sm"
                    className="bg-sky-500 hover:bg-sky-600 text-white shrink-0 shadow-md shadow-sky-200/40 hover:shadow-lg hover:shadow-sky-200/50 transition-all duration-200"
                    onClick={handleConnectBLE}
                  >
                    Hubungkan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== STEP 2: SAMPLE TYPE SELECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-sky-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Pilih Jenis Sampel
                </label>
                {selectedOption && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full"
                  >
                    Dipilih
                  </motion.span>
                )}
              </div>

              {/* Visual sample type cards in 2x2 grid */}
              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_OPTIONS.map((opt) => {
                  const isSelected = sampleType === opt.value;
                  const IconComp = opt.icon;
                  return (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSampleType(opt.value)}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? `${opt.activeBgClass} shadow-md`
                          : `${opt.bgClass} hover:shadow-sm`
                      }`}
                    >
                      {/* Checkmark overlay */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                        isSelected ? opt.activeIconBg : 'bg-white/60'
                      }`}>
                        <IconComp className={`h-5 w-5 ${isSelected ? 'text-white' : opt.iconColor}`} />
                      </div>
                      <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== GPS LOCATION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-sky-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Lokasi GPS
                </label>
                <button className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 transition-colors">
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-700 truncate">
                    {location.name}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  <Wifi className="h-3 w-3 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-700">GPS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== DEVICE INFO ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Variasi', value: 'HOME' },
              { label: 'Firmware', value: 'v2.1.2' },
              { label: 'Sensor', value: 'Bio-v3' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== ANALYSIS ACTION BUTTON ===== */}
        <div className="flex justify-center pt-4 pb-8">
          <div className="relative">
            {/* Pulse ring when ready */}
            {!analyzing && bleConnected && sampleType && (
              <div className="absolute inset-0 rounded-full bg-sky-400/60 animate-pulse-ring pointer-events-none" />
            )}

            {/* Circular progress ring during analysis */}
            {analyzing && (
              <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 3, ease: 'linear' }}
                />
              </svg>
            )}

            <motion.div whileTap={analyzing ? {} : { scale: 0.95 }}>
              <Button
                size="lg"
                disabled={!bleConnected || !sampleType || analyzing}
                className={`h-20 w-72 rounded-full text-lg font-bold shadow-lg transition-all duration-300 ${
                  analyzing
                    ? 'bg-sky-500 text-white cursor-wait shadow-sky-300/40'
                    : bleConnected && sampleType
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-sky-200/60 hover:shadow-xl hover:shadow-sky-300/50'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleStartAnalysis}
              >
                {analyzing ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Menganalisis...</span>
                    </div>
                    <span className="text-2xl font-bold tabular-nums">{countdown}s</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5" />
                    MULAI ANALISIS
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ===== RECENT TEST HISTORY (collapsible) ===== */}
      {recentTests.length > 0 && (
        <div className="max-w-lg mx-auto w-full px-4 pb-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-200 hover:border-sky-200 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <History className="h-4 w-4 text-sky-500" />
              Riwayat Pengujian Terakhir ({recentTests.length})
            </span>
            {showHistory ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {recentTests.map((t) => {
                    const isPos = t.result === 'POSITIF';
                    const timeStr = new Date(t.createdAt).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    });
                    const label = SAMPLE_OPTIONS.find((s) => s.value === t.sampleType)?.label || t.sampleType;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 hover:shadow-sm transition-shadow"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isPos ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isPos ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {t.result}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">{t.locationName}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px]">{timeStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}