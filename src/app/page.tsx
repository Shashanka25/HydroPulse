"use client";

import { useState, useEffect } from "react";

type NodeType = {
  title: string;
  status: string;
  statusType: "nominal" | "anomaly" | "throttled";
  meta: string;
  flow: string;
  pressure: string;
  battery: string;
};

const INITIAL_NODES: Record<string, NodeType> = {
  "ESP32-NODE-01": {
    title: "ESP32-Node-01 (Municipal Intake)",
    status: "Nominal Operational",
    statusType: "nominal",
    meta: 'Main East Campus Gateway • 3" High-Pressure Ductile Iron Main',
    flow: "38.2 L/min",
    pressure: "4.21 BAR",
    battery: "Mains Powered (100%)",
  },
  "ESP32-NODE-04": {
    title: "ESP32-Node-04 (Academic Wing A)",
    status: "Nominal Operational",
    statusType: "nominal",
    meta: 'Classrooms 101-208 Domestic Supply • 1.5" Copper Riser',
    flow: "11.4 L/min",
    pressure: "4.02 BAR",
    battery: "99.1% (3.65V)",
  },
  "ESP32-NODE-07": {
    title: "ESP32-Node-07 (Building B Lavatories)",
    status: "Minor Anomaly Detected",
    statusType: "anomaly",
    meta: "Zone 2: Bldg B 2nd Floor Lavatory Cluster • Solenoid Valve #V-07",
    flow: "1.82 L/min",
    pressure: "3.88 BAR",
    battery: "98.4% (3.6V)",
  },
  "ESP32-NODE-09": {
    title: "ESP32-NODE-09 (Cooling Towers)",
    status: "Throttled Duty Cycle",
    statusType: "throttled",
    meta: 'Chiller Feed Loop • 2" PVC Pressure-Balanced Branch',
    flow: "8.60 L/min",
    pressure: "3.95 BAR",
    battery: "97.2% (3.58V)",
  },
  "ESP32-NODE-12": {
    title: "ESP32-Node-12 (Fire Protection Standby)",
    status: "Standby Ready",
    statusType: "nominal",
    meta: "Underground Dedicated Life-Safety Hydrant Loop",
    flow: "0.00 L/min",
    pressure: "4.45 BAR",
    battery: "100% (Line Tied)",
  },
};

