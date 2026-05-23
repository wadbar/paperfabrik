/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Ruler, Compass, Box, Layers, MousePointer2, Settings2, Link, X, Check, 
  ChevronDown, Download, Activity, Wind, PlayCircle, BarChart3, ZoomIn, Hand, Orbit,
  Undo2, Redo2, Grid3X3
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";
import { ProjectionCompute, Vector3 } from "../../core/geometry";
import { Mesh } from "../../core/mesh";
import { SimulationResult } from "../../core/simulation";
import { computeClient } from "../../core/computeClient";

// --- Constants ---
const DEFAULT_LIGHT_DIR = new Vector3(1, -1, 1).normalize();
const VIEWPORT_CENTER = { x: 100, y: 120 };
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const ORBIT_SENSITIVITY = 0.008;
const PAN_SENSITIVITY = 0.5;

interface RenderSettings {
  resolution: 'Low' | 'Medium' | 'High';
  antiAliasing: boolean;
  outputFormat: 'PNG' | 'JPG' | 'STL' | 'OBJ';
  shading: "Wireframe" | "Solid" | "Realistic" | "Stress";
  wireframeThickness: number;
  wireframeColor: string;
}

const WIREFRAME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function CADViewport() {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry("CADViewport");
  
  // Parametric State
  const [radius, setRadius] = useState(60);
  const [sides, setSides] = useState(6);
  const [extrude, setExtrude] = useState(40);
  
  // Viewport State
  const [activeViewportTool, setActiveViewportTool] = useState<'orbit' | 'pan' | 'zoom'>('orbit');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [orbit, setOrbit] = useState({ rx: 0.2, ry: 0.5 }); // Initial orbit for better 3D feel
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframeOverlay, setShowWireframeOverlay] = useState(true);
  const [gridSize, setGridSize] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // History State
  const [history, setHistory] = useState<any[]>([
    { radius: 60, sides: 6, extrude: 40, pan: { x: 0, y: 0 }, orbit: { rx: 0.2, ry: 0.5 }, zoom: 1 }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const wheelTimeout = useRef<number | null>(null);

  // --- Keyboard Precision Pan ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeViewportTool !== 'pan') return;
      if (document.activeElement?.tagName === 'INPUT') return;

      const step = e.shiftKey ? 10 : 2;
      switch (e.key) {
        case 'ArrowLeft':
          setPan(p => ({ ...p, x: p.x - step }));
          break;
        case 'ArrowRight':
          setPan(p => ({ ...p, x: p.x + step }));
          break;
        case 'ArrowUp':
          setPan(p => ({ ...p, y: p.y - step }));
          break;
        case 'ArrowDown':
          setPan(p => ({ ...p, y: p.y + step }));
          break;
        default:
          return;
      }
      e.preventDefault();
      // Use logic to commit after a short delay or just commit on keyup (complex)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeViewportTool]);

  // --- Callbacks ---

  const commitState = useCallback((overrideState?: any) => {
     const currentState = { radius, sides, extrude, pan, orbit, zoom };
     const nextState = overrideState ? { ...currentState, ...overrideState } : currentState;
     
     // Deep comparison (simple) to avoid redundant history
     const lastState = history[historyIndex];
     if (
       lastState.radius === nextState.radius &&
       lastState.sides === nextState.sides &&
       lastState.extrude === nextState.extrude &&
       lastState.pan.x === nextState.pan.x &&
       lastState.pan.y === nextState.pan.y &&
       lastState.orbit.rx === nextState.orbit.rx &&
       lastState.orbit.ry === nextState.orbit.ry &&
       lastState.zoom === nextState.zoom
     ) return;
     
     const newHistory = history.slice(0, historyIndex + 1);
     newHistory.push(nextState);
     
     // Cap history at 50 steps
     if (newHistory.length > 50) newHistory.shift();
     
     setHistory(newHistory);
     setHistoryIndex(newHistory.length - 1);
  }, [radius, sides, extrude, pan, orbit, zoom, history, historyIndex]);

  useEffect(() => {
    return () => {
        if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current);
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      const st = history[idx];
      setRadius(st.radius);
      setSides(st.sides);
      setExtrude(st.extrude);
      setPan(st.pan);
      setOrbit(st.orbit);
      setZoom(st.zoom);
      setHistoryIndex(idx);
      recordEvent("UNDO_ACTION");
    }
  }, [historyIndex, history, recordEvent]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      const st = history[idx];
      setRadius(st.radius);
      setSides(st.sides);
      setExtrude(st.extrude);
      setPan(st.pan);
      setOrbit(st.orbit);
      setZoom(st.zoom);
      setHistoryIndex(idx);
      recordEvent("REDO_ACTION");
    }
  }, [historyIndex, history, recordEvent]);

  // Analysis State
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Render Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'OBJ',
    shading: "Solid",
    wireframeThickness: 1.5,
    wireframeColor: WIREFRAME_COLORS[0]
  });
  const [savedSettings, setSavedSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'OBJ',
    shading: "Solid",
    wireframeThickness: 1.5,
    wireframeColor: WIREFRAME_COLORS[0]
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleSaveSettings = () => {
    setSavedSettings(tempSettings);
    setIsSettingsOpen(false);
    recordEvent("RENDER_SETTINGS_SAVED", tempSettings);
  };

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimResult(null);
    recordEvent("CAD_SIMULATION_START");
    
    try {
        // Build the mesh explicitly for simulation using centralized factory
        const { vertices, faces } = ProjectionCompute.generateParametricMesh(sides, radius, extrude);
        const simMesh = new Mesh(vertices.map(v => new Vector3(v.x, v.y, v.z)), faces);

        const result = await computeClient.simulateStaticLoad(simMesh);
        setSimResult(result);
        setSavedSettings(prev => ({ ...prev, shading: "Stress" }));
        recordEvent("CAD_SIMULATION_SUCCESS", { peakStress: result.maxStress });
    } catch (err: any) {
        console.error("Simulation failed:", err);
        recordEvent("CAD_SIMULATION_ERROR", { error: err.message });
    } finally {
        setIsSimulating(false);
    }
  };

  const handleOpenSettings = () => {
    setTempSettings(savedSettings);
    setIsSettingsOpen(true);
    recordEvent("RENDER_SETTINGS_OPENED");
  };

  const handleExport = async () => {
    try {
      recordEvent("EXPORT_INITIATED", { format: savedSettings.outputFormat });
      
      // Industrial Logic: Generate real export buffers on the client
      const exportMesh = geometryData.mesh;
      let content = "";
      let mimeType = "text/plain";
      
      if (savedSettings.outputFormat === "OBJ") {
         content = exportMesh.toOBJ();
         mimeType = "text/plain";
      } else if (savedSettings.outputFormat === "STL") {
         content = exportMesh.toSTL();
         mimeType = "model/stl";
      } else {
         // PNG/JPG fallbacks simplified (taking SVG screenshot is complex, so we log and notify)
         const response = await fetch("/api/cad/export", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ format: savedSettings.outputFormat, projectData: { radius, sides, extrude } })
         });
         const resData = await response.json();
         if (resData.status === "error") throw new Error(resData.message);
         return;
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paperfabrik_export_${Date.now()}.${savedSettings.outputFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      recordEvent("EXPORT_COMPLETED", { format: savedSettings.outputFormat });
    } catch (err: any) {
      console.error("Export failed:", err);
      recordEvent("EXPORT_FAILED", { error: err.message });
    }
  };

  const currentStrokeWidth = useMemo(() => {
    const baseWidth = { 'Low': 1.5, 'Medium': 1.0, 'High': 0.5 }[savedSettings.resolution];
    return baseWidth / zoom;
  }, [savedSettings.resolution, zoom]);

  // --- Input Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeViewportTool === 'pan' || activeViewportTool === 'orbit' || activeViewportTool === 'zoom') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    if (activeViewportTool === 'pan') {
      setPan(prev => ({ x: prev.x + dx * PAN_SENSITIVITY / zoom, y: prev.y + dy * PAN_SENSITIVITY / zoom }));
    } else if (activeViewportTool === 'orbit') {
      setOrbit(prev => ({ rx: prev.rx + dy * ORBIT_SENSITIVITY, ry: prev.ry + dx * ORBIT_SENSITIVITY }));
    } else if (activeViewportTool === 'zoom') {
      setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * (1 - dy * 0.01))));
    }
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      commitState();
    }
  };

  // --- Render Orchestration ---

  const geometryData = useMemo(() => {
    // 1. Parametric Generation
    const { vertices, faces } = ProjectionCompute.generateParametricMesh(sides, radius, extrude);
    const mesh = new Mesh(vertices, faces);
    mesh.computeNormals();

    // 2. Pre-calculate rotation matrices (Industrial Optimization)
    const { rotate } = ProjectionCompute.getRotationMatrices(orbit.rx, orbit.ry);

    // 3. Transformation Phase (Projection & Displacement)
    const transformedVertices = mesh.vertices.map((v, idx) => {
        let displacedV = v;
        if (simResult && (savedSettings.shading === "Stress" || isSimulating)) {
             // Real-world displacement scale proxy
             displacedV = v.add(simResult.vertexDisplacements[idx].mul(10)); 
        }
        return rotate(displacedV);
    });

    // 4. Painter's Algorithm Depth Scoring & Projection
    const processedFaces = mesh.faces.map(face => {
        const depth = face.indices.reduce((sum, idx) => sum + transformedVertices[idx].z, 0) / face.indices.length;
        const rotatedNormal = face.normal ? rotate(face.normal).normalize() : face.normal;
        
        // Intensity for lighting (N dot L)
        const intensity = rotatedNormal ? Math.max(0.1, rotatedNormal.dot(DEFAULT_LIGHT_DIR)) : 0.4;
        
        // Advanced Shading Logic
        let fill = `rgba(59, 130, 246, ${intensity * 0.9})`;
        if (savedSettings.shading === "Realistic") {
            const spec = Math.pow(intensity, 4);
            const baseColor = 100 + intensity * 60;
            const r = Math.min(255, baseColor + spec * 100);
            const g = Math.min(255, baseColor + 5 + spec * 100);
            const b = Math.min(255, baseColor + 15 + spec * 100);
            fill = `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}, 0.98)`;
        } else if (savedSettings.shading === "Stress") {
            if (simResult) {
                const avgStress = face.indices.reduce((sum, idx) => sum + simResult.stressValues[idx], 0) / face.indices.length;
                const t = (avgStress - simResult.minStress) / (simResult.maxStress - simResult.minStress || 1);
                const hue = Math.max(0, 240 - (t * 240)); // Blue (low) to Red (high)
                fill = `hsla(${hue.toFixed(0)}, 85%, 50%, ${0.6 + intensity * 0.4})`;
            } else {
                fill = `rgba(100, 100, 100, ${intensity * 0.5})`;
            }
        } else if (savedSettings.shading === "Wireframe") {
            fill = "#0d1117"; 
        }

        const points = face.indices.map(idx => {
            const p = ProjectionCompute.project(transformedVertices[idx]);
            return { x: VIEWPORT_CENTER.x + p.x, y: VIEWPORT_CENTER.y + p.y };
        });

        return {
            path: ProjectionCompute.pointsToPath(points),
            depth,
            fill,
            intensity
        };
    });

    processedFaces.sort((a, b) => b.depth - a.depth);

    // Projected Base for annotations
    const { base } = ProjectionCompute.generateExtrusion(sides, radius, extrude);
    const projectedBase = base.map(v => {
        const p = ProjectionCompute.project(rotate(v));
        return { x: VIEWPORT_CENTER.x + p.x, y: VIEWPORT_CENTER.y + p.y };
    });

    return {
      faces: processedFaces,
      basePath: ProjectionCompute.pointsToPath(projectedBase),
      projectedBase,
      mesh
    };
  }, [radius, sides, extrude, orbit, simResult, savedSettings.shading, isSimulating]);

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-blue-500/30">
      <div className="flex-1 bg-[#0a0a0b] rounded border border-white/5 relative flex gap-px bg-studio-dots min-h-0 overflow-hidden">
        
        {/* Sidebar: Tree & Analysis */}
        <aside className="w-32 bg-[#0d1117] flex flex-col p-2 gap-2 shrink-0 overflow-y-auto border-r border-white/5 shadow-xl">
          <header className="px-1 py-2 border-b border-white/5 flex items-center justify-between">
             <span className="text-[7px] text-blue-400 uppercase font-black flex items-center gap-1 opacity-80">
                <Layers className="w-3 h-3" /> ASSEMBLY TREE
             </span>
             <ChevronDown className="w-2.5 h-2.5 text-white/20" />
          </header>

          <nav className="flex flex-col gap-0.5">
             <TreeItem name="Sketch_Main" icon={MousePointer2} active />
             <div className="pl-3 py-1 space-y-2 mb-2">
                <ParametricInput label="Radius" value={radius} onChange={setRadius} onCommit={commitState} />
                <ParametricInput label="Sides" value={sides} onChange={setSides} onCommit={commitState} min={3} max={64} />
             </div>

             <TreeItem name="Pad_Extrude" icon={Box} />
             <div className="pl-3 py-1 space-y-2 mb-2">
                <ParametricInput label="Height" value={extrude} onChange={setExtrude} onCommit={commitState} />
             </div>
          </nav>

          <footer className="mt-auto pt-4 space-y-4">
             <section className="space-y-2">
                <span className="text-[7px] text-emerald-400 uppercase font-black px-1 flex items-center gap-1 opacity-60">
                   <Activity className="w-3 h-3" /> TELEMETRY
                </span>
                <div className="flex flex-col gap-1 px-1 text-[8px] text-white/20 uppercase tracking-widest">
                   <div className="flex justify-between"><span>Verts</span><span className="text-white/60">{geometryData.mesh.vertices.length}</span></div>
                   <div className="flex justify-between"><span>Faces</span><span className="text-white/60">{geometryData.mesh.faces.length}</span></div>
                </div>
             </section>

             <section className="px-1 space-y-2 border-t border-white/5 pt-4">
                <span className="text-[7px] text-amber-500 uppercase font-black flex items-center gap-1">
                   <Wind className="w-3 h-3" /> F.E.A. CORE
                </span>
                {simResult ? (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
                       <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-sm ring-1 ring-amber-500/5">
                           <div className="flex justify-between text-[7px] text-amber-200/40 uppercase font-black">
                               <span>Peak</span>
                               <span className="text-amber-400 font-mono tracking-tight">{simResult.maxStress.toFixed(3)} MPa</span>
                           </div>
                           <div className="h-1 w-full bg-black/40 rounded-full mt-1.5 overflow-hidden">
                               <motion.div className="h-full bg-amber-500" initial={{ width: 0 }} animate={{ width: "85%" }} />
                           </div>
                       </div>
                       <button onClick={() => setSimResult(null)} className="w-full py-1 text-[7px] text-white/20 uppercase hover:text-white hover:bg-white/5 rounded transition-all">Clear Solution</button>
                    </div>
                ) : (
                    <button 
                       onClick={runSimulation}
                       disabled={isSimulating}
                       className="w-full py-2 bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500 hover:text-black hover:border-amber-400 text-amber-500/80 text-[8px] font-black uppercase rounded-sm flex items-center justify-center gap-2 transition-all group active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                       {isSimulating ? <Activity className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3 group-hover:fill-current" />}
                       {isSimulating ? "Solving..." : "Compute Stress"}
                    </button>
                )}
             </section>
          </footer>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 relative bg-[#09090b] flex items-center justify-center overflow-hidden">
           {showGrid && (
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: `${gridSize}px ${gridSize}px` }} />
           )}
           
           {/* Navigation HUD */}
           <motion.div
             layout
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 20 }}
             className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-2 z-10 scale-90 origin-bottom-left"
           >
              <motion.div 
                layout
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)' }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 px-4 flex flex-col gap-2 shadow-2xl ring-1 ring-white/5 pointer-events-auto transition-shadow"
              >
                <header className="flex items-center justify-between gap-8">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] leading-none">Status_HUD_0.4</span>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-colors ${showWireframeOverlay ? 'bg-emerald-500' : 'bg-white/20'}`} title="Wireframe Status" />
                    <div className={`w-2 h-2 rounded-full ring-4 ${isDragging ? 'bg-blue-500 ring-blue-500/20 animate-pulse' : 'bg-white/10 ring-transparent'}`} />
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <HUDItem icon={ZoomIn} value={`${Math.round(zoom * 100)}%`} label="Zoom" />
                  <div className="flex flex-col gap-0.5">
                     <span className="text-[6px] text-white/20 uppercase font-black tracking-widest">Pan_Offset</span>
                     <div className="flex items-center gap-1 text-[9px] font-mono text-white/50 relative group/hud-pan">
                        <input className="bg-transparent w-8 focus:text-blue-400 focus:outline-none" value={pan.x.toFixed(0)} onChange={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) setPan(p => ({ ...p, x: v }));
                        }} />
                        <span className="text-white/10">|</span>
                        <input className="bg-transparent w-8 focus:text-blue-400 focus:outline-none" value={pan.y.toFixed(0)} onChange={e => {
                           const v = parseFloat(e.target.value);
                           if (!isNaN(v)) setPan(p => ({ ...p, y: v }));
                        }} />
                        
                        {/* Precision Nudges */}
                        {activeViewportTool === 'pan' && (
                           <div className="absolute -right-10 top-0 flex flex-col gap-0.5 opacity-0 group-hover/hud-pan:opacity-100 transition-opacity">
                              <div className="flex gap-0.5">
                                 <button onClick={() => setPan(p => ({ ...p, y: p.y - 1 }))} className="p-0.5 hover:bg-white/10 rounded-sm"><ChevronDown className="w-2.5 h-2.5 rotate-180 text-blue-400" /></button>
                                 <button onClick={() => setPan(p => ({ ...p, x: p.x + 1 }))} className="p-0.5 hover:bg-white/10 rounded-sm"><ChevronDown className="w-2.5 h-2.5 -rotate-90 text-blue-400" /></button>
                              </div>
                              <div className="flex gap-0.5">
                                 <button onClick={() => setPan(p => ({ ...p, x: p.x - 1 }))} className="p-0.5 hover:bg-white/10 rounded-sm"><ChevronDown className="w-2.5 h-2.5 rotate-90 text-blue-400" /></button>
                                 <button onClick={() => setPan(p => ({ ...p, y: p.y + 1 }))} className="p-0.5 hover:bg-white/10 rounded-sm"><ChevronDown className="w-2.5 h-2.5 text-blue-400" /></button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
                  <HUDItem icon={Orbit} value={`${(orbit.ry * 57.3).toFixed(1)}°`} label="Rotation" />
                  <HUDItem icon={Layers} value={savedSettings.shading} label="Mode" highlight />
                </div>
                
                <AnimatePresence initial={false}>
                  {showWireframeOverlay && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)' }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="overflow-hidden bg-white/5 rounded-lg p-2 mt-2 border border-white/10"
                    >
                      {/* Independent Wireframe Color Swatches */}
                      <div className="pb-2">
                         <div className="flex items-center justify-between">
                           <span className="text-[7px] text-white/50 uppercase tracking-[0.1em] font-black">Line_Color</span>
                           <div className="flex items-center gap-2 pointer-events-auto">
                              {WIREFRAME_COLORS.map(color => (
                                <button
                                  key={color}
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     setSavedSettings(prev => ({ ...prev, wireframeColor: color }));
                                     setTempSettings(prev => ({ ...prev, wireframeColor: color }));
                                  }}
                                  className={`w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 active:scale-95 transition-transform ${savedSettings.wireframeColor === color ? 'ring-2 ring-white/50 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                           </div>
                         </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 space-y-3">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Box className="w-3 h-3 text-blue-400" style={{ color: savedSettings.wireframeColor }} />
                              <span className="text-[7px] text-white/50 tracking-[0.1em] font-black uppercase">WIREFRAME_ACTIVE</span>
                           </div>
                           <span className="text-[9px] font-mono" style={{ color: savedSettings.wireframeColor }}>{savedSettings.wireframeThickness}px</span>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {savedSettings.shading === "Stress" && simResult && (
                   <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-[7px] text-white/30 uppercase tracking-[0.1em] font-black">
                         <span>MIN_LOAD</span>
                         <span className="text-white/10">---</span>
                         <span>MAX_LOAD</span>
                      </div>
                      <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-emerald-500 via-yellow-400 to-red-600 rounded-full relative shadow-inner">
                         <div className="absolute top-0 left-[85%] w-px h-full bg-white/40 shadow-[0_0_8px_white]" />
                      </div>
                   </div>
                )}

                <footer className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between opacity-50">
                   <div className="flex flex-col">
                      <div className="w-12 h-0.5 bg-blue-500/20 relative">
                         <div className="absolute -top-1 left-0 w-0.5 h-2 bg-blue-500/40" />
                         <div className="absolute -top-1 right-0 w-0.5 h-2 bg-blue-500/40" />
                      </div>
                      <span className="text-[6px] text-white/40 uppercase tracking-widest mt-1">Scale: {Math.round(10/zoom)}mm</span>
                   </div>
                   <span className="text-[6px] text-white/40 uppercase tracking-widest">Grid: {gridSize}mm</span>
                </footer>
              </motion.div>
           </motion.div>

           {/* Orientation Gizmo */}
           <div className="absolute bottom-6 right-6 w-20 h-20 pointer-events-none opacity-40 select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <g transform={`translate(50, 50) rotate(${orbit.ry * 57.3}) scale(${Math.max(0.2, Math.cos(orbit.rx))})`}>
                   <circle cx="0" cy="0" r="40" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.1" />
                   <g className="transition-all duration-300">
                      <line x1="0" y1="0" x2="38" y2="0" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="38" cy="0" r="2.5" fill="#ef4444" />
                      <text x="46" y="4" fontSize="11" fill="#ef4444" fontWeight="900" textAnchor="middle" className="font-mono">X</text>
                   </g>
                   <g className="transition-all duration-300">
                      <line x1="0" y1="0" x2="0" y2="-38" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="0" cy="-38" r="2.5" fill="#22c55e" />
                      <text x="0" y="-46" fontSize="11" fill="#22c55e" fontWeight="900" textAnchor="middle" className="font-mono">Y</text>
                   </g>
                </g>
              </svg>
           </div>
           
           {/* SVG Canvas Renderer */}
           <svg 
             className={`w-full h-full text-blue-400 select-none ${activeViewportTool === 'zoom' ? (isDragging ? 'cursor-ns-resize' : 'cursor-zoom-in') : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
             viewBox={`${-pan.x + 100 - 100/zoom} ${-pan.y + 100 - 100/zoom} ${200/zoom} ${200/zoom}`}
             shapeRendering={savedSettings.antiAliasing ? "geometricPrecision" : "crispEdges"}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerLeave={handlePointerUp}
             onPointerCancel={handlePointerUp}
             onWheel={(e) => {
                 const d = e.deltaY;
                 const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (1 - d * 0.001)));
                 setZoom(nextZoom);
                 
                 if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current);
                 wheelTimeout.current = window.setTimeout(() => commitState({ zoom: nextZoom }), 400);
             }}
           >
             {/* Origin Grid */}
             {showGrid && (
               <g className="opacity-[0.15]">
                  <line x1="-1000" y1="100" x2="1000" y2="100" stroke="#3b82f6" strokeWidth={0.2 / zoom} strokeDasharray="1 1" />
                  <line x1="100" y1="-1000" x2="100" y2="1000" stroke="#3b82f6" strokeWidth={0.2 / zoom} strokeDasharray="1 1" />
                  <circle cx="100" cy="100" r="1.5" fill="#3b82f6" />
               </g>
             )}

             {/* Drag Feedback Indicators */}
             {isDragging && (
               <g className="pointer-events-none opacity-40">
                  {activeViewportTool === 'pan' && (
                    <g transform={`translate(${100}, ${100})`}>
                       <circle cx="0" cy="0" r="4" fill="none" stroke="#3b82f6" strokeWidth="0.8" />
                       <path d="M-50 0 L50 0 M0 -50 L0 50" stroke="#3b82f6" strokeWidth="0.2" strokeDasharray="2 2" className="animate-pulse" />
                       <g transform="translate(6, -6)">
                          <rect x="0" y="-8" width="40" height="10" fill="#09090b" stroke="#3b82f6" strokeWidth="0.2" rx="1" />
                          <text x="4" y="-1" fontSize="5" fill="#3b82f6" fontWeight="bold">X:{pan.x.toFixed(1)} Y:{pan.y.toFixed(1)}</text>
                       </g>
                    </g>
                  )}
                  {activeViewportTool === 'zoom' && (
                    <g transform={`translate(${100}, ${100})`}>
                       <circle cx="0" cy="0" r={zoom * 12} fill="none" stroke="#3b82f6" strokeWidth="0.5" className="animate-pulse" />
                    </g>
                  )}
               </g>
             )}

             {/* Mesh Render Layer */}
             <g>
                {geometryData.faces.map((face, i) => (
                  <motion.path 
                    key={i}
                    d={face.path}
                    fill={face.fill}
                    stroke={savedSettings.shading === "Wireframe" ? savedSettings.wireframeColor : (showWireframeOverlay ? savedSettings.wireframeColor : "transparent")}
                    strokeWidth={savedSettings.shading === "Wireframe" ? (savedSettings.wireframeThickness / zoom) : (showWireframeOverlay ? currentStrokeWidth : 0)}
                    strokeLinejoin="round"
                    className="transition-colors hover:stroke-blue-400 cursor-crosshair"
                  />
                ))}
             </g>

             {/* Dynamic Annotations Layer */}
             <g className="text-emerald-400 text-[5px] font-black opacity-60">
                <line x1="100" y1="120" x2={geometryData.projectedBase[0].x} y2={geometryData.projectedBase[0].y} stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
                <text x={100 + (geometryData.projectedBase[0].x - 100)/2} y={120 + (geometryData.projectedBase[0].y - 120)/2 + 1.5} textAnchor="middle" fill="currentColor">R{radius}</text>
                
                <line x1="175" y1="120" x2="175" y2={120 - extrude} stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="1 0.5" />
                <text x="178" y={120 - extrude/2 + 1.5} fill="#f59e0b" className="font-bold">H{extrude}</text>
             </g>
           </svg>

           {/* Viewport Top Actions */}
           <div className="absolute top-4 right-4 flex gap-1 z-10">
              <ActionButton onClick={() => setShowWireframeOverlay(!showWireframeOverlay)} active={showWireframeOverlay} title="Toggle Wireframe">
                 <Box className="w-3 h-3" />
              </ActionButton>
              <ActionButton onClick={undo} disabled={historyIndex === 0} title="Undo">
                 <Undo2 className="w-3 h-3" />
              </ActionButton>
              <ActionButton onClick={redo} disabled={historyIndex === history.length - 1} title="Redo">
                 <Redo2 className="w-3 h-3" />
              </ActionButton>
              <div className="w-px h-4 bg-white/5 mx-1" />
              <ToggleButton active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Grid Toggle">
                 <Grid3X3 className="w-3 h-3" />
              </ToggleButton>
              <ActionButton onClick={handleOpenSettings} active={isSettingsOpen} title="Config">
                 <Settings2 className="w-3 h-3" />
              </ActionButton>
              <ActionButton onClick={() => setIsPreviewModalOpen(true)} variant="danger" title={t("cad.export")}>
                 <Download className="w-3 h-3" />
              </ActionButton>
           </div>

           {/* Central Navigation Cluster */}
           <ToolCluster 
             active={activeViewportTool} 
             onSelect={setActiveViewportTool} 
             onResetPan={() => setPan({ x: 0, y: 0 })} 
           />

           {/* Settings Overlay */}
           <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-6"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 30 }}
                    className="w-full max-w-sm bg-studio-panel text-studio-text rounded-3xl shadow-2xl overflow-hidden flex flex-col md-elevation-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <header className="px-6 py-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-studio-accent/10 rounded-full"><Settings2 className="w-5 h-5 text-studio-accent" /></div>
                        <span className="font-bold text-sm tracking-wide">Viewport Protocol</span>
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-studio-dots rounded-full text-studio-muted hover:text-studio-text transition-colors"><X className="w-5 h-5" /></button>
                    </header>

                    <div className="px-6 pb-6 space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs text-studio-text font-bold">Projection Quality</label>
                        <div className="flex bg-studio-bg rounded-2xl p-1 shadow-inner">
                           {(['Low', 'Medium', 'High'] as const).map(res => (
                             <button key={res} onClick={() => setTempSettings({ ...tempSettings, resolution: res })} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${tempSettings.resolution === res ? 'bg-studio-panel shadow-md text-studio-accent' : 'text-studio-muted hover:text-studio-text hover:bg-white/5'}`}>{res}</button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs text-studio-text font-bold">Shading Algorithm</label>
                        <div className="grid grid-cols-2 gap-3">
                           {(['Wireframe', 'Solid', 'Realistic', 'Stress'] as const).map(mode => (
                             <button 
                                key={mode} 
                                onClick={() => setTempSettings({ ...tempSettings, shading: mode })}
                                className={`py-4 px-4 text-xs font-bold rounded-2xl border transition-all text-left flex items-center justify-between group ${tempSettings.shading === mode ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-bg border-transparent text-studio-muted hover:bg-studio-dots hover:text-studio-text'}`}
                             >
                               {mode}
                               {tempSettings.shading === mode && <Check className="w-4 h-4" />}
                             </button>
                           ))}
                        </div>
                      </div>
                       <div className="flex flex-row items-center justify-between p-4 bg-studio-bg rounded-2xl focus-within:ring-2 focus-within:ring-studio-accent transition-shadow">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="aa-toggle" className="text-xs font-bold text-studio-text cursor-pointer">Vector Smoothing</label>
                          <span className="text-[10px] text-studio-muted">Enable high-fidelity anti-aliasing</span>
                        </div>
                        <input 
                           id="aa-toggle"
                           type="checkbox" 
                           checked={tempSettings.antiAliasing}
                           onChange={e => setTempSettings({ ...tempSettings, antiAliasing: e.target.checked })}
                           className="w-12 h-6 appearance-none bg-studio-border rounded-full checked:bg-studio-accent transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full checked:after:translate-x-6 after:transition-all hover:bg-studio-border/80"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label htmlFor="wf-slider" className="text-xs text-studio-text font-bold">Wireframe Weight</label>
                           <span className="text-sm font-bold text-studio-accent">{tempSettings.wireframeThickness.toFixed(1)}px</span>
                        </div>
                        <div className="bg-studio-bg p-4 rounded-2xl">
                          <input 
                             id="wf-slider"
                             type="range" 
                             min="0.1" 
                             max="5.0" 
                             step="0.1"
                             value={tempSettings.wireframeThickness}
                             onChange={e => {
                               const val = parseFloat(e.target.value);
                               setTempSettings({ ...tempSettings, wireframeThickness: val });
                               setSavedSettings(prev => ({ ...prev, wireframeThickness: val }));
                             }}
                             className="w-full h-2 bg-studio-border rounded-lg appearance-none cursor-pointer accent-studio-accent hover:accent-studio-accent/80 transition-all"
                          />
                        </div>
                      </div>

                    </div>

                    <footer className="p-4 bg-studio-bg border-t border-white/5 flex gap-3 rounded-b-3xl">
                      <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 text-sm font-bold uppercase rounded-xl hover:bg-studio-dots text-studio-muted hover:text-studio-text transition-colors min-h-[48px]">Discard</button>
                      <button onClick={handleSaveSettings} className="flex-1 py-4 bg-studio-accent text-white text-sm font-bold uppercase rounded-xl md-elevation-1 hover:md-elevation-2 active:scale-95 transition-all min-h-[48px]">Apply_Settings</button>
                    </footer>
                  </motion.div>
                </motion.div>
              )}
           </AnimatePresence>

           {/* Preview Modal */}
           <AnimatePresence>
              {isPreviewModalOpen && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6"
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-studio-panel border border-studio-border rounded-2xl shadow-3xl overflow-hidden flex flex-col md-elevation-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <header className="px-6 py-4 border-b border-studio-border flex justify-between items-center bg-studio-bg/50">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-studio-accent/10 rounded-xl text-studio-accent">
                           <Layers className="w-5 h-5" />
                         </div>
                         <div>
                           <h3 className="text-sm font-bold text-studio-text">Export Preview</h3>
                           <p className="text-xs text-studio-muted">Verify orientation and scale before export</p>
                         </div>
                       </div>
                       <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-studio-dots rounded-full text-studio-muted hover:text-studio-text transition-colors"><X className="w-5 h-5" /></button>
                    </header>

                    <div className="p-6 flex flex-col gap-4">
                       <div className="w-full aspect-video bg-studio-bg rounded-xl border border-studio-border/50 overflow-hidden relative flex items-center justify-center">
                          <svg 
                            className="w-full h-full text-studio-accent drop-shadow-lg"
                            viewBox="0 0 200 200"
                            shapeRendering="geometricPrecision"
                          >
                             <g transform="scale(0.8) translate(25, 25)">
                               {geometryData.faces.map((face, i) => (
                                 <path 
                                   key={i}
                                   d={face.path}
                                   fill="none"
                                   stroke="currentColor"
                                   strokeWidth={0.5}
                                   strokeLinejoin="round"
                                   className="opacity-70"
                                 />
                               ))}
                             </g>
                          </svg>
                          <div className="absolute bottom-4 left-4 flex gap-2">
                             <div className="px-3 py-1.5 bg-studio-panel/80 backdrop-blur border border-studio-border/50 text-xs text-studio-text rounded-lg tracking-wider font-bold shadow-lg">
                                FORMAT: <span className="text-studio-accent">{savedSettings.outputFormat}</span>
                             </div>
                          </div>
                          
                          <div className="absolute top-4 right-4 flex gap-2">
                             <div className="px-2 py-1 bg-studio-panel/80 backdrop-blur border border-studio-border/50 text-[10px] text-emerald-500 rounded font-mono">
                                {geometryData.mesh.vertices.length} VERTS
                             </div>
                          </div>
                          
                           {/* Orientation Gizmo inside modal */}
                           <div className="absolute bottom-4 right-4 w-12 h-12 pointer-events-none opacity-60">
                              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                                <g transform={`translate(50, 50) rotate(${orbit.ry * 57.3}) scale(${Math.max(0.2, Math.cos(orbit.rx))})`}>
                                   <g>
                                      <line x1="0" y1="0" x2="38" y2="0" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                                      <text x="46" y="4" fontSize="14" fill="#ef4444" fontWeight="bold" textAnchor="middle">X</text>
                                   </g>
                                   <g>
                                      <line x1="0" y1="0" x2="0" y2="-38" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                                      <text x="0" y="-46" fontSize="14" fill="#22c55e" fontWeight="bold" textAnchor="middle">Y</text>
                                   </g>
                                </g>
                              </svg>
                           </div>
                       </div>
                    </div>

                    <footer className="px-6 py-5 border-t border-studio-border flex gap-4 bg-studio-bg/30">
                       <button onClick={() => setIsPreviewModalOpen(false)} className="flex-1 py-3 text-sm font-bold uppercase rounded-xl border border-studio-border hover:bg-studio-dots text-studio-text transition-colors">Cancel</button>
                       <button onClick={() => { setIsPreviewModalOpen(false); handleExport(); }} className="flex-1 py-3 bg-studio-accent text-white text-sm font-bold uppercase rounded-xl md-elevation-1 hover:md-elevation-2 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-[0_10px_20px_-5px_var(--color-studio-accent)]">
                         <Download className="w-4 h-4" /> Finalize Export
                       </button>
                    </footer>
                  </motion.div>
                </motion.div>
              )}
           </AnimatePresence>
        </main>

        {/* Global Action Toolbar */}
        <div className="w-16 md:w-20 bg-studio-panel border-l border-studio-border/50 flex flex-col py-6 gap-6 shrink-0 items-center md-elevation-1 z-10">
          <ToolIcon icon={MousePointer2} active />
          <ToolIcon icon={Compass} />
          <ToolIcon icon={Ruler} />
          <div className="w-8 h-px bg-studio-border/50 my-2 rounded-full" />
          <ToolIcon icon={Layers} />
        </div>
      </div>
    </div>
  );
}

