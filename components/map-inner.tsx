'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SellDecision } from '@/lib/types';

interface MarkerDef {
  coords: [number, number];
  label: string;
  type: 'farmer' | 'depot' | 'buyer';
}

interface MapInnerProps {
  markers: MarkerDef[];
  routeGeoJSON?: SellDecision['carbonChain']['routeGeoJSON'];
  showRoute: boolean;
}

const MARKER_COLORS = {
  farmer: '#6FA577',
  depot: '#3D5A8C',
  buyer: '#E97451',
};

function createIcon(type: 'farmer' | 'depot' | 'buyer') {
  const color = MARKER_COLORS[type];
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; border: 3px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: white; font-weight: bold;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${type === 'farmer' ? 'Ç' : type === 'depot' ? 'D' : 'A'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function MapInner({ markers, routeGeoJSON, showRoute }: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [38.2, 34.5],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers (keep route layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];

    markers.forEach((m) => {
      const marker = L.marker(m.coords, { icon: createIcon(m.type) });
      marker.bindTooltip(m.label, {
        permanent: true,
        direction: 'top',
        className: 'loca-tooltip',
        offset: [0, -10],
      });
      marker.addTo(map);
      bounds.push(m.coords);
    });

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    }
  }, [markers]);

  // Update route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!showRoute || !routeGeoJSON || !routeGeoJSON.features?.length) return;

    const layer = L.geoJSON(routeGeoJSON, {
      style: {
        color: '#E97451',
        weight: 3,
        opacity: 0.8,
        dashArray: '8 12',
        className: 'route-animated',
      },
    });

    layer.addTo(map);
    routeLayerRef.current = layer;

    // Fit bounds to include route
    const routeBounds = layer.getBounds();
    if (routeBounds.isValid()) {
      map.fitBounds(routeBounds, { padding: [30, 30] });
    }
  }, [routeGeoJSON, showRoute]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
}
