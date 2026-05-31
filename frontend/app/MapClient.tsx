// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type AccessPoint = {
  name: string;
  type: "ATM" | "Bank";
  area: string;
  lat: number;
  lng: number;
};

type Props = {
  points: AccessPoint[];
  areaA: string;
  areaB: string;
  compared: boolean;
  areaAScore: number;
  areaBScore: number;
  showATM: boolean;
  showBank: boolean;
  showUnderserved: boolean;
  showDemographic: boolean;
  showHeatMap?: boolean;
  areaProfiles: Record<string, any>;
  onMarkerClick?: (point: AccessPoint) => void;
};

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [37.5, 98.5],
];

function isValidCoordinate(lat: any, lng: any) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return !isNaN(latitude) && !isNaN(longitude) && lat !== null && lng !== null;
}

function getCenter(points: AccessPoint[]) {
  const validPoints = points.filter(p => isValidCoordinate(p.lat, p.lng));
  if (!validPoints.length) return null;

  return {
    lat: validPoints.reduce((sum, p) => sum + Number(p.lat), 0) / validPoints.length,
    lng: validPoints.reduce((sum, p) => sum + Number(p.lng), 0) / validPoints.length,
  };
}

function FitMap({ points, areaA, areaB }: { points: AccessPoint[]; areaA: string; areaB: string }) {
  const map = useMap();
  const prevAreasRef = useRef<string>("");

  useEffect(() => {
    map.setMaxBounds(INDIA_BOUNDS);
    const areaKey = `${areaA}-${areaB}`;

    // Only snap the bounds when the selected comparison areas actually change!
    if (prevAreasRef.current !== areaKey) {
      prevAreasRef.current = areaKey;
      
      const targetPoints = points.filter((p) => (p.area === areaA || p.area === areaB) && isValidCoordinate(p.lat, p.lng));
      if (targetPoints.length >= 2) {
        const bounds = targetPoints.map((p) => [Number(p.lat), Number(p.lng)]) as [number, number][];
        map.fitBounds(bounds, {
          paddingTopLeft: [90, 180],
          paddingBottomRight: [90, 90],
          maxZoom: 7,
        });
      } else {
        map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
      }
    }
  }, [map, areaA, areaB, points]);

  return null;
}

function displayPosition(point: AccessPoint, index: number): [number, number] {
  const angle = (index % 12) * 30 * (Math.PI / 180);
  const offset = point.type === "Bank" ? 0.012 : 0.009;
  const latVal = Number(point.lat);
  const lngVal = Number(point.lng);

  return [
    latVal + Math.sin(angle) * offset,
    lngVal + Math.cos(angle) * offset,
  ];
}