// --- Internal Components ---
function TreeItem({ name, icon: Icon, active }: { name: string, icon: any, active?: boolean }) {
  return (
    <div className={`group flex items-center gap-3 p-3 flex-1 rounded-xl cursor-pointer transition-all ${active ? 'bg-studio-accent/10 text-studio-accent font-bold' : 'text-studio-muted hover:text-studio-text hover:bg-studio-dots'}`}>
      <Icon className={`w-4 h-4 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
      <span className="text-xs truncate tracking-wide">{name}</span>
    </div>
  );
}

function ToolIcon({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <button className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-studio-accent text-white shadow-lg md-elevation-2 scale-110' : 'text-studio-muted hover:text-studio-text hover:bg-studio-dots'}`}>
      <Icon className="w-5 h-5 stroke-[1.5px]" />
    </button>
  );
}

function ParametricInput({ label, value, onChange, onCommit, min = 1, max = 500 }: { label: string, value: number, onChange: (v: number) => void, onCommit: () => void, min?: number, max?: number }) {
  return (
     <div className="flex flex-col gap-1.5 text-xs text-studio-muted uppercase font-bold tracking-wider mb-4">
        <div className="flex justify-between items-center px-1">
           <span className="text-studio-text">{label}</span>
           <span className="text-studio-muted text-[10px] bg-studio-dots px-2 py-0.5 rounded-full">{value}mm</span>
        </div>
        <input 
           type="number" 
           value={value} 
           onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))} 
           onBlur={() => onCommit()} 
           onKeyDown={e => e.key === 'Enter' && onCommit()} 
           className="w-full bg-studio-dots hover:bg-studio-border/20 border-b-2 border-transparent focus:border-studio-accent px-4 py-3 rounded-t-xl text-right text-studio-text focus:outline-none transition-colors font-mono font-bold" 
        />
     </div>
  );
}

