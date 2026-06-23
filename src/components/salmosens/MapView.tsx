'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type TestResult = {
  id: string;
  sampleType: string;
  cfuValue: number;
  result: string;
  latitude: number;
  longitude: number;
  locationName: string;
  createdAt: string;
};

type MapViewProps = {
  tests: TestResult[];
  zoom?: number;
  showPublicView?: boolean;
  filter?: string;
  onFilterChange?: (filter: string) => void;
};

export default function MapView({
  tests,
  zoom = 5,
  showPublicView = false,
  filter,
  onFilterChange,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-2.5, 118],
      zoom: showPublicView ? Math.min(zoom, 8) : zoom,
      maxZoom: showPublicView ? 8 : 18,
      minZoom: 2,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [zoom, showPublicView]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = filter && filter !== 'SEMUA'
      ? tests.filter((t) => t.sampleType === filter)
      : tests;

    filtered.forEach((test) => {
      const isPositive = test.result === 'POSITIF';
      const color = isPositive ? '#ef4444' : '#22c55e';
      const radius = showPublicView ? 8 : 6;

      const marker = L.circleMarker([test.latitude, test.longitude], {
        radius,
        fillColor: color,
        color: isPositive ? '#dc2626' : '#16a34a',
        weight: 2,
        opacity: isPositive ? 1 : 0.8,
        fillOpacity: isPositive ? 0.9 : 0.6,
      });

      const sampleLabels: Record<string, string> = {
        AYAM: 'Ayam',
        TELUR: 'Telur',
        SUSU_MENTAH: 'Susu Mentah',
        DAGING_SAPI: 'Daging Sapi',
      };

      const timeStr = new Date(test.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      marker.bindPopup(
        `<div style="font-size:13px;">
          <strong style="color:${color};">${test.result}</strong><br/>
          <span>${sampleLabels[test.sampleType] || test.sampleType}</span><br/>
          <span style="color:#666;">${test.locationName}</span><br/>
          <span style="color:#999;">${timeStr}</span>
          ${test.cfuValue > 0 ? `<br/><span style="color:#ef4444;font-weight:600;">CFU: ${test.cfuValue}</span>` : ''}
        </div>`
      );

      // Add glow effect for positive markers in admin view
      if (isPositive && !showPublicView) {
        const glow = L.circleMarker([test.latitude, test.longitude], {
          radius: 14,
          fillColor: '#ef4444',
          color: 'transparent',
          weight: 0,
          opacity: 0.4,
          fillOpacity: 0.2,
        });
        markersLayerRef.current!.addLayer(glow);
      }

      markersLayerRef.current!.addLayer(marker);
    });
  }, [tests, filter, showPublicView]);

  const filterButtons = [
    { value: 'SEMUA', label: 'Semua' },
    { value: 'AYAM', label: 'Daging Ayam' },
    { value: 'TELUR', label: 'Telur' },
    { value: 'SUSU_MENTAH', label: 'Susu Mentah' },
    { value: 'DAGING_SAPI', label: 'Daging Sapi' },
  ];

  return (
    <div className="relative">
      {!showPublicView && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => onFilterChange?.(btn.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === btn.value
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      <div ref={mapRef} className="w-full rounded-lg overflow-hidden" style={{ height: showPublicView ? '100%' : 'calc(100% - 44px)', minHeight: '350px' }} />
    </div>
  );
}