export default function MapClient({
  points = [],
  areaA,
  areaB,
  compared,
  areaAScore,
  areaBScore,
  showATM,
  showBank,
  showUnderserved,
  showDemographic,
  showHeatMap = false,
  areaProfiles,
  onMarkerClick,
}: Props) {
  const filteredByType = points.filter((point) => {
    if (point.type === "ATM" && !showATM) return false;
    if (point.type === "Bank" && !showBank) return false;
    return isValidCoordinate(point.lat, point.lng);
  });

  const visiblePoints = compared
    ? filteredByType.filter((p) => p.area === areaA || p.area === areaB)
    : filteredByType;

  const areaAPoints = points.filter((p) => p.area === areaA);
  const areaBPoints = points.filter((p) => p.area === areaB);

  const centerA = getCenter(areaAPoints);
  const centerB = getCenter(areaBPoints);

  const isEqual = areaAScore === areaBScore;

  const weakerCenter = areaAScore <= areaBScore ? centerA : centerB;
  const strongerCenter = areaAScore > areaBScore ? centerA : centerB;

  const weakerArea = areaAScore <= areaBScore ? areaA : areaB;
  const weakerScore = Math.min(areaAScore, areaBScore);
  const strongerScore = Math.max(areaAScore, areaBScore);

  const weakRadius =
    weakerScore < 35 ? 70000 : weakerScore < 70 ? 54000 : 38000;

  const strongRadius =
    strongerScore < 35 ? 42000 : strongerScore < 70 ? 36000 : 30000;

  const demographicProfile = areaProfiles?.[weakerArea];

  return (
    <div className="relative h-full w-full bg-[#040508]">
      <div className="absolute bottom-5 left-5 z-[999] rounded-xl border border-emerald-400/25 bg-[#0c110e]/90 px-4 py-3 text-xs text-slate-300 shadow-glow pointer-events-none">
        <div className="mb-2 font-bold text-emerald-300">Map Legend</div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#00ff87] shadow-[0_0_8px_#00ff87]"></span>
          ATM
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
          Bank
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-red-400"></span>
          Underserved Zone
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-amber-400"></span>
          Demographic Pressure
        </div>

        {showHeatMap && (
          <div className="mt-1 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-[#ef4444]/60 to-[#f59e0b]/60"></span>
            Access Density Heat Map
          </div>
        )}
      </div>

      <MapContainer
        key={`${areaA}-${areaB}-${points.length}`}
        center={[22.5, 79.0]}
        zoom={5}
        minZoom={4}
        maxZoom={13}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        attributionControl={false}
        className="h-full w-full bg-[#040508]"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitMap points={visiblePoints.length ? visiblePoints : points} areaA={areaA} areaB={areaB} />

        {centerA && centerB && (
          <Polyline
            positions={[
              [centerA.lat, centerA.lng],
              [centerB.lat, centerB.lng],
            ]}
            pathOptions={{
              color: "#94a3b8",
              weight: 1,
              opacity: 0.45,
              dashArray: "5 10",
            }}
          />
        )}

        {isEqual && centerA && (
          <Circle
            center={[centerA.lat, centerA.lng]}
            radius={strongRadius}
            pathOptions={{
              color: "#00ff87",
              fillColor: "#00ff87",
              fillOpacity: 0.08,
              weight: 3,
              dashArray: "6 8",
            }}
          />
        )}

        {isEqual && centerB && (
          <Circle
            center={[centerB.lat, centerB.lng]}
            radius={strongRadius}
            pathOptions={{
              color: "#00ff87",
              fillColor: "#00ff87",
              fillOpacity: 0.08,
              weight: 3,
              dashArray: "6 8",
            }}
          />
        )}

        {!isEqual && strongerCenter && (
          <Circle
            center={[strongerCenter.lat, strongerCenter.lng]}
            radius={strongRadius}
            pathOptions={{
              color: "#00ff87",
              fillColor: "#00ff87",
              fillOpacity: 0.08,
              weight: 3,
              dashArray: "6 8",
            }}
          />
        )}

        {showUnderserved && !isEqual && weakerCenter && (
          <>
            <Circle
              center={[weakerCenter.lat, weakerCenter.lng]}
              radius={weakRadius}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.14,
                weight: 4,
                dashArray: "10 8",
                className: "pulse-circle",
              }}
            />

            <Circle
              center={[weakerCenter.lat, weakerCenter.lng]}
              radius={weakRadius / 2.5}
              pathOptions={{
                color: "#fb7185",
                fillColor: "#ef4444",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </>
        )}

        {showDemographic && !isEqual && weakerCenter && demographicProfile && (
          <Circle
            center={[weakerCenter.lat, weakerCenter.lng]}
            radius={weakRadius * 1.25}
            pathOptions={{
              color: "#f59e0b",
              fillColor: "#f59e0b",
              fillOpacity: 0.045,
              weight: 2,
              dashArray: "3 10",
            }}
          />
        )}

        {/* Access Density Heat Map Nodes */}
        {showHeatMap &&
          visiblePoints.map((point, index) => (
            <CircleMarker
              key={`heatmap-${point.name}`}
              center={[point.lat, point.lng]}
              radius={35}
              pathOptions={{
                stroke: false,
                fillColor: point.type === "ATM" ? "#ef4444" : "#f59e0b",
                fillOpacity: 0.14,
              }}
            />
          ))}

        {visiblePoints.map((point, index) => {
          const isATM = point.type === "ATM";
          const position = displayPosition(point, index);

          return (
            <CircleMarker
              key={point.name}
              center={position}
              radius={isATM ? 7 : 10}
              pathOptions={{
                color: isATM ? "#00ff87" : "#10b981",
                fillColor: isATM ? "#00ff87" : "#10b981",
                fillOpacity: 0.95,
                weight: 2,
                className: isATM ? "atm-marker animate-pulse" : "bank-marker",
              }}
              eventHandlers={{
                click: (e) => {
                  const leafletMap = e.target._map;
                  if (leafletMap) {
                    leafletMap.setView(position, 10, { animate: true });
                  }
                  onMarkerClick?.(point);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                {point.name} • {point.type} • {point.area}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}