function HUDItem({ icon: Icon, value, label, highlight }: { icon: any, value: string, label: string, highlight?: boolean }) {
   return (
      <div className="flex flex-col gap-1 min-w-[60px]">
         <span className="text-[9px] text-studio-muted uppercase font-bold tracking-widest">{label}</span>
         <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-studio-accent' : 'text-studio-muted'}`} />
            <span className={`text-xs font-mono select-none ${highlight ? 'text-studio-accent font-black' : 'text-studio-text font-medium'}`}>{value}</span>
         </div>
      </div>
   );
}

function ToolCluster({ active, onSelect, onResetPan }: { active: string, onSelect: (v: any) => void, onResetPan: () => void }) {
   return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-studio-panel/90 backdrop-blur-xl border border-studio-border/50 rounded-full p-2 md-elevation-2 z-10 gap-2">
        <NavButton active={active === 'orbit'} onClick={() => onSelect('orbit')} title="Orbit Mode">
           <Orbit className="w-5 h-5" />
        </NavButton>
        <div className="relative group/pan">
           <NavButton active={active === 'pan'} onClick={() => onSelect('pan')} onDoubleClick={onResetPan} title="Pan View (dbl-click to center)">
              <Hand className="w-5 h-5" />
           </NavButton>
           {active === 'pan' && (
              <button 
                onClick={onResetPan} 
                className="absolute -top-1 -right-1 w-5 h-5 bg-studio-accent rounded-full flex items-center justify-center text-white border-2 border-studio-panel hover:scale-125 transition-transform shadow-sm"
              >
                <X className="w-3 h-3 stroke-[3px]" />
              </button>
           )}
        </div>
        <NavButton active={active === 'zoom'} onClick={() => onSelect('zoom')} title="Zoom Adjustment">
           <ZoomIn className="w-5 h-5" />
        </NavButton>
      </div>
   );
}

