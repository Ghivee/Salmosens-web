'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck, Home as HomeIcon, FlaskConical, LayoutDashboard,
  Activity, Bell, Clock, X, AlertTriangle, Info, CheckCircle2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

const LandingPage = dynamic(() => import('@/components/salmosens/LandingPage'), {
  ssr: false,
});
const ScanSyncPanel = dynamic(() => import('@/components/salmosens/ScanSyncPanel'), {
  ssr: false,
});
const ResultDashboard = dynamic(() => import('@/components/salmosens/ResultDashboard'), {
  ssr: false,
});
const AdminControlRoom = dynamic(() => import('@/components/salmosens/AdminControlRoom'), {
  ssr: false,
});

type ViewType = 'landing' | 'scan' | 'result' | 'admin';
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

type AlertItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

const NAV_ITEMS: Array<{ key: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'landing', label: 'Beranda', icon: HomeIcon },
  { key: 'scan', label: 'Scan & Uji', icon: FlaskConical },
  { key: 'admin', label: 'Admin', icon: LayoutDashboard },
];

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch alert count periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/alerts/count');
        const data = await res.json();
        setAlertCount(data.count);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = useCallback(async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        const recent = data.slice(0, 5);
        setAlerts(recent);
      }
    } catch { /* silent */ }
  }, [showNotifications]);

  const navigateTo = useCallback((view: ViewType) => {
    setCurrentView(view);
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTestComplete = useCallback((result: TestResult) => {
    setTestResult(result);
    setCurrentView('result');
  }, []);

  const handleScrollToSection = useCallback((sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentView]);

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation - shown on non-landing views */}
      <AnimatePresence>
        {currentView !== 'landing' && (
          <motion.header
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`sticky top-0 z-50 border-b ${
              currentView === 'admin'
                ? 'bg-gray-900/90 backdrop-blur-md border-gray-800'
                : 'bg-white/80 backdrop-blur-md border-sky-100'
            }`}
          >
            <div className={`mx-auto px-4 flex items-center justify-between h-14 ${currentView === 'admin' ? 'max-w-[1800px]' : 'max-w-7xl'}`}>
              <button
                onClick={() => navigateTo('landing')}
                className="flex items-center gap-2 group"
              >
                <ShieldCheck className={`h-6 w-6 ${currentView === 'admin' ? 'text-sky-400' : 'text-sky-500'}`} />
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold tracking-tight ${currentView === 'admin' ? 'text-white' : 'text-sky-600'}`}>
                    SALMOSENS
                  </span>
                  {currentView === 'admin' && (
                    <span className="text-xs text-gray-500 hidden sm:inline">Control Room</span>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-2">
                {currentView === 'admin' && (
                  <div className="flex items-center gap-2 mr-1">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-medium border border-sky-500/30">
                      <Activity className="h-3 w-3" /> Live
                    </span>
                  </div>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleBellClick}
                    className={`relative p-2 rounded-lg transition-colors ${
                      currentView === 'admin'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    } ${showNotifications ? (currentView === 'admin' ? 'bg-gray-800 text-sky-400' : 'bg-sky-50 text-sky-600') : ''}`}
                    aria-label="Notifikasi"
                  >
                    <Bell className="h-5 w-5" />
                    {alertCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold"
                      >
                        {alertCount}
                      </motion.span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-xl overflow-hidden z-50 ${
                          currentView === 'admin'
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${
                          currentView === 'admin' ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                          <h3 className={`text-sm font-semibold ${currentView === 'admin' ? 'text-white' : 'text-gray-800'}`}>
                            Notifikasi
                          </h3>
                          <div className="flex items-center gap-2">
                            {alertCount > 0 && (
                              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                {alertCount} baru
                              </Badge>
                            )}
                            <button onClick={() => setShowNotifications(false)} className={`p-0.5 rounded ${currentView === 'admin' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                              <X className={`h-3.5 w-3.5 ${currentView === 'admin' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                          {alerts.length === 0 ? (
                            <div className="p-6 text-center">
                              <Bell className={`h-8 w-8 mx-auto mb-2 ${currentView === 'admin' ? 'text-gray-600' : 'text-gray-300'}`} />
                              <p className={`text-sm ${currentView === 'admin' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Tidak ada notifikasi
                              </p>
                            </div>
                          ) : (
                            alerts.map((alert) => (
                              <div
                                key={alert.id}
                                className={`px-4 py-3 border-b last:border-0 transition-colors ${
                                  currentView === 'admin'
                                    ? 'border-gray-800 hover:bg-gray-800/50'
                                    : 'border-gray-50 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                                    alert.type === 'OUTBREAK'
                                      ? 'bg-red-100 text-red-500'
                                      : alert.type === 'WARNING'
                                      ? 'bg-amber-100 text-amber-500'
                                      : 'bg-sky-100 text-sky-500'
                                  }`}>
                                    {alert.type === 'OUTBREAK' ? (
                                      <AlertTriangle className="h-4 w-4" />
                                    ) : alert.type === 'WARNING' ? (
                                      <Info className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium leading-tight ${currentView === 'admin' ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {alert.title}
                                    </p>
                                    <p className={`text-xs mt-0.5 line-clamp-2 ${currentView === 'admin' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {alert.message}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1.5">
                                      <Clock className={`h-3 w-3 ${currentView === 'admin' ? 'text-gray-600' : 'text-gray-400'}`} />
                                      <span className={`text-[10px] ${currentView === 'admin' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {new Date(alert.createdAt).toLocaleString('id-ID', {
                                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                      </span>
                                      {alert.resolved && (
                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                                          Terselesaikan
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {alertCount > 0 && (
                          <div className={`px-4 py-2.5 border-t text-center ${
                            currentView === 'admin' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50'
                          }`}>
                            <button
                              onClick={() => { navigateTo('admin'); setShowNotifications(false); }}
                              className="text-xs font-medium text-sky-500 hover:text-sky-600 transition-colors"
                            >
                              Lihat semua di Admin Control Room →
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <nav className="flex items-center gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = currentView === item.key || (item.key === 'landing' && currentView === 'result');
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigateTo(item.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? currentView === 'admin'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-sky-50 text-sky-600'
                            : currentView === 'admin'
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <LandingPage
                onNavigate={navigateTo}
                onScrollToSection={handleScrollToSection}
              />
            </motion.div>
          )}

          {currentView === 'scan' && (
            <motion.div
              key="scan"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ScanSyncPanel onTestComplete={handleTestComplete} />
            </motion.div>
          )}

          {currentView === 'result' && (
            <motion.div
              key="result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ResultDashboard
                result={testResult}
                onTestAnother={() => navigateTo('scan')}
              />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <AdminControlRoom />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}