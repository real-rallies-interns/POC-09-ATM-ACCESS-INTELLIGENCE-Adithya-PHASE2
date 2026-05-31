"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), { ssr: false });

type AccessPoint = {
  name: string;
  type: "ATM" | "Bank";
  area: string;
  lat: number;
  lng: number;
};

type AreaProfile = {
  state: string;
  populationPressure: number;
  travelBurden: number;
  incomeFriction: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const fallbackProfiles: Record<string, AreaProfile> = {
  Delhi: { state: "Delhi", populationPressure: 91, travelBurden: 4.8, incomeFriction: 42 },
  Patna: { state: "Bihar", populationPressure: 89, travelBurden: 8.8, incomeFriction: 64 },
};

const fallbackPoints: AccessPoint[] = [
  { name: "SBI ATM Delhi", type: "ATM", area: "Delhi", lat: 28.6315, lng: 77.2167 },
  { name: "HDFC Bank Delhi", type: "Bank", area: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "SBI ATM Patna", type: "ATM", area: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "PNB Patna", type: "Bank", area: "Patna", lat: 25.61, lng: 85.141 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distanceKm(a: AccessPoint, b: AccessPoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function Home() {
  const [points, setPoints] = useState<AccessPoint[]>(fallbackPoints);
  const [areaProfiles, setAreaProfiles] = useState<Record<string, AreaProfile>>(fallbackProfiles);
  const [dataMode, setDataMode] = useState("Fallback Data");

  const [areaA, setAreaA] = useState("Delhi");
  const [areaB, setAreaB] = useState("Patna");

  const [showATM, setShowATM] = useState(true);
  const [showBank, setShowBank] = useState(true);
  const [showUnderserved, setShowUnderserved] = useState(true);
  const [showDemographic, setShowDemographic] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(false);
  
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const areas = Object.keys(areaProfiles);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/access-points`).then((res) => res.json()),
      fetch(`${API_BASE}/area-profiles`).then((res) => res.json()),
    ])
      .then(([accessPoints, profiles]) => {
        if (Array.isArray(accessPoints) && accessPoints.length > 0) {
          setPoints(accessPoints);
        }

        if (profiles && typeof profiles === "object") {
          setAreaProfiles(profiles);

          const backendAreas = Object.keys(profiles);
          if (backendAreas.length >= 2) {
            setAreaA(backendAreas[0]);
            setAreaB(backendAreas[1]);
          }
        }

        setDataMode("FastAPI Live Synthetic Data");
      })
      .catch(() => {
        setPoints(fallbackPoints);
        setAreaProfiles(fallbackProfiles);
        setDataMode("Fallback Data");
      });
  }, []);

  const getAreaPoints = (area: string) => points.filter((p) => p.area === area);

  const calculateNearestATMDistance = (area: string) => {
    const areaPoints = getAreaPoints(area);
    const atms = areaPoints.filter((p) => p.type === "ATM");
    const banks = areaPoints.filter((p) => p.type === "Bank");
    const profile = areaProfiles[area];

    if (!profile) return 0;

    if (!atms.length || !banks.length) {
      return Number(clamp(profile.travelBurden, 3.5, 13.5).toFixed(1));
    }

    const distances = banks.map((bank) =>
      Math.min(...atms.map((atm) => distanceKm(bank, atm)))
    );

    const realDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const blendedDistance = realDistance * 0.35 + profile.travelBurden * 0.65;

    return Number(clamp(blendedDistance, 2.2, 14.5).toFixed(1));
  };

  const analyzeArea = (area: string) => {
    const areaPoints = getAreaPoints(area);
    const profile = areaProfiles[area];

    if (!profile) {
      return {
        area,
        state: "Unknown",
        atmCount: 0,
        bankCount: 0,
        totalPoints: 0,
        coverage: 0,
        accessGap: 100,
        riskLevel: "High Risk",
        classification: "Financial Desert",
        travelBurden: 0,
        proximityDistance: 0,
        populationPressure: 0,
        incomeFriction: 0,
      };
    }

    const atmCount = areaPoints.filter((p) => p.type === "ATM").length;
    const bankCount = areaPoints.filter((p) => p.type === "Bank").length;

    const infrastructureSignal = atmCount * 0.25 + bankCount * 0.45;
    const infrastructureScore = clamp(
      Math.round((1 - Math.exp(-infrastructureSignal)) * 75),
      8,
      75
    );

    const demandPenalty = profile.populationPressure * 0.25;
    const travelPenalty = profile.travelBurden * 2.6;
    const frictionPenalty = profile.incomeFriction * 0.22;

    const rawScore =
      50 + infrastructureScore - demandPenalty - travelPenalty - frictionPenalty;

    const coverage = clamp(Math.round(rawScore), 20, 92);
    const accessGap = 100 - coverage;

    const riskLevel =
      coverage < 35 ? "High Risk" : coverage < 70 ? "Moderate Risk" : "Low Risk";

    const classification =
      coverage < 35 ? "Financial Desert" : coverage < 70 ? "Underserved" : "Stable Access";

    return {
      area,
      state: profile.state,
      atmCount,
      bankCount,
      totalPoints: areaPoints.length,
      coverage,
      accessGap,
      riskLevel,
      classification,
      travelBurden: profile.travelBurden,
      proximityDistance: calculateNearestATMDistance(area),
      populationPressure: profile.populationPressure,
      incomeFriction: profile.incomeFriction,
    };
  };

  const areaAReport = useMemo(() => analyzeArea(areaA), [areaA, points, areaProfiles]);
  const areaBReport = useMemo(() => analyzeArea(areaB), [areaB, points, areaProfiles]);

  const isEqual = areaAReport.coverage === areaBReport.coverage;

  const weakerArea = isEqual
    ? areaAReport
    : areaAReport.coverage < areaBReport.coverage
      ? areaAReport
      : areaBReport;

  const strongerArea = isEqual
    ? areaAReport
    : areaAReport.coverage > areaBReport.coverage
      ? areaAReport
      : areaBReport;

  const priorityLabel = isEqual ? "Balanced Access" : weakerArea.area;
  const coverageDifference = Math.abs(areaAReport.coverage - areaBReport.coverage);

  const recommendedAction =
    isEqual
      ? "Both areas show balanced access. Continue monitoring ATM reliability and demand growth."
      : weakerArea.coverage < 35
        ? `Urgently expand ATM access and banking correspondent coverage in ${weakerArea.area}.`
        : weakerArea.coverage < 70
          ? `Improve cash access density in ${weakerArea.area} through targeted ATM placement.`
          : `Maintain monitoring in ${weakerArea.area}; access is currently acceptable.`;

  const downloadSampleData = () => {
    const sampleData = {
      project: "Cash Access Intelligence Platform",
      data_label: "synthetic_mock_data",
      generated_from: dataMode,
      exported_at: new Date().toISOString(),
      selected_comparison: {
        areaA,
        areaB,
        intervention_priority: priorityLabel,
      },
      area_reports: {
        [areaA]: areaAReport,
        [areaB]: areaBReport,
      },
      total_access_points_loaded: points.length,
      sample_access_points: points.slice(0, 25),
      note: "This export contains synthetic sample data for academic PoC and dashboard demonstration only.",
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cash_access_sample_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="h-screen w-screen bg-[#040508] text-white relative overflow-hidden font-sans">
      
      {/* Immersive 100% Full-Screen Visualization Container */}
      <section className="h-full w-full flex flex-col">
        
        {/* Transparent Floating Control Header Banner */}
        <div className="absolute left-6 right-6 top-5 z-[999] p-4 lg:p-0 shrink-0">
          <div className="rounded-2xl border border-emerald-400/20 bg-[#0c110e]/95 p-4 shadow-glow backdrop-blur-md">
            <div className="flex flex-wrap items-end gap-4 justify-between">
              
              <div>
                <p className="text-[10px] font-bold tracking-[0.28em] text-[#00ff87] uppercase">
                  INFOCREON • ACCESS INTELLIGENCE PROTOCOL
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  Infocreon Cash Access Intelligence Platform
                </h1>
                <p className="text-xs text-slate-400">
                  Live Enterprise Infrastructure Model • <span className="text-[#00ff87] font-medium">L2 Status Verification Active</span> • {points.length} Network Nodes
                </p>
              </div>

              {/* Area Compare Controls & Info Button */}
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Area A
                    <select
                      value={areaA}
                      onChange={(e) => setAreaA(e.target.value)}
                      className="mt-1 block w-40 rounded-xl border border-emerald-400/10 bg-[#040508] p-2 text-xs font-semibold text-white focus:border-[#00ff87]/40 focus:outline-none transition cursor-pointer"
                    >
                      {areas.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Compare With
                    <select
                      value={areaB}
                      onChange={(e) => setAreaB(e.target.value)}
                      className="mt-1 block w-40 rounded-xl border border-emerald-400/10 bg-[#040508] p-2 text-xs font-semibold text-white focus:border-[#00ff87]/40 focus:outline-none transition cursor-pointer"
                    >
                      {areas.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Sleek (i) Info Icon - Developer Signature Trigger */}
                <button
                  onClick={() => setShowMetadataModal(true)}
                  title="Developer Signature Metadata"
                  className="mt-4 p-2.5 rounded-xl border border-emerald-400/20 bg-[#040508] text-emerald-300 hover:text-white hover:bg-emerald-400/10 shadow-glow backdrop-blur transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

            </div>

            {/* Premium Button Toggle Filter Layer */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              
              {/* Show ATM Toggle Button */}
              <button
                onClick={() => setShowATM(!showATM)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${showATM ? "bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]" : "bg-black/35 border-emerald-400/10 text-slate-500 hover:text-slate-300"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${showATM ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-slate-600"}`}></span>
                ATM Nodes
              </button>

              {/* Show Bank Toggle Button */}
              <button
                onClick={() => setShowBank(!showBank)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${showBank ? "bg-teal-500/10 border-teal-400 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.15)]" : "bg-black/35 border-emerald-400/10 text-slate-500 hover:text-slate-300"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${showBank ? "bg-teal-400 animate-pulse shadow-[0_0_8px_#14b8a6]" : "bg-slate-600"}`}></span>
                Bank Nodes
              </button>

              {/* Show Underserved Toggle Button */}
              <button
                onClick={() => setShowUnderserved(!showUnderserved)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${showUnderserved ? "bg-red-500/10 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "bg-black/35 border-emerald-400/10 text-slate-500 hover:text-slate-300"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${showUnderserved ? "bg-red-400 animate-pulse shadow-[0_0_8px_#ef4444]" : "bg-slate-600"}`}></span>
                Underserved Zones
              </button>

              {/* Show Demographic Toggle Button */}
              <button
                onClick={() => setShowDemographic(!showDemographic)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${showDemographic ? "bg-amber-500/10 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]" : "bg-black/35 border-emerald-400/10 text-slate-500 hover:text-slate-300"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${showDemographic ? "bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" : "bg-slate-600"}`}></span>
                Demographic Pressure
              </button>

              {/* Heat Map Toggle Button */}
              <button
                onClick={() => setShowHeatMap(!showHeatMap)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${showHeatMap ? "bg-orange-500/15 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]" : "bg-black/35 border-emerald-400/10 text-slate-500 hover:text-slate-300"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${showHeatMap ? "bg-orange-400 animate-pulse shadow-[0_0_8px_#f97316]" : "bg-slate-600"}`}></span>
                Access Heat Map
              </button>

            </div>
          </div>
        </div>

        {/* 100% Immersive Leaflet Map component */}
        <MapClient
          points={points}
          areaA={areaA}
          areaB={areaB}
          compared={true}
          areaAScore={areaAReport.coverage}
          areaBScore={areaBReport.coverage}
          showATM={showATM}
          showBank={showBank}
          showUnderserved={showUnderserved}
          showDemographic={showDemographic}
          showHeatMap={showHeatMap}
          areaProfiles={areaProfiles}
          onMarkerClick={(point) => {
            const clickedArea = point.area;
            if (clickedArea === areaB) {
              // Swap areas so the inspected area becomes Area A and we do not compare with itself
              setAreaA(areaB);
              setAreaB(areaA);
            } else if (clickedArea !== areaA) {
              setAreaA(clickedArea);
            }
            // Automatically slide open the drawer
            setIsPanelOpen(true);
          }}
        />

      </section>

      {/* Floating Action Button to manually open sidebar overlay */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute bottom-6 right-6 z-[998] flex items-center gap-2 rounded-full border border-emerald-400/25 bg-[#0c110e]/95 px-5 py-3 shadow-glow backdrop-blur hover:bg-emerald-400/10 text-emerald-300 transition cursor-pointer"
        >
          <svg className="w-5 h-5 animate-pulse text-[#00ff87]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Open Intelligence</span>
        </button>
      )}

      {/* Dynamic Slide-Over Intelligence Panel Overlay */}
      <aside className={`fixed top-0 right-0 h-full w-[420px] max-w-full z-[1050] bg-[#0c110e]/95 border-l border-emerald-400/20 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out transform p-6 flex flex-col ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Panel Header */}
        <div className="flex justify-between items-center border-b border-emerald-400/10 pb-4 mb-5 shrink-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.28em] text-[#00ff87] uppercase">INTELLIGENCE DASHBOARD</p>
            <h2 className="text-xl font-black mt-1">Access Intelligence</h2>
          </div>
          <button
            onClick={() => setIsPanelOpen(false)}
            title="Close Panel"
            className="p-2 rounded-lg border border-emerald-400/20 text-[#00ff87] hover:bg-emerald-400/10 hover:text-white transition duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Overview Statistics</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="metric-card">
                <p className="text-xs text-slate-300">Priority Coverage</p>
                <h3 className="mt-1 text-3xl font-black text-emerald-300">{weakerArea.coverage}%</h3>
                <p className="text-[10px] text-slate-400 mt-1">{priorityLabel}</p>
              </div>

              <div className="metric-card danger">
                <p className="text-xs text-slate-300">Access Gap</p>
                <h3 className="mt-1 text-3xl font-black text-red-400">{weakerArea.accessGap}%</h3>
                <p className="text-[10px] text-slate-400 mt-1">{weakerArea.riskLevel}</p>
              </div>

              <div className="metric-card">
                <p className="text-xs text-slate-300">ATM / Bank Count</p>
                <h3 className="mt-1 text-xl font-black text-slate-100">
                  {weakerArea.atmCount} / {weakerArea.bankCount}
                </h3>
                <p className="text-[9px] text-slate-400 mt-1">Active Network Density</p>
              </div>

              <div className="metric-card">
                <p className="text-xs text-slate-300">Nearest ATM</p>
                <h3 className="mt-1 text-xl font-black text-slate-100">{weakerArea.proximityDistance} km</h3>
                <p className="text-[9px] text-slate-400 mt-1">Proximity Index</p>
              </div>
            </div>
          </div>

          <section className="info-card">
            <h3 className="text-md font-bold text-emerald-300">Area Comparison</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              <p><b>{areaAReport.area}</b>: {areaAReport.coverage}% coverage</p>
              <p><b>{areaBReport.area}</b>: {areaBReport.coverage}% coverage</p>
              <p className="text-red-300">Intervention Priority: <b>{priorityLabel}</b></p>
              <p className="text-xs text-slate-400 mt-2">
                {isEqual
                  ? "Both areas have equal coverage scores."
                  : `${strongerArea.area} outperforms by ${coverageDifference} coverage points.`}
              </p>
            </div>
          </section>

          <section className="info-card danger">
            <h3 className="text-md font-bold text-red-300">Access Classification Insight</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              {priorityLabel} is classified as <b>{weakerArea.classification}</b> after considering
              ATM density, bank availability, population pressure, travel burden, and income friction.
            </p>
          </section>

          <section className="info-card warning">
            <h3 className="text-md font-bold text-amber-300">Demographic Overlay</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              Population pressure is <b>{weakerArea.populationPressure}%</b> and income friction is{" "}
              <b>{weakerArea.incomeFriction}%</b>. This highlights where weak cash access becomes a
              social infrastructure risk.
            </p>
          </section>

          <section className="info-card">
            <h3 className="text-md font-bold text-emerald-300">Proximity Modeling</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              Estimated average distance to the nearest ATM in {weakerArea.area} is{" "}
              <b>{weakerArea.proximityDistance} km</b>.
            </p>
          </section>

          <section className="info-card">
            <h3 className="text-md font-bold text-emerald-300">Recommended Action</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">{recommendedAction}</p>
          </section>

          <section className="info-card border-emerald-400/30">
            <h3 className="text-md font-bold text-emerald-300">Sample Data Export</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              Download a sample JSON file from the active synthetic infrastructure dataset
              and current comparison state.
            </p>
            <button
              onClick={downloadSampleData}
              className="mt-3 w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 hover:text-emerald-100 cursor-pointer"
            >
              Download Sample Data
            </button>
          </section>

          <section className="text-center text-[10px] text-slate-500 pb-4">
            <p>ATM Cash Access Intelligence System • Phase 2 Upgraded</p>
            <p className="mt-1">Architect Signature: Adithya Rajagopal</p>
          </section>

        </div>
      </aside>

      {/* Developer Signature Modal (Pillar III) */}
      {showMetadataModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-400/25 bg-[#0c110e]/95 p-6 shadow-glow relative">
            
            <button
              onClick={() => setShowMetadataModal(false)}
              title="Close Signature"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              
              <div className="h-12 w-12 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 flex items-center justify-center text-[#00ff87] mb-4 shadow-[0_0_12px_rgba(0,255,135,0.1)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <p className="text-[9px] font-bold tracking-[0.25em] text-[#00ff87] uppercase">
                Developer Signature
              </p>
              
              <h3 className="mt-3 text-xl font-black text-white leading-tight">Adithya Rajagopal</h3>
              <p className="text-emerald-300 font-semibold text-xs mt-1">BCA Student</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Batch 2 Intern</p>
              
              <button
                onClick={() => setShowMetadataModal(false)}
                className="mt-6 w-full rounded-xl bg-emerald-400/20 border border-emerald-400/40 py-2.5 text-xs font-bold text-[#00ff87] hover:bg-emerald-400/30 transition cursor-pointer uppercase tracking-wider"
              >
                Close Signature
              </button>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}