type EventLog = {
  id: number;
  timeStr: string;
  text: string;
  type?: "WARN" | "SYNC" | "OK" | "INFO";
  isError?: boolean;
};

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [totalPower, setTotalPower] = useState(342.5);
  const [pump1Power, setPump1Power] = useState(124.0);
  const [pump2Power, setPump2Power] = useState(82.5);
  const [pump3Power, setPump3Power] = useState(45.0);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTotalPower(Number((342.5 + (Math.random() * 4 - 2)).toFixed(1)));
      setPump1Power(Number((124.0 + (Math.random() * 2 - 1)).toFixed(1)));
      setPump2Power(Number((82.5 + (Math.random() * 1 - 0.5)).toFixed(1)));
      setPump3Power(Number((45.0 + (Math.random() * 0.8 - 0.4)).toFixed(1)));
      setTotalFlow(prev => {
        const base = prev > 50 ? 64.2 : 42.8;
        return Number((base + (Math.random() * 0.8 - 0.4)).toFixed(1));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime 
    ? currentTime.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST' 
    : '14:48:22 IST';
  
  const dateString = currentTime 
    ? currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }).toUpperCase()
    : 'OCT 24, 2024';

  const [totalFlow, setTotalFlow] = useState<number>(42.8);
  const [valve07Closed, setValve07Closed] = useState<boolean>(false);
  const [masterShutoff, setMasterShutoff] = useState<boolean>(false);
  const [sectorValves, setSectorValves] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: false, // Locked
  });
  
  const [selectedNodeId, setSelectedNodeId] = useState<string>("ESP32-NODE-07");
  const [telemetryMode, setTelemetryMode] = useState<"live" | "baseline">("live");
  const [activeTab, setActiveTab] = useState<string>("telemetry");
  const [anomalyResolved, setAnomalyResolved] = useState<boolean>(false);
  
  // Feature States
  const COMPLEXES = [
    { id: 'east', name: 'East Campus Science' },
    { id: 'north', name: 'North Sector Plant' },
    { id: 'downtown', name: 'Downtown Reservoir' }
  ];
  
  const [selectedComplex, setSelectedComplex] = useState("east");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [simulatedPressure, setSimulatedPressure] = useState(65.2);
  
  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    { id: 1, timeStr: "14:48:02", text: "Heartbeat sync: 24/24 LoRa nodes", type: "OK" },
    { id: 2, timeStr: "14:47:31", text: "ESP32-Node-07: Flow differential +1.8 L/m", type: "WARN", isError: true },
    { id: 3, timeStr: "14:45:10", text: "Ultrasonic chirp sweep #449 completed", type: "OK" },
    { id: 4, timeStr: "14:40:00", text: "AI Model baseline updated with temp 19°C", type: "SYNC" },
  ]);

  const nodes = { ...INITIAL_NODES };
  if (anomalyResolved) {
    nodes["ESP32-NODE-07"] = {
      ...nodes["ESP32-NODE-07"],
      status: "Nominal Operational",
      statusType: "nominal",
      flow: "0.00 L/min",
    };
  }

  const pushEventLog = (text: string, type: "WARN" | "SYNC" | "OK" | "INFO" = "INFO", isError: boolean = false) => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    setEventLogs((prev) => [{ id: Date.now(), timeStr, text, type, isError }, ...prev]);
  };

  const selectSensorNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    pushEventLog(`Telemetry switch: Focused on ${nodeId}`);
  };

  const toggleEmergencyValveV07 = () => {
    const isNowClosed = !valve07Closed;
    setValve07Closed(isNowClosed);
    setSectorValves((prev) => ({ ...prev, 2: !isNowClosed }));

    if (isNowClosed) {
      setTotalFlow((prev) => Number((prev - 1.82).toFixed(1)));
      pushEventLog("[ACTUATOR] Solenoid #V-07 Isolated via Cloud Command");
    } else {
      setTotalFlow((prev) => Number((prev + 1.82).toFixed(1)));
      pushEventLog("[ACTUATOR] Solenoid #V-07 Restored to Nominal Pass");
    }
  };

  const toggleSectorValve = (sectorId: number) => {
    if (sectorId === 2) {
      toggleEmergencyValveV07();
      return;
    }
    const isNowOpen = !sectorValves[sectorId];
    setSectorValves((prev) => ({ ...prev, [sectorId]: isNowOpen }));

    if (isNowOpen) {
      pushEventLog(`[VALVE] Sector ${sectorId} manual open command ACK`);
    } else {
      pushEventLog(`[VALVE] Sector ${sectorId} closed by operator override`);
    }
  };

  const toggleMasterShutoff = () => {
    const isNowShutoff = !masterShutoff;
    setMasterShutoff(isNowShutoff);
    if (isNowShutoff) {
      pushEventLog("[CRITICAL] MASTER INTAKE SHUTOFF ACTIVATED!", "WARN", true);
    } else {
      pushEventLog("[INFO] Master Intake Supply Restored.");
    }
  };

  const dispatchPlumbingTicket = () => {
    pushEventLog("[DISPATCH] Work Order #HD-8842 sent to facilities pager");
  };

  const resolveAnomaly = () => {
    setAnomalyResolved(true);
    pushEventLog("[SYSTEM] Incident #WR-4091 marked as resolved. Pipeline stabilized.", "OK");
    if (!valve07Closed) {
      setTotalFlow((prev) => Number((prev - 1.82).toFixed(1)));
    }
  };

  const [aiDiagState, setAiDiagState] = useState<"idle" | "loading" | "done">("idle");
  const runUltrasonicDiagnosis = () => {
    setAiDiagState("loading");
    setTimeout(() => {
      setAiDiagState("done");
      pushEventLog("[AI-DIAG] Acoustic spectral analysis confirms flap seal bypass");
    }, 1200);
  };

  const [alertMuted, setAlertMuted] = useState(false);
  const muteAlert = () => {
    setAlertMuted(true);
    pushEventLog("[ALERTS] Notification threshold muted until 15:18 UTC");
  };

  const runSystemAcousticSweep = () => {
    pushEventLog("[SWEEP] Ultrasonic chirp sent to 24 nodes...");
    setTimeout(() => {
      pushEventLog("[SWEEP] Sweep verified. Structural integrity optimal.");
    }, 900);
  };

  const switchTelemetryMode = (mode: "live" | "baseline") => {
    setTelemetryMode(mode);
    if (mode === "live") {
      pushEventLog("[VIEW] Switched to 1-second Realtime Telemetry Feed");
    } else {
      pushEventLog("[VIEW] Historical AI Heuristic baseline overlay loaded");
    }
  };

  const clearEventLogs = () => {
    setEventLogs([]);
  };

  const selectedNode = nodes[selectedNodeId];
  const valvesOnlineCount = Object.values(sectorValves).filter(v => v).length + 8; // base 8 fixed
  const displayedFlow = masterShutoff ? "0.0" : totalFlow.toFixed(1);
  const displayedPressure = masterShutoff ? "0.12" : "4.21";
  
  const renderTelemetryContent = () => (
    <div className="flex flex-col gap-space-lg w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md bg-surface-container-low/90 backdrop-blur-xl p-space-lg rounded-xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col gap-space-xs z-10">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-primary tracking-widest">HydroPulse Dynamic Water Grid</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant bg-surface-container-high px-space-xs py-0.5 rounded">CAMPUS-EAST-01</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Autonomous Leakage Intelligence & Telemetry Hub
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Ultra-high-frequency ultrasonic flow tracking, differential pressure heuristics, and localized solenoid isolation across 4 primary physical sectors.
          </p>
        </div>
        
        <div className="flex items-center gap-space-sm shrink-0 z-10">
          <div className="flex bg-surface-container-highest/60 p-1 rounded-lg">
            <button 
              className={`px-space-md py-1.5 rounded font-label-mono-sm text-label-mono-sm font-bold shadow-sm transition-all ${telemetryMode === 'live' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => switchTelemetryMode('live')}
            >
              REALTIME FEED
            </button>
            <button 
              className={`px-space-md py-1.5 rounded font-label-mono-sm text-label-mono-sm font-bold shadow-sm transition-all ${telemetryMode === 'baseline' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => switchTelemetryMode('baseline')}
            >
              AI BASELINE 24H
            </button>
          </div>
          <button 
            className="flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all"
            onClick={runSystemAcousticSweep}
          >
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            <span>Acoustic Sweep</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
        <div className="bg-surface-container-low/80 backdrop-blur-md p-space-md rounded-xl flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container-low transition-all">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Total System Flow</span>
            <span className={`flex items-center gap-1 font-label-mono-sm text-label-mono-sm px-1.5 py-0.5 rounded ${masterShutoff ? 'text-on-surface-variant bg-surface-container' : 'text-tertiary bg-tertiary/10'}`}>
              <span className="material-symbols-outlined text-[12px]">{masterShutoff ? 'horizontal_rule' : 'trending_up'}</span>{masterShutoff ? '0.0%' : '+3.2%'}
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-telemetry-metric text-telemetry-metric text-on-surface tracking-tight">{displayedFlow}</span>
            <span className="font-label-mono-md text-label-mono-md text-primary">L/min</span>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            <div className="w-28 h-6">
              <svg className="w-full h-full text-primary" fill="none" viewBox="0 0 100 25">
                <path d="M0 18 Q 15 22, 28 14 T 55 12 T 78 8 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                <circle cx="100" cy="5" fill="currentColor" r="3"></circle>
              </svg>
            </div>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Base: 41.5 L/m</span>
          </div>
        </div>

        <div className="bg-surface-container-low/80 backdrop-blur-md p-space-md rounded-xl flex flex-col justify-between shadow-md relative group hover:bg-surface-container-low transition-all">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Intake Pressure</span>
            <span className={`font-label-mono-sm text-label-mono-sm px-1.5 py-0.5 rounded font-semibold ${masterShutoff ? 'text-error bg-error/10' : 'text-tertiary bg-tertiary/10'}`}>
              {masterShutoff ? 'CRITICAL LOW' : 'OPTIMAL'}
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className={`font-telemetry-metric text-telemetry-metric tracking-tight ${masterShutoff ? 'text-error' : 'text-on-surface'}`}>{displayedPressure}</span>
            <span className="font-label-mono-md text-label-mono-md text-secondary">BAR</span>
          </div>
          <div className="flex flex-col gap-1 pt-space-xs">
            <div className="flex justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              <span>Range: 3.8 – 4.5</span>
              <span className="text-tertiary">Safe Headroom</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${masterShutoff ? 'w-[5%] bg-error' : 'w-[68%] bg-gradient-to-r from-secondary to-primary'}`}></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low/80 backdrop-blur-md p-space-md rounded-xl flex flex-col justify-between shadow-md relative group hover:bg-surface-container-low transition-all">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Leak Sentinel AI</span>
            {anomalyResolved ? (
              <span className="flex items-center gap-1 font-label-mono-sm text-label-mono-sm text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded font-bold">
                0 ATTENTION
              </span>
            ) : (
              <span className="flex items-center gap-1 font-label-mono-sm text-label-mono-sm text-error bg-error-container/40 px-1.5 py-0.5 rounded font-bold animate-pulse">
                1 ATTENTION
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className={`font-telemetry-metric text-telemetry-metric tracking-tight ${anomalyResolved ? 'text-on-surface' : 'text-error'}`}>
              {anomalyResolved ? '00' : '01'}
            </span>
            <span className="font-label-mono-md text-label-mono-md text-on-surface-variant">
              {anomalyResolved ? 'No Flags' : 'Low-Severity'}
            </span>
          </div>
          <div className={`flex items-center gap-space-xs pt-space-xs font-body-sm text-body-sm truncate ${anomalyResolved ? 'text-on-surface-variant' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[16px] shrink-0">
              {anomalyResolved ? 'check_circle' : 'emergency_home'}
            </span>
            <span className="truncate">
              {anomalyResolved ? 'All zones nominal' : 'Bldg B 2F Restrooms'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low/80 backdrop-blur-md p-space-md rounded-xl flex flex-col justify-between shadow-md relative group hover:bg-surface-container-low transition-all">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Solenoids Status</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary bg-primary/10 px-1.5 py-0.5 rounded">12 OF 12 SYNC</span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-telemetry-metric text-telemetry-metric text-on-surface tracking-tight">
              {masterShutoff ? '0/12' : `${valvesOnlineCount}/12`}
            </span>
            <span className="font-label-mono-md text-label-mono-md text-tertiary">OPEN</span>
          </div>
          <div className="flex items-center justify-between pt-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant">
            <span className="flex items-center gap-1 text-secondary">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span> 1 Auto-Throttled
            </span>
            <span className="text-tertiary">100% Signal</span>
          </div>
        </div>

        <div className="bg-surface-container-low/80 backdrop-blur-md p-space-md rounded-xl flex flex-col justify-between shadow-md relative group hover:bg-surface-container-low transition-all">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Conserved Loss (MTD)</span>
            <span className="font-label-mono-sm text-label-mono-sm text-tertiary bg-tertiary-container/30 px-1.5 py-0.5 rounded font-bold">ECO IMPACT</span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-telemetry-metric text-telemetry-metric text-tertiary tracking-tight">
              {anomalyResolved ? '18,795' : '18,450'}
            </span>
            <span className="font-label-mono-md text-label-mono-md text-tertiary-fixed">L</span>
          </div>
          <div className="flex items-center justify-between pt-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant">
            <span>Est. Offset: $1,420</span>
            <span className="text-tertiary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">eco</span> +14.8% YoY
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md">
        <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-md shadow-md flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
              <span className="font-headline-md text-headline-md text-on-surface font-semibold text-[16px]">Telemetry Event Bus</span>
            </div>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Auto-updating feed</span>
          </div>
          <div className="flex flex-col gap-space-xs font-label-mono-sm text-label-mono-sm overflow-hidden flex-1 overflow-y-auto pr-2">
            {eventLogs.length > 0 ? eventLogs.map((log) => (
              <div key={log.id} className={`p-2 rounded flex items-center justify-between ${log.isError ? 'bg-error-container/20 text-error' : 'bg-surface-container-high/40 text-on-surface'}`}>
                <span className="truncate">[{log.timeStr}] {log.text}</span>
                <span className={
                  log.type === 'OK' ? 'text-tertiary' :
                  log.type === 'WARN' ? 'text-error' :
                  log.type === 'SYNC' ? 'text-primary' : 'text-primary font-bold'
                }>{log.type}</span>
              </div>
            )) : (
              <div className="p-2 rounded bg-surface-container-high/40 text-on-surface-variant">Log buffer purged. Continuous capture active.</div>
            )}
          </div>
          <button 
            className="mt-space-sm w-full py-1.5 text-center font-label-mono-sm text-label-mono-sm text-on-surface-variant hover:text-on-surface bg-surface-container rounded transition-all"
            onClick={clearEventLogs}
          >
            Flush Buffer Log
          </button>
        </div>
      </div>
    </div>
  );

  const renderTopologyContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-6xl mx-auto">
      <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
        <div className="flex items-center justify-between flex-wrap gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="p-2 rounded-lg bg-surface-container-highest text-primary">
              <span className="material-symbols-outlined text-[22px]">account_tree</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Subsurface Piping & Sensor Node Map</h2>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Click any node to stream ultrasonic telemetry</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs font-label-mono-sm text-label-mono-sm">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span> Nominal
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high text-error">
              <span className="w-2 h-2 rounded-full bg-error"></span> Leak Flag
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> Throttled
            </span>
          </div>
        </div>
        
        <div className="relative w-full h-[500px] bg-surface-container-lowest/90 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-space-md">
          <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                <path className="text-primary" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.7"></path>
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100%" width="100%"></rect>
          </svg>

          <svg className="w-full h-full max-w-4xl max-h-[400px] z-0" fill="none" viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg">
            <path className="text-primary/70" d="M 40 180 L 170 180" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></path>
            <path className="text-primary" d="M 40 180 L 170 180" stroke="currentColor" strokeDasharray="8 6" strokeWidth="2"></path>
            <path className="text-primary/70" d="M 170 180 L 170 80 L 330 80" stroke="currentColor" strokeLinecap="round" strokeWidth="6"></path>
            <path className="text-primary/70" d="M 170 180 L 170 280 L 330 280" stroke="currentColor" strokeLinecap="round" strokeWidth="6"></path>
            <path className="text-primary/70" d="M 170 180 L 330 180" stroke="currentColor" strokeLinecap="round" strokeWidth="7"></path>
            <path className={`${anomalyResolved ? 'text-primary/70' : 'text-error/80'}`} d="M 330 180 L 490 180 L 490 110 L 610 110" stroke="currentColor" strokeLinecap="round" strokeWidth="5"></path>
            <path className="text-primary/60" d="M 330 80 L 580 80" stroke="currentColor" strokeLinecap="round" strokeWidth="5"></path>
            <path className="text-secondary/70" d="M 330 280 L 520 280 L 520 220 L 630 220" stroke="currentColor" strokeLinecap="round" strokeWidth="5"></path>
            <path className="text-primary/60" d="M 520 280 L 630 280" stroke="currentColor" strokeLinecap="round" strokeWidth="5"></path>
          </svg>

          <div className="absolute left-[8%] top-[45%] -translate-x-1/2 -translate-y-1/2 z-20 group">
            <button className="relative flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-high text-primary hover:scale-110 transition-all shadow-[0_0_15px_rgba(76,215,246,0.3)]" onClick={() => selectSensorNode('ESP32-NODE-01')}>
              <span className="material-symbols-outlined text-[24px]">water</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-tertiary rounded-full"></span>
            </button>
          </div>

          <div className="absolute left-[47%] top-[20%] -translate-x-1/2 -translate-y-1/2 z-20 group">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high text-primary hover:scale-110 transition-all" onClick={() => selectSensorNode('ESP32-NODE-04')}>
              <span className="material-symbols-outlined text-[20px]">school</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full"></span>
            </button>
          </div>

          <div className="absolute left-[70%] top-[29%] -translate-x-1/2 -translate-y-1/2 z-30 group">
            <button className={`relative flex items-center justify-center w-14 h-14 rounded-full hover:scale-110 transition-all ${anomalyResolved ? 'bg-surface-container-high text-primary' : 'bg-error-container text-on-error-container shadow-[0_0_25px_rgba(244,63,94,0.6)]'}`} onClick={() => selectSensorNode('ESP32-NODE-07')}>
              {!anomalyResolved && <span className="absolute inset-0 rounded-full bg-error animate-ping opacity-60"></span>}
              <span className={`material-symbols-outlined text-[28px] relative z-10 ${anomalyResolved ? 'text-primary' : 'text-error'}`}>{anomalyResolved ? 'check_circle' : 'crisis_alert'}</span>
            </button>
          </div>

          <div className="absolute left-[74%] top-[62%] -translate-x-1/2 -translate-y-1/2 z-20 group">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high text-secondary hover:scale-110 transition-all" onClick={() => selectSensorNode('ESP32-NODE-09')}>
              <span className="material-symbols-outlined text-[20px]">ac_unit</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></span>
            </button>
          </div>

          <div className="absolute left-[88%] top-[77%] -translate-x-1/2 -translate-y-1/2 z-20 group">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high text-primary hover:scale-110 transition-all" onClick={() => selectSensorNode('ESP32-NODE-12')}>
              <span className="material-symbols-outlined text-[20px]">heat_pump</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full"></span>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 bg-surface-container-high/90 px-space-md py-2 rounded-lg font-label-mono-sm text-label-mono-sm text-on-surface flex items-center gap-space-sm shadow-md">
            <span className="material-symbols-outlined text-[18px] text-primary">router</span>
            Mesh Topology: Zigbee / LoRaWAN Hybrid (915 MHz)
          </div>
        </div>

        <div className="bg-surface-container-high/70 p-space-md rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-md transition-all">
          <div className="flex items-center gap-space-md">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
              selectedNode.statusType === 'anomaly' ? 'bg-error-container/30 text-error' :
              selectedNode.statusType === 'throttled' ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'
            }`}>
              <span className="material-symbols-outlined text-[28px]">
                {selectedNode.statusType === 'anomaly' ? 'crisis_alert' :
                 selectedNode.statusType === 'throttled' ? 'tune' : 'check_circle'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">{selectedNode.title}</span>
                <span className={`font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded font-bold uppercase ${
                  selectedNode.statusType === 'anomaly' ? 'text-error bg-error-container/50' :
                  selectedNode.statusType === 'throttled' ? 'text-secondary bg-secondary/10' : 'text-tertiary bg-tertiary/10'
                }`}>
                  {selectedNode.status}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{selectedNode.meta}</p>
            </div>
          </div>
          <div className="flex items-center gap-space-xl w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col text-right">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Ultrasonic Flow</span>
              <span className={`text-2xl font-bold font-mono tracking-tight ${
                selectedNode.statusType === 'anomaly' ? 'text-error' : 'text-primary'
              }`}>{selectedNode.flow}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Line Pressure</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-on-surface">{selectedNode.pressure}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Mesh Battery</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-tertiary">{selectedNode.battery}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertsContent = () => (
    <div className="flex flex-col lg:flex-row gap-space-lg w-full max-w-6xl mx-auto items-stretch">
      <div className="flex-1 flex flex-col gap-space-md">
        <div className="bg-surface-container-low/95 backdrop-blur-xl rounded-xl p-space-lg shadow-xl relative overflow-hidden flex flex-col gap-space-md h-full">
          {anomalyResolved ? (
            <div className="flex items-center justify-center flex-col text-center h-full gap-4 text-tertiary opacity-90">
              <span className="material-symbols-outlined text-[64px]">verified</span>
              <div>
                <h3 className="text-2xl font-bold text-on-surface mb-2">No Active Incidents</h3>
                <p className="text-on-surface-variant">The pipeline network is operating within nominal AI baselines.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-3 h-3 rounded-full bg-error animate-ping"></span>
                  <span className="font-label-mono-sm text-label-mono-sm uppercase text-error tracking-wider font-bold">Incident #WR-4091 ACTIVE</span>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">Duration: 3h 12m</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                  Continuous Low-Level Flow in Building B Washrooms
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  AI heuristics flagged persistent non-zero ultrasonic flow (1.8 L/min) throughout the scheduled unoccupied hours (02:00 – 05:00 UTC). High probability of running commercial diaphragm or ruptured supply line seal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-space-sm bg-surface-container-high/60 p-space-sm rounded-lg">
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Observed Ghost Volume</span>
                  <span className="font-headline-md text-headline-md text-error font-bold">345.6 Litres</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">$1.28 loss / hour</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Acoustic Signature</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">4.2 kHz</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Turbulent Cavitation</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs mt-auto">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold mb-2">Remote Execution Protocols</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <button 
                    className={`flex items-center justify-center gap-space-xs hover:brightness-110 active:scale-95 py-3 px-space-md rounded-lg font-body-sm text-body-sm font-bold transition-all shadow-md ${
                      valve07Closed ? 'bg-tertiary text-on-tertiary' : 'bg-error-container text-on-error-container'
                    }`}
                    onClick={toggleEmergencyValveV07}
                  >
                    <span className="material-symbols-outlined text-[20px]">valve</span>
                    <span>{valve07Closed ? 'Re-Open Valve #V-07' : 'Trigger Valve #V-07 Cutoff'}</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-space-xs bg-tertiary hover:bg-tertiary/90 text-on-tertiary py-3 px-space-md rounded-lg font-body-sm text-body-sm font-bold transition-all shadow-md"
                    onClick={resolveAnomaly}
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Mark as Resolved</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-space-sm mt-2">
                  <button 
                    className="flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary py-2.5 px-space-sm rounded-lg font-label-mono-sm text-label-mono-sm transition-all"
                    onClick={runUltrasonicDiagnosis}
                  >
                    {aiDiagState === 'loading' ? (
                      <><span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Analyzing...</>
                    ) : aiDiagState === 'done' ? (
                      <><span className="material-symbols-outlined text-[16px]">sensors</span> AI Diag: 94% Flush Leak</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">sensors</span> Run Acoustic AI Diag</>
                    )}
                  </button>
                  <button 
                    className={`flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant py-2.5 px-space-sm rounded-lg font-label-mono-sm text-label-mono-sm transition-all ${alertMuted ? 'opacity-50' : ''}`}
                    onClick={muteAlert}
                  >
                    <span className="material-symbols-outlined text-[16px]">alarm_off</span>
                    <span>{alertMuted ? 'Alert Silenced (30m)' : 'Mute Alert for 30m'}</span>
                  </button>
                </div>
              </div>

              {valve07Closed && (
                <div className="mt-2 p-space-sm rounded-lg bg-tertiary-container/30 text-tertiary font-body-sm text-body-sm flex items-center justify-between transition-all">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Solenoid V-07 CLOSED. Flow isolated in Building B Lavatories.</span>
                  </div>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">ACK: 84ms</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-space-md w-full lg:w-[400px]">
        <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" alt="High-tech industrial subterranean water pipe vault" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCro3mzsEEEWNPQOETRrC5k5VAhABbUvtFILzlyWE6OkDBXf4qqO0oYBGgO3nBn14C89VmdqmsvSr4ULdGpK6MHmvFnAh-ZHxn9Lv5pLfU4PFGlCo_LQUWbHWC61gdhN6ieqbuJjfO_zOJcPy1xvp-20n1lasfyMrHLl1AJEEYO37P3cGFUKjBvnTp9oTLEZBCcnNQOkFtz2uNcDcMug6wjhkX5WSm_qbJvMoGkHufIypASCQTO90z82Q" />
            <div className="absolute top-2 left-2 bg-surface-container-lowest/80 px-2 py-0.5 rounded font-label-mono-sm text-label-mono-sm text-primary">CAM-01 • Inflow Manifold</div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded font-label-mono-sm text-label-mono-sm text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> OPTICAL DRY
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-semibold text-on-surface">Main Pump Vault A</span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Moisture: 14% (Dry)</span>
          </div>
        </div>

        <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" alt="Sub-floor building piping chase inspection camera" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpdVHvPIlbqeJ3ZYR4KsS2XFxtG89xSoBecRG5fMcv_cI1Xa4_h1YjFVFAr-fO10-dUP_cljq6rGvw7sbx9EscmvZNIaS7uvNz243Yocu2-8UrFTk83Y-D-s5z4RB_dxorFCLvldCty6ILoapo4exDn6qp2hro9KkdcfvB6tOrWt7RsOC-gRZOCXmQWQrKGGZiAJsTxSIdg_vM5g_nHeiD9guMLBjLZUGpECKVejyq0zYaxRVY1qbx_A" />
            <div className="absolute top-2 left-2 bg-surface-container-lowest/80 px-2 py-0.5 rounded font-label-mono-sm text-label-mono-sm text-error">CAM-03 • Bldg B Chase</div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded font-label-mono-sm text-label-mono-sm text-error font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${anomalyResolved ? 'bg-tertiary' : 'bg-error animate-ping'}`}></span> {anomalyResolved ? 'ALL CLEAR' : 'MOISTURE TRACE'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md font-semibold text-on-surface">Floor 2 Service Riser</span>
            <span className={`font-label-mono-sm text-label-mono-sm font-bold ${anomalyResolved ? 'text-on-surface-variant' : 'text-error'}`}>Liquid Sensor: {anomalyResolved ? 'NEGATIVE' : 'POSITIVE'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValvesContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-4xl mx-auto">
      <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-lg shadow-xl flex flex-col justify-between gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <div className="p-3 rounded-lg bg-surface-container-highest text-primary">
              <span className="material-symbols-outlined text-[32px]">toggle_on</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Smart Solenoid Valve Bank</h2>
              <span className="font-body-md text-body-md text-on-surface-variant mt-1 block">Individual Sector Actuator Overrides & Master Controls</span>
            </div>
          </div>
          <span className="font-label-mono-sm text-label-mono-sm text-tertiary bg-tertiary/10 px-3 py-1 rounded font-bold">FAILSAFE-OPEN MODE</span>
        </div>

        <div className="bg-error-container/20 p-space-lg rounded-xl flex items-center justify-between mt-4">
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-error text-[40px]">gpp_maybe</span>
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold block mb-1">Campus Master Emergency Valve</span>
              <span className="font-body-sm text-body-sm text-error">Isolates entire complex from city supply immediately.</span>
            </div>
          </div>
          <button 
            className={`px-space-xl py-3 rounded-lg font-label-mono-md text-label-mono-md font-bold uppercase transition-all shadow-lg ${
              masterShutoff ? 'bg-tertiary text-on-tertiary hover:brightness-110 active:scale-95' : 'bg-error text-on-error hover:brightness-110 active:scale-95'
            }`}
            onClick={toggleMasterShutoff}
          >
            {masterShutoff ? 'DISENGAGE KILL' : 'MASTER KILL'}
          </button>
        </div>

        <div className="flex flex-col gap-space-sm mt-4">
          {/* Sector 1 */}
          <div className="flex items-center justify-between p-space-md bg-surface-container-high/40 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant">
            <div className="flex items-center gap-space-md">
              <span className={`material-symbols-outlined text-[28px] ${sectorValves[1] ? 'text-tertiary' : 'text-error'}`}>
                {sectorValves[1] ? 'check_circle' : 'warning'}
              </span>
              <div>
                <span className="font-body-md text-body-md font-bold text-on-surface block mb-1">Zone 1: Academic Science Wing</span>
                <span className={`font-label-mono-sm text-label-mono-sm ${sectorValves[1] ? 'text-on-surface-variant' : 'text-error'}`}>Actuator #V-01 • 14.2 L/min</span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg">
              <span className={`font-label-mono-md text-label-mono-md font-bold ${sectorValves[1] ? 'text-tertiary' : 'text-error'}`}>
                {sectorValves[1] ? 'OPEN' : 'CLOSED'}
              </span>
              <button 
                className={`w-14 h-7 rounded-full p-1 transition-colors focus:outline-none relative ${sectorValves[1] ? 'bg-tertiary-container' : 'bg-error-container'}`}
                onClick={() => toggleSectorValve(1)}
              >
                <div className={`w-5 h-5 rounded-full shadow transform transition-transform ${sectorValves[1] ? 'translate-x-7 bg-on-tertiary-container' : 'translate-x-0 bg-on-error'}`}></div>
              </button>
            </div>
          </div>

          {/* Sector 2 */}
          <div className="flex items-center justify-between p-space-md bg-surface-container-high/40 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant">
            <div className="flex items-center gap-space-md">
              <span className={`material-symbols-outlined text-[28px] ${sectorValves[2] ? (anomalyResolved ? 'text-tertiary' : 'text-error') : 'text-error'}`}>
                {sectorValves[2] ? (anomalyResolved ? 'check_circle' : 'warning') : 'warning'}
              </span>
              <div>
                <span className="font-body-md text-body-md font-bold text-on-surface block mb-1">Zone 2: Bldg B Washroom Cluster</span>
                <span className={`font-label-mono-sm text-label-mono-sm ${anomalyResolved ? 'text-on-surface-variant' : 'text-error'}`}>
                  Actuator #V-07 {anomalyResolved ? '• Nominal' : '• Active Leak Target'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg">
              <span className={`font-label-mono-md text-label-mono-md font-bold ${sectorValves[2] ? 'text-on-surface-variant' : 'text-error'}`}>
                {sectorValves[2] ? 'OPEN' : 'CLOSED'}
              </span>
              <button 
                className={`w-14 h-7 rounded-full p-1 transition-colors focus:outline-none relative ${sectorValves[2] ? 'bg-surface-container-highest' : 'bg-error-container'}`}
                onClick={() => toggleSectorValve(2)}
              >
                <div className={`w-5 h-5 rounded-full shadow transform transition-transform ${sectorValves[2] ? 'translate-x-7 bg-on-surface-variant' : 'translate-x-0 bg-on-error'}`}></div>
              </button>
            </div>
          </div>

          {/* Sector 3 */}
          <div className="flex items-center justify-between p-space-md bg-surface-container-high/40 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant">
            <div className="flex items-center gap-space-md">
              <span className={`material-symbols-outlined text-[28px] ${sectorValves[3] ? 'text-secondary' : 'text-error'}`}>
                {sectorValves[3] ? 'tune' : 'warning'}
              </span>
              <div>
                <span className="font-body-md text-body-md font-bold text-on-surface block mb-1">Zone 3: Central Chiller / Towers</span>
                <span className={`font-label-mono-sm text-label-mono-sm ${sectorValves[3] ? 'text-secondary' : 'text-error'}`}>Actuator #V-09 • Modulated (70%)</span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg">
              <span className={`font-label-mono-md text-label-mono-md font-bold ${sectorValves[3] ? 'text-secondary' : 'text-error'}`}>
                {sectorValves[3] ? 'THROTTLED' : 'CLOSED'}
              </span>
              <button 
                className={`w-14 h-7 rounded-full p-1 transition-colors focus:outline-none relative ${sectorValves[3] ? 'bg-secondary-container' : 'bg-error-container'}`}
                onClick={() => toggleSectorValve(3)}
              >
                <div className={`w-5 h-5 rounded-full shadow transform transition-transform ${sectorValves[3] ? 'translate-x-7 bg-on-secondary' : 'translate-x-0 bg-on-error'}`}></div>
              </button>
            </div>
          </div>

          {/* Sector 4 */}
          <div className="flex items-center justify-between p-space-md bg-surface-container-high/40 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant">
            <div className="flex items-center gap-space-md">
              <span className="material-symbols-outlined text-tertiary text-[28px]">security</span>
              <div>
                <span className="font-body-md text-body-md font-bold text-on-surface block mb-1">Zone 4: Fire Suppression Riser</span>
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Actuator #V-12 • Locked Nominal</span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg">
              <span className="font-label-mono-md text-label-mono-md text-tertiary font-bold">LOCKED</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[24px] p-1">lock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-6xl mx-auto">
      <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-lg shadow-xl flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-space-md">
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">24-Hour Campus Flow vs AI Baseline</h2>
              <span className="font-label-mono-sm text-label-mono-sm bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">1-SEC POLLING</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {anomalyResolved ? "Night hours show resolved delta in Zone 2" : "Night hours (01:00 - 05:00) show abnormal delta caused by Zone 2 leak"}
            </span>
          </div>
          <div className="flex flex-col items-end gap-space-sm">
            <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-space-md py-2 rounded-lg transition-colors font-medium">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span className="font-body-sm text-body-sm">Export PDF Report</span>
            </button>
            <div className="flex items-center gap-space-md text-on-surface-variant font-label-mono-sm text-label-mono-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary rounded-full"></span> Actual Flow</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-outline rounded-full border-dashed"></span> Expected Baseline</span>
            </div>
          </div>
        </div>
        
        <div className="relative w-full h-80 bg-surface-container-lowest/60 rounded-xl p-space-md flex items-end">
          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 240">
            <defs>
              <linearGradient id="actualFlowGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.35"></stop>
                <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>
            <line className="text-surface-container-highest" stroke="currentColor" strokeWidth="1" x1="0" x2="800" y1="40" y2="40"></line>
            <line className="text-surface-container-highest" stroke="currentColor" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
            <line className="text-surface-container-highest" stroke="currentColor" strokeWidth="1" x1="0" x2="800" y1="160" y2="160"></line>
            <line className="text-surface-container-highest" stroke="currentColor" strokeWidth="1" x1="0" x2="800" y1="220" y2="220"></line>
            {!anomalyResolved && (
              <>
                <rect fill="rgba(244, 63, 94, 0.08)" height="180" width="180" x="80" y="40"></rect>
                <text className="font-label-mono-sm text-[10px] font-bold" fill="#ffb4ab" x="90" y="60">ANOMALY WINDOW (02:00 - 05:00)</text>
              </>
            )}
            <path className="text-outline" d="M 0 215 Q 100 215, 170 210 T 260 200 T 350 120 T 450 70 T 550 90 T 650 65 T 750 110 T 800 190" fill="none" stroke="currentColor" strokeDasharray="6 4" strokeWidth="2"></path>
            <path d="M 0 210 Q 100 170, 170 160 T 260 165 T 350 110 T 450 65 T 550 82 T 650 60 T 750 100 T 800 180 L 800 240 L 0 240 Z" fill="url(#actualFlowGradient)"></path>
            <path d="M 0 210 Q 100 170, 170 160 T 260 165 T 350 110 T 450 65 T 550 82 T 650 60 T 750 100 T 800 180" fill="none" stroke="#4cd7f6" strokeLinecap="round" strokeWidth="3"></path>
            <line stroke="#4cd7f6" strokeDasharray="4 2" strokeWidth="1.5" x1="720" x2="720" y1="20" y2="230"></line>
            <circle className="shadow-lg" cx="720" cy="85" fill="#4cd7f6" r="5"></circle>
          </svg>
        </div>
        <div className="flex justify-between items-center text-on-surface-variant font-label-mono-sm text-label-mono-sm mt-space-sm px-1">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span className="text-primary font-bold">NOW (14:48)</span>
        </div>
      </div>
      
      <div className="bg-surface-container-low/90 backdrop-blur-md rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Monthly Usage Audits</h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm text-on-surface">
            <thead>
              <tr className="border-b border-surface-container-high text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                <th className="py-3 px-4 uppercase">Month</th>
                <th className="py-3 px-4 uppercase">Total Flow (L)</th>
                <th className="py-3 px-4 uppercase">Conserved Loss (L)</th>
                <th className="py-3 px-4 uppercase">Avg Pressure</th>
                <th className="py-3 px-4 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-container-high hover:bg-surface-container/50">
                <td className="py-4 px-4 font-bold text-on-surface">October 2024</td>
                <td className="py-4 px-4">1,402,300</td>
                <td className="py-4 px-4 text-tertiary font-bold">18,450</td>
                <td className="py-4 px-4">4.20 BAR</td>
                <td className="py-4 px-4"><span className="bg-tertiary/10 text-tertiary px-2 py-1 rounded text-xs font-bold">IN PROGRESS</span></td>
              </tr>
              <tr className="border-b border-surface-container-high hover:bg-surface-container/50">
                <td className="py-4 px-4 font-bold text-on-surface">September 2024</td>
                <td className="py-4 px-4">1,830,100</td>
                <td className="py-4 px-4 text-tertiary font-bold">24,100</td>
                <td className="py-4 px-4">4.15 BAR</td>
                <td className="py-4 px-4"><span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-xs font-bold">FINALIZED</span></td>
              </tr>
              <tr className="hover:bg-surface-container/50">
                <td className="py-4 px-4 font-bold text-on-surface">August 2024</td>
                <td className="py-4 px-4">1,940,500</td>
                <td className="py-4 px-4 text-tertiary font-bold">12,300</td>
                <td className="py-4 px-4">4.25 BAR</td>
                <td className="py-4 px-4"><span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-xs font-bold">FINALIZED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-4xl mx-auto items-center justify-center min-h-[70vh] text-center">
      <span className="material-symbols-outlined text-[80px] text-primary/40 mb-4 animate-spin-slow">settings</span>
      <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">System Settings & Calibration</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mt-2">
        Firmware updates and heuristic AI weight calibrations are currently restricted to Tier 1 Maintenance Leads.
      </p>
      
      <div className="mt-8 bg-surface-container p-6 rounded-xl text-left w-full max-w-md">
        <h3 className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant mb-4">Node Diagnostics</h3>
        <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2">
          <span className="material-symbols-outlined">restart_alt</span> Run Full Node Reboot Sequence
        </button>
      </div>
    </div>
  );

  const renderForecastContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Predictive Analytics</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">AI-driven forecasts based on historical telemetry and stress curves.</p>
        </div>
        <div className="bg-primary-container/20 text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined animate-pulse">model_training</span>
          Model Confidence: 94.2%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-variant">
          <h3 className="font-label-mono-md text-label-mono-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">trending_up</span> 7-Day Demand Forecast
          </h3>
          <div className="h-48 flex items-end gap-2">
            {[40, 45, 60, 80, 55, 42, 38].map((val, i) => (
              <div key={i} className="flex-1 bg-tertiary/20 hover:bg-tertiary/40 rounded-t-sm relative group transition-colors" style={{ height: `${val}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-xs text-on-surface transition-opacity pointer-events-none">
                  {val}k L
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-on-surface-variant text-[10px] uppercase">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-variant">
          <h3 className="font-label-mono-md text-label-mono-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span> Maintenance Predictions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-error-container/10 p-3 rounded-lg border border-error/20">
              <div className="flex flex-col">
                <span className="font-medium text-error">Zone 4 Main Valve (V-09)</span>
                <span className="text-sm text-error/80">High pressure stress detected. 78% failure probability.</span>
              </div>
              <span className="font-mono text-xs bg-error text-on-error px-2 py-1 rounded">IN 3 DAYS</span>
            </div>
            <div className="flex items-center justify-between bg-surface-container p-3 rounded-lg border border-surface-variant">
              <div className="flex flex-col">
                <span className="font-medium text-on-surface">ESP32-Node-12 Battery</span>
                <span className="text-sm text-on-surface-variant">Discharge rate accelerating.</span>
              </div>
              <span className="font-mono text-xs bg-surface-variant text-on-surface px-2 py-1 rounded">IN 14 DAYS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPowerGridContent = () => (
    <div className="flex flex-col gap-space-lg w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Power Grid & Energy</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Real-time electricity consumption and power source distribution.</p>
        </div>
        <div className="bg-primary-container/20 text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-warning">bolt</span>
          Grid Stable: 240V
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-variant col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-label-mono-md text-label-mono-md text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">power</span> Total Power Draw
            </h3>
            <span className="font-headline-lg text-[48px] font-bold text-on-surface">{totalPower} <span className="text-[24px] text-on-surface-variant font-medium">kW/h</span></span>
          </div>
          <div className="mt-8">
            <div className="flex justify-between text-label-mono-sm text-on-surface-variant mb-2">
              <span>Main Grid (65%)</span>
              <span>Solar Array (35%)</span>
            </div>
            <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '65%' }}></div>
              <div className="h-full bg-warning" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-variant">
          <h3 className="font-label-mono-md text-label-mono-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">water_pump</span> Pump Consumption
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-medium">Primary Intake P-01</span>
              <span className="font-mono text-on-surface">{pump1Power.toFixed(1)} kW</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-error rounded-full transition-all duration-1000" style={{ width: `${(pump1Power/150)*100}%` }}></div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-on-surface-variant font-medium">Zone 2 Booster P-04</span>
              <span className="font-mono text-on-surface">{pump2Power.toFixed(1)} kW</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full transition-all duration-1000" style={{ width: `${(pump2Power/150)*100}%` }}></div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-on-surface-variant font-medium">Filtration Unit F-02</span>
              <span className="font-mono text-on-surface">{pump3Power.toFixed(1)} kW</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(pump3Power/150)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'telemetry': return renderTelemetryContent();
      case 'topology': return renderTopologyContent();
      case 'alerts': return renderAlertsContent();
      case 'valves': return renderValvesContent();
      case 'power': return renderPowerGridContent();
      case 'history': return renderHistoryContent();
      case 'forecast': return renderForecastContent();
      case 'settings': return renderSettingsContent();
      default: return renderTelemetryContent();
    }
  };

  return (
    <>
    <div className="flex h-screen bg-surface overflow-hidden">
      <aside className="fixed bottom-0 md:left-0 md:top-0 md:h-full w-full md:w-72 bg-surface-container-lowest z-50 flex flex-row md:flex-col justify-between border-t border-surface-variant md:border-t-0 shadow-[0_-4px_24px_rgba(0,0,0,0.2)] md:shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-row md:flex-col w-full">
          <div className="hidden md:flex h-16 px-space-lg items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
              </div>
              <div>
                <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface leading-none block">
                  HydroPulse
                </span>
                <span className="font-label-mono-sm text-label-mono-sm text-primary tracking-widest uppercase block">
                  IoT Platform
                </span>
              </div>
            </div>
            <span className="font-label-mono-sm text-label-mono-sm bg-surface-container-high text-on-surface-variant px-space-xs py-0.5 rounded">
              v3.4
            </span>
          </div>
          <div className="px-space-md py-space-sm relative hidden md:block">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">apartment</span>
                <div className="flex flex-col items-start">
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Selected Complex</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium truncate max-w-[130px]">
                    {COMPLEXES.find(c => c.id === selectedComplex)?.name}
                  </span>
                </div>
              </div>
              <span className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-space-md right-space-md mt-2 bg-surface-container-high rounded-lg shadow-xl z-50 overflow-hidden border border-surface-variant">
                {COMPLEXES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedComplex(c.id); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-space-md py-2 text-body-sm hover:bg-surface-container-highest transition-colors ${selectedComplex === c.id ? 'text-primary font-medium' : 'text-on-surface'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-row md:flex-col gap-space-xs px-2 md:px-space-md mt-0 md:mt-space-sm overflow-x-auto overflow-y-hidden md:overflow-visible items-center md:items-stretch py-2 md:py-0 w-full no-scrollbar">
            {[
              { id: "telemetry", icon: "monitoring", label: "Live Telemetry" },
              { id: "topology", icon: "schema", label: "Pipe Network" },
              { id: "alerts", icon: "warning", label: "Leak Detection", badge: anomalyResolved ? 0 : 1 },
              { id: "valves", icon: "valve", label: "Smart Valves" },
              { id: "power", icon: "bolt", label: "Power Grid" },
              { id: "history", icon: "history_toggle_off", label: "History & Audits" },
              { id: "forecast", icon: "online_prediction", label: "AI Forecast" },
            ].map(tab => (
              <a 
                key={tab.id}
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                className={`flex shrink-0 items-center justify-center md:justify-between px-space-sm md:px-space-md py-2 md:py-space-sm rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center gap-1 md:gap-space-md">
                  <span className="material-symbols-outlined text-[24px] md:text-[20px]">{tab.icon}</span>
                  <span className={`font-body-sm text-[10px] md:text-body-sm ${activeTab === tab.id ? '' : 'font-medium'}`}>{tab.label}</span>
                </div>
                {!!tab.badge && tab.badge > 0 && (
                  <span className="hidden md:inline-block font-label-mono-sm text-label-mono-sm bg-error-container text-on-error-container px-space-xs py-0.5 rounded font-bold">{tab.badge}</span>
                )}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex p-space-md flex-col gap-space-sm bg-surface-container-lowest">
          <div className="bg-surface-container-low p-space-sm rounded-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Battery Mesh Avg</span>
              <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-bold">98.4%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="w-[98.4%] h-full bg-tertiary rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between px-space-sm text-on-surface-variant font-label-mono-sm text-label-mono-sm">
            <span>Gateway RT-08</span>
            <span className="text-tertiary font-medium">CONNECTED</span>
          </div>
        </div>
      </aside>
      
      <div className="flex-1 mb-16 md:mb-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 shrink-0 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] sticky top-0">
          <div className="flex items-center gap-space-lg flex-1 max-w-4xl">
            <div className="flex items-center gap-space-sm mr-4">
              <div className="w-10 h-10 rounded-[12px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-[22px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface font-medium leading-tight">Shashanka Biswas</span>
                <span className="font-label-mono-sm text-label-mono-sm text-primary leading-none">Chief Utility Officer</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm bg-surface-container-high/60 px-space-md py-1.5 rounded-full shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary"></span>
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">Operational</span>
              <span className="text-on-surface-variant text-[10px]">•</span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">24 Nodes Online</span>
            </div>
            {anomalyResolved ? (
              <div className="hidden xl:flex items-center gap-space-xs bg-tertiary-container/20 px-space-md py-1.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-medium">All Systems Nominal</span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-space-xs bg-error-container/20 px-space-md py-1.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-error text-[16px]">crisis_alert</span>
                <span className="font-label-mono-sm text-label-mono-sm text-error font-medium">1 Minor Anomaly Detected</span>
              </div>
            )}
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                className="w-full bg-surface-container-high/40 text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-9 pr-space-md py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-primary transition-all" 
                placeholder="Search sensor nodes, valve IDs, pipe zones..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-space-lg shrink-0">
            <div className="hidden md:flex flex-col items-end min-w-[120px]">
              <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold tabular-nums">{timeString}</span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">{dateString}</span>
            </div>
            <div className="h-6 w-px bg-surface-container-high hidden md:block"></div>
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${anomalyResolved ? 'bg-surface-container-highest' : 'bg-primary'}`}></span>
            </button>
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="p-space-lg w-full max-w-[1720px] mx-auto pb-12">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
      {/* Dev Console Toggle Button */}
      <button 
        onClick={() => setIsDevConsoleOpen(!isDevConsoleOpen)}
        className="fixed bottom-24 md:bottom-6 right-6 z-[60] w-12 h-12 bg-primary rounded-full shadow-[0_0_15px_rgba(76,215,246,0.3)] flex items-center justify-center text-on-primary hover:scale-110 transition-transform"
        title="Open Sensor Simulator"
      >
        <span className="material-symbols-outlined">{isDevConsoleOpen ? 'close' : 'developer_board'}</span>
      </button>

      {/* Dev Console Panel */}
      {isDevConsoleOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-6 z-[60] w-80 bg-surface-container-high rounded-xl shadow-2xl border border-surface-variant overflow-hidden">
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-primary text-[18px]">terminal</span>
            <span className="font-label-mono-sm text-on-primary font-bold tracking-wider">SENSOR SIMULATOR</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">Adjust parameters to simulate live telemetry changes across the platform.</p>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-on-surface font-medium">Zone 2 Pressure</label>
                <span className={`font-mono text-sm ${simulatedPressure > 80 ? 'text-error font-bold' : 'text-primary'}`}>{simulatedPressure.toFixed(1)} PSI</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="100" 
                step="0.1" 
                value={simulatedPressure} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimulatedPressure(val);
                  if (val > 80 && anomalyResolved) {
                    setAnomalyResolved(false);
                    setTotalFlow(64.2);
                  } else if (val <= 80 && !anomalyResolved) {
                    setAnomalyResolved(true);
                    setTotalFlow(42.8);
                  }
                }}
                className="w-full accent-primary"
              />
              {simulatedPressure > 80 && (
                <span className="text-[10px] text-error flex items-center gap-1 mt-1 font-medium bg-error-container/20 px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-[12px]">warning</span> Threshold exceeded. Triggering leak anomaly.
                </span>
              )}
            </div>
            
            <div className="h-px bg-surface-variant w-full my-1"></div>
            
            <button 
              onClick={() => {
                setSimulatedPressure(65.2);
                setAnomalyResolved(true);
                setTotalFlow(42.8);
              }}
              className="text-xs text-on-surface font-medium bg-surface-container hover:bg-surface-container-highest px-3 py-2.5 rounded transition-colors"
            >
              Reset to Nominal State
            </button>
          </div>
        </div>
      )}
    </>
  );
}