function NavButton({ children, active, onClick, onDoubleClick, title }: { children: React.ReactNode, active: boolean, onClick: () => void, onDoubleClick?: () => void, title: string }) {
   return (
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`p-3 rounded-full transition-all duration-300 ${active ? 'bg-studio-accent text-white shadow-md md-elevation-1 scale-110' : 'text-studio-muted hover:text-studio-text hover:bg-studio-dots'}`}
        title={title}
      >
        {children}
      </button>
   );
}

function ActionButton({ children, onClick, disabled, active, variant, title }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, active?: boolean, variant?: 'danger', title?: string }) {
   return (
      <button 
         onClick={onClick} 
         disabled={disabled}
         className={`p-3 border rounded-full transition-all flex items-center justify-center shrink-0 ${disabled ? 'opacity-30 cursor-not-allowed' : active ? 'bg-studio-accent/20 border-studio-accent text-studio-accent font-bold md-elevation-1' : variant === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white dark:text-red-400 dark:hover:text-white hover:border-red-500 shadow-sm' : 'bg-studio-bg border-studio-border text-studio-muted hover:bg-studio-dots hover:text-studio-text shadow-sm active:scale-95'}`}
         title={title}
      >
         {children}
      </button>
   );
}

function ToggleButton({ children, active, onClick, title }: { children: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
   return (
      <button 
         onClick={onClick} 
         className={`p-3 border rounded-full transition-all flex items-center justify-center shrink-0 ${active ? 'bg-studio-accent border-studio-accent text-white md-elevation-1' : 'bg-studio-bg border-studio-border text-studio-muted hover:bg-studio-dots hover:text-studio-text'}`}
         title={title}
      >
         {children}
      </button>
   );
}
