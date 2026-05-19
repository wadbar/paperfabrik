/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
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

interface RenderSettings {
  resolution: 'Low' | 'Medium' | 'High';
  antiAliasing: boolean;
  outputFormat: 'PNG' | 'JPG' | 'STL' | 'OBJ';
  shading: "Wireframe" | "Solid" | "Realistic" | "Stress";
}

export function CADViewport() {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry("CADViewport");
  const [radius, setRadius] = useState(60);
  const [sides, setSides] = useState(6);
  const [extrude, setExtrude] = useState(40);
  const [activeViewportTool, setActiveViewportTool] = useState<'orbit' | 'pan' | 'zoom'>('orbit');

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [orbit, setOrbit] = useState({ rx: 0, ry: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // History State
  const [history, setHistory] = useState([
    { radius: 60, sides: 6, extrude: 40, pan: { x: 0, y: 0 }, orbit: { rx: 0, ry: 0 }, zoom: 1 }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const wheelTimeout = React.useRef<number | null>(null);

  const commitState = React.useCallback((overrideState?: any) => {
     const st = overrideState || { radius, sides, extrude, pan, orbit, zoom };
     if (JSON.stringify(st) === JSON.stringify(history[historyIndex])) return;
     
     const newHistory = history.slice(0, historyIndex + 1);
     newHistory.push(st);
     setHistory(newHistory);
     setHistoryIndex(newHistory.length - 1);
  }, [radius, sides, extrude, pan, orbit, zoom, history, historyIndex]);

  useEffect(() => {
    return () => {
        if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current);
    }
  }, []);

  const undo = () => {
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
    }
  };

  const redo = () => {
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
    }
  };

  // Analysis State
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Render Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'OBJ',
    shading: "Solid"
  });
  const [savedSettings, setSavedSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'OBJ',
    shading: "Solid"
  });

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
        const result = await computeClient.simulateStaticLoad(geometryData.mesh);
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
      const response = await fetch("/api/cad/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: savedSettings.outputFormat,
          projectData: { radius, sides, extrude, resolution: savedSettings.resolution }
        })
      });
      
      if (savedSettings.outputFormat === "STL" || savedSettings.outputFormat === "OBJ") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paperfabrik_export_${Date.now()}.${savedSettings.outputFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        console.log("Export Result:", result);
      }
      recordEvent("EXPORT_COMPLETED", { format: savedSettings.outputFormat });
    } catch (err: any) {
      recordEvent("EXPORT_FAILED", { error: err.message });
    }
  };

  const currentStrokeWidth = useMemo(() => {
    switch (savedSettings.resolution) {
      case 'Low': return 1.5;
      case 'Medium': return 1.0;
      case 'High': return 0.5;
      default: return 1.0;
    }
  }, [savedSettings.resolution]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeViewportTool !== 'pan' && activeViewportTool !== 'orbit' && activeViewportTool !== 'zoom') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (activeViewportTool !== 'pan' && activeViewportTool !== 'orbit' && activeViewportTool !== 'zoom') return;
    
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    if (activeViewportTool === 'pan') {
      setPan(prev => ({ x: prev.x + dx * 0.5 / zoom, y: prev.y + dy * 0.5 / zoom }));
    } else if (activeViewportTool === 'orbit') {
      setOrbit(prev => ({ rx: prev.rx + dy * 0.01, ry: prev.ry + dx * 0.01 }));
    } else if (activeViewportTool === 'zoom') {
      setZoom(prev => Math.max(0.1, Math.min(5, prev * (1 - dy * 0.01))));
    }
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeViewportTool !== 'pan' && activeViewportTool !== 'orbit' && activeViewportTool !== 'zoom') return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    commitState();
  };

  const geometryData = useMemo(() => {
    // Industrial Parametric Generation via GeometryCompute
    const { base, top } = ProjectionCompute.generateExtrusion(sides, radius, extrude);
    const vertices = [...base, ...top];
    const faces: any[] = [];
    
    // Side faces (Triangulated for simulation accuracy)
    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        faces.push({ indices: [i, next, next + sides] });
        faces.push({ indices: [next, next + sides, i + sides] });
    }
    
    // Top face fan
    for (let i = 1; i < sides - 1; i++) {
        faces.push({ indices: [sides, sides + i, sides + i + 1] });
    }

    const mesh = new Mesh(vertices, faces);
    mesh.computeNormals();

    const origin = { x: 100, y: 120 };
    const lightDir = new Vector3(1, -1, 1).normalize();

    const cosRX = Math.cos(orbit.rx);
    const sinRX = Math.sin(orbit.rx);
    const cosRY = Math.cos(orbit.ry);
    const sinRY = Math.sin(orbit.ry);

    const rotateV = (v: Vector3) => {
        // RotX
        let y1 = v.y * cosRX - v.z * sinRX;
        let z1 = v.y * sinRX + v.z * cosRX;
        // RotY
        let x2 = v.x * cosRY + z1 * sinRY;
        let z2 = -v.x * sinRY + z1 * cosRY;
        return new Vector3(x2, y1, z2);
    };

    // We sort the faces so that those furthest away are drawn first (painters algorithm)
    // To do this we first calculate rotated coordinates for all vertices to find the average Z of each face.
    const rotatedVertices = mesh.vertices.map((v, idx) => {
        let displacedV = v;
        if (simResult && (savedSettings.shading === "Stress" || isSimulating)) {
             // Factor in displacement for visualization (exaggerated for effect)
             displacedV = v.add(simResult.vertexDisplacements[idx].mul(15)); 
        }
        return rotateV(displacedV);
    });

    const facesWithDepth = mesh.faces.map(face => {
        let depth = face.indices.reduce((sum, idx) => sum + rotatedVertices[idx].z, 0) / face.indices.length;
        // Also rotate the normal for lighting calculation
        // since mesh normals are generated without orbit
        const rotatedNormal = face.normal ? rotateV(face.normal).normalize() : face.normal;
        return { ...face, depth, rotatedNormal };
    });

    facesWithDepth.sort((a, b) => b.depth - a.depth);

    const projectedFaces = facesWithDepth.map(face => {
      const projectedPoints = face.indices.map(idx => {
        const p = ProjectionCompute.project(rotatedVertices[idx]);
        return { x: origin.x + p.x, y: origin.y + p.y };
      });

      const intensity = face.rotatedNormal ? Math.max(0.15, face.rotatedNormal.dot(lightDir)) : 0.4;
      
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
            // HSL Gradient: Blue (240) to Red (0)
            const hue = Math.max(0, 240 - (t * 240));
            fill = `hsla(${hue.toFixed(0)}, 85%, 50%, ${0.6 + intensity * 0.4})`;
          } else {
            // Fallback if Stress mode selected but no result
            fill = `rgba(100, 100, 100, ${intensity * 0.5})`;
          }
      } else if (savedSettings.shading === "Wireframe") {
          fill = "#0d1117"; // Match background for Hidden Line Removal (HLR)
      }

      return {
        path: ProjectionCompute.pointsToPath(projectedPoints),
        intensity,
        points: projectedPoints,
        fill
      };
    });

    return {
      faces: projectedFaces,
      basePath: ProjectionCompute.pointsToPath(base.map(v => {
        const p = ProjectionCompute.project(rotateV(v));
        return { x: origin.x + p.x, y: origin.y + p.y };
      })),
      projectedBase: base.map(v => {
        const p = ProjectionCompute.project(rotateV(v));
        return { x: origin.x + p.x, y: origin.y + p.y };
      }),
      mesh
    };
  }, [radius, sides, extrude, orbit, simResult, savedSettings.shading]);

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-blue-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex gap-px bg-studio-dots min-h-0 overflow-hidden">
        {/* Parametric Tree & Properties */}
        <div className="w-32 bg-[#0a0a0b] flex flex-col p-2 gap-2 shrink-0 overflow-y-auto border-r border-white/5">
          <span className="text-[7px] text-blue-400 uppercase font-black mb-1 flex items-center gap-1">
             <Layers className="w-3 h-3" /> {t("cad.tree")}
          </span>
          <TreeItem name="Sketch_01" icon={MousePointer2} active />
          
          <div className="pl-3 py-1 space-y-2 border-b border-white/5 pb-3">
             <div className="flex flex-col gap-1 text-[8px] text-white/70">
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Link className="w-2 h-2"/> Radius</span>
                   <input 
                      type="number" 
                      value={radius} 
                      onChange={e => setRadius(Math.max(1, Number(e.target.value)))} 
                      onBlur={commitState} 
                      onKeyDown={e => e.key === 'Enter' && commitState()} 
                      className="w-10 bg-black/40 border border-white/10 hover:border-blue-500/50 px-1 rounded text-right focus:outline-none focus:border-blue-500 transition-colors" 
                   />
                </div>
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Link className="w-2 h-2"/> Sides</span>
                   <input 
                      type="number" 
                      value={sides} 
                      onChange={e => setSides(Math.min(32, Math.max(3, Number(e.target.value))))} 
                      onBlur={commitState} 
                      onKeyDown={e => e.key === 'Enter' && commitState()} 
                      className="w-10 bg-black/40 border border-white/10 hover:border-blue-500/50 px-1 rounded text-right focus:outline-none focus:border-blue-500 transition-colors" 
                   />
                </div>
             </div>
          </div>

          <TreeItem name="Extrude_Pad" icon={Box} />
          
          <div className="pl-3 py-1 space-y-2 border-b border-white/5 pb-3 mb-2">
             <div className="flex flex-col gap-1 text-[8px] text-white/70">
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Box className="w-2 h-2"/> Length</span>
                   <input 
                      type="number" 
                      value={extrude} 
                      onChange={e => setExtrude(Math.max(1, Number(e.target.value)))} 
                      onBlur={commitState} 
                      onKeyDown={e => e.key === 'Enter' && commitState()} 
                      className="w-10 bg-black/40 border border-white/10 hover:border-blue-500/50 px-1 rounded text-right focus:outline-none focus:border-blue-500 transition-colors" 
                   />
                </div>
             </div>
          </div>

          <div className="mt-2 space-y-3">
             <span className="text-[7px] text-emerald-400 uppercase font-black px-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> MESH ANALYSIS
             </span>
             <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between text-[8px] text-white/30 uppercase">
                  <span>Vertices</span>
                  <span className="text-white/60">{geometryData.mesh.vertices.length}</span>
                </div>
                <div className="flex justify-between text-[8px] text-white/30 uppercase">
                  <span>Faces</span>
                  <span className="text-white/60">{geometryData.mesh.faces.length}</span>
                </div>
                <div className="flex justify-between text-[8px] text-white/30 uppercase">
                  <span>Normal Ref</span>
                  <span className="text-emerald-500/80">Aligned</span>
                </div>
                <div className="flex justify-between text-[8px] text-white/30 uppercase">
                  <span>Service</span>
                  <span className="text-blue-400/80">Compute V4</span>
                </div>
             </div>
          </div>

          <div className="mt-4 px-1 space-y-2 border-t border-white/5 pt-4">
             <span className="text-[7px] text-amber-500 uppercase font-black flex items-center gap-1">
                <Wind className="w-3 h-3" /> {t("sim.title")}
             </span>
             {simResult ? (
                 <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-1.5 rounded">
                        <div className="flex justify-between text-[8px] text-amber-200/60 uppercase">
                            <span>{t("sim.peak_stress")}</span>
                            <span className="font-bold">{simResult.maxStress.toFixed(3)} MPa</span>
                        </div>
                        <div className="h-1 w-full bg-black/40 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                                className="h-full bg-amber-500"
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => setSimResult(null)}
                        className="w-full py-1 text-[7px] text-white/40 uppercase hover:text-white transition-colors"
                    >
                        Clear Simulation
                    </button>
                 </div>
             ) : (
                 <button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-amber-400 text-[8px] font-black uppercase rounded flex items-center justify-center gap-2 transition-all group"
                 >
                    {isSimulating ? <Wind className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3 group-hover:fill-current" />}
                    {isSimulating ? t("sim.status_solving") : t("sim.run")}
                 </button>
             )}
          </div>
        </div>

        {/* CAD Canvas */}
        <div className="flex-1 relative bg-[#0d1117] flex items-center justify-center overflow-hidden">
           {showGrid && (
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: `${gridSize}px ${gridSize}px` }} />
           )}
           
           {/* Navigation HUD */}
           <div className="absolute bottom-4 left-4 pointer-events-none flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 px-3 flex flex-col gap-1 shadow-2xl">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Navigation HUD</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDragging ? 'bg-blue-500 animate-pulse' : 'bg-white/20'}`} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 transition-all">
                    <ZoomIn className="w-2.5 h-2.5 text-blue-400/60" />
                    <span className="text-[10px] font-mono text-white/80 select-none tracking-tight">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-2.5 h-2.5 text-blue-400/60" />
                    <span className="text-[9px] font-mono text-white/50 select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[50px]">{pan.x.toFixed(0)},{pan.y.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Orbit className="w-2.5 h-2.5 text-blue-400/60" />
                    <span className="text-[9px] font-mono text-white/50 select-none">{(orbit.ry * 57.3).toFixed(0)}°</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-2.5 h-2.5 text-blue-400/60" />
                    <span className="text-[8px] font-mono text-blue-400/80 select-none uppercase tracking-tighter truncate max-w-[45px]">{savedSettings.shading}</span>
                  </div>
                </div>
                {savedSettings.shading === "Stress" && simResult && (
                   <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-[7px] text-white/40 uppercase tracking-widest font-black">
                         <span>Low</span>
                         <span>Stress Legend</span>
                         <span>High</span>
                      </div>
                      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-green-400 via-yellow-400 to-red-500 rounded-full" />
                   </div>
                )}
                <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <div className="w-10 h-0.5 bg-blue-500/40 relative">
                         <div className="absolute top-0 left-0 w-0.5 h-1 bg-blue-500/40 -translate-y-1/2" />
                         <div className="absolute top-0 right-0 w-0.5 h-1 bg-blue-500/40 -translate-y-1/2" />
                      </div>
                      <span className="text-[6px] text-white/20 uppercase tracking-widest mt-0.5">Scale: {Math.round(10/zoom)}mm</span>
                   </div>
                   <span className="text-[6px] text-white/20 uppercase tracking-widest">Grid: {gridSize}mm</span>
                </div>
              </div>
           </div>

           {/* Orientation Gizmo (Compass) */}
           <div className="absolute bottom-4 right-4 w-16 h-16 pointer-events-none opacity-60">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                <g transform={`translate(50, 50) rotate(${orbit.ry * 57.3}) scale(${Math.cos(orbit.rx)})`}>
                   <circle cx="0" cy="0" r="40" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
                   {/* X Axis */}
                   <line x1="0" y1="0" x2="35" y2="0" stroke="#ef4444" strokeWidth="1.5" />
                   <text x="40" y="4" fontSize="12" fill="#ef4444" fontWeight="bold" textAnchor="middle">X</text>
                   {/* Y Axis (actually mapped to Z in most CAD, but Y in 2D space) */}
                   <line x1="0" y1="0" x2="0" y2="-35" stroke="#22c55e" strokeWidth="1.5" />
                   <text x="0" y="-40" fontSize="12" fill="#22c55e" fontWeight="bold" textAnchor="middle">Y</text>
                </g>
              </svg>
           </div>
           
           <svg 
             className={`w-full h-full text-blue-400 ${activeViewportTool === 'zoom' ? (isDragging ? 'cursor-ns-resize' : 'cursor-zoom-in') : activeViewportTool === 'pan' || activeViewportTool === 'orbit' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
             viewBox={`${-pan.x + 100 - 100/zoom} ${-pan.y + 100 - 100/zoom} ${200/zoom} ${200/zoom}`}
             shapeRendering={savedSettings.antiAliasing ? "auto" : "crispEdges"}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerLeave={handlePointerUp}
             onPointerCancel={handlePointerUp}
             onWheel={(e) => {
                 const newZoom = Math.max(0.1, Math.min(5, zoom * (1 - e.deltaY * 0.001)));
                 setZoom(newZoom);
                 
                 if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current);
                 wheelTimeout.current = window.setTimeout(() => {
                     commitState({ radius, sides, extrude, pan, orbit, zoom: newZoom });
                 }, 400);
             }}
           >
             {/* Origin/Axes */}
             {showGrid && (
               <g className="opacity-40">
                 <path d="M100 20 L100 180 M20 100 L180 100" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" />
                 <circle cx="100" cy="100" r="1.5" fill="#3b82f6" />
               </g>
             )}

             {/* Manipulation Visual Indicators */}
             {isDragging && (
               <g opacity="0.6">
                 {activeViewportTool === 'pan' && (
                   <g transform={`translate(${100}, ${100})`}>
                      <circle cx="0" cy="0" r="3" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                      <path d="M-10 0 L10 0 M0 -10 L0 10" stroke="#3b82f6" strokeWidth="0.5" />
                   </g>
                 )}
                 {activeViewportTool === 'zoom' && (
                   <g transform={`translate(${100}, ${100})`}>
                      <circle cx="0" cy="0" r={zoom * 10} fill="none" stroke="#3b82f6" strokeWidth="0.5" className="animate-pulse" />
                      <circle cx="0" cy="0" r={zoom * 20} fill="none" stroke="#3b82f6" strokeWidth="0.2" opacity="0.3" />
                   </g>
                 )}
                 {activeViewportTool === 'orbit' && (
                   <g transform={`translate(${100}, ${100})`}>
                      <circle cx="0" cy="0" r="50" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="4 4" />
                      <circle cx="0" cy="0" r="2" fill="#3b82f6" />
                   </g>
                 )}
               </g>
             )}

             {/* Mesh Rendering (Shaded) */}
             <g>
                {geometryData.faces.map((face, i) => (
                  <motion.path 
                    key={i}
                    d={face.path}
                    fill={face.fill}
                    stroke={savedSettings.shading === "Wireframe" ? "rgba(59, 130, 246, 0.7)" : "rgba(255, 255, 255, 0.08)"}
                    strokeWidth={savedSettings.shading === "Wireframe" ? currentStrokeWidth * 1.2 : currentStrokeWidth}
                    strokeLinejoin="round"
                    className="transition-colors hover:stroke-blue-400 cursor-crosshair"
                  />
                ))}
             </g>

             {/* Sketch Base (Ghost) */}
             <g className="text-blue-500/10">
               <path d={geometryData.basePath} fill="none" stroke="currentColor" strokeWidth={currentStrokeWidth * 0.5} strokeDasharray="1 1" />
             </g>

             {/* Real-world Constraints Visualizer */}
             <g className="text-emerald-400 text-[6px]">
               {/* Radius dimension */}
               <line x1="100" y1="120" x2={geometryData.projectedBase[0].x} y2={geometryData.projectedBase[0].y} stroke="currentColor" strokeWidth="0.5" />
               <circle cx={100 + (geometryData.projectedBase[0].x - 100)/2} cy={120 + (geometryData.projectedBase[0].y - 120)/2} r="6" fill="#0d1117" stroke="currentColor" strokeWidth="0.5" />
               <text x={100 + (geometryData.projectedBase[0].x - 100)/2} y={120 + (geometryData.projectedBase[0].y - 120)/2 + 2} textAnchor="middle" fill="currentColor">R{radius}</text>
               
               {/* Extrude height dimension */}
               <line x1="180" y1="120" x2="180" y2={120 - extrude} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1 1" />
               <text x="185" y={120 - extrude/2 + 2} fill="#f59e0b">L{extrude}</text>
             </g>
           </svg>

           {/* Viewport controls */}
           <div className="absolute top-2 right-2 flex gap-1 z-10">
             <button 
               onClick={undo}
               disabled={historyIndex === 0}
               className={`px-1.5 py-1 bg-black/40 border border-white/10 rounded transition-colors ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 text-white/60'}`}
               title="Undo"
             >
               <Undo2 className="w-3 h-3" />
             </button>
             <button 
               onClick={redo}
               disabled={historyIndex === history.length - 1}
               className={`px-1.5 py-1 bg-black/40 border border-white/10 rounded transition-colors ${historyIndex === history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 text-white/60'}`}
               title="Redo"
             >
               <Redo2 className="w-3 h-3" />
             </button>
             <div className="w-px h-5 bg-white/10 mx-1 self-center" />
             <button 
               onClick={() => setShowGrid(!showGrid)}
               className={`px-1.5 py-1 ${showGrid ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/10'} border rounded cursor-pointer transition-colors`}
               title={showGrid ? "Hide Grid" : "Show Grid"}
             >
               <Grid3X3 className="w-3 h-3" />
             </button>
             <div className="px-1.5 py-1 bg-black/40 border border-white/10 rounded cursor-pointer hover:bg-white/10 text-white/60 transition-colors">
                  <Box className="w-3 h-3" />
             </div>
             <button 
               onClick={handleOpenSettings}
               className={`px-1.5 py-1 rounded cursor-pointer transition-all border ${isSettingsOpen ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/10'}`}
               title={t("cad.render_settings")}
             >
                 <Settings2 className="w-3 h-3" />
             </button>
             <button 
               onClick={handleExport}
               className="px-1.5 py-1 bg-black/40 border border-white/10 rounded cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 text-white/60 transition-all shadow-sm"
               title={t("cad.export")}
             >
                 <Download className="w-3 h-3" />
             </button>
           </div>

           {/* Navigation Toolbar */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-[#0a0a0b] border border-white/10 rounded-full p-1 shadow-lg z-10 gap-1">
             <button
               onClick={() => setActiveViewportTool('orbit')}
               className={`p-1.5 rounded-full transition-all duration-200 ${activeViewportTool === 'orbit' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] scale-110' : 'text-white/40 hover:text-white/90 hover:bg-white/10'}`}
               title="Orbit"
             >
               <Orbit className="w-4 h-4" />
             </button>
             <button
               onClick={() => setActiveViewportTool('pan')}
               className={`p-1.5 rounded-full transition-all duration-200 ${activeViewportTool === 'pan' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] scale-110' : 'text-white/40 hover:text-white/90 hover:bg-white/10'}`}
               title="Pan"
             >
               <Hand className="w-4 h-4" />
             </button>
             <button
               onClick={() => setActiveViewportTool('zoom')}
               className={`p-1.5 rounded-full transition-all duration-200 ${activeViewportTool === 'zoom' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] scale-110' : 'text-white/40 hover:text-white/90 hover:bg-white/10'}`}
               title="Zoom"
             >
               <ZoomIn className="w-4 h-4" />
             </button>
           </div>

           {/* Render Settings Modal */}
           <AnimatePresence>
             {isSettingsOpen && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 10 }}
                 className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                 onClick={() => setIsSettingsOpen(false)}
               >
                 <motion.div 
                   className="w-full max-w-sm bg-[#0a0a0b] border border-white/10 rounded shadow-2xl overflow-hidden flex flex-col"
                   onClick={(e) => e.stopPropagation()}
                 >
                   {/* Header */}
                   <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <div className="flex items-center gap-2">
                       <Settings2 className="w-4 h-4 text-blue-400" />
                       <span className="font-black text-[9px] uppercase tracking-widest text-white/90">{t("cad.render_settings")}</span>
                     </div>
                     <button 
                       onClick={() => setIsSettingsOpen(false)}
                       className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>

                   {/* Content */}
                   <div className="p-5 space-y-6">
                     {/* Resolution Slider */}
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter">
                         <span className="text-white/50">{t("cad.resolution") || "Output Resolution"}</span>
                         <span className="text-blue-400 font-bold">{t(`cad.resolution_${tempSettings.resolution.toLowerCase()}`)}</span>
                       </div>
                       <div className="relative pt-4">
                         <input 
                           type="range" 
                           min="0" 
                           max="2" 
                           step="1"
                           value={['Low', 'Medium', 'High'].indexOf(tempSettings.resolution)}
                           onChange={(e) => {
                             const options: RenderSettings['resolution'][] = ['Low', 'Medium', 'High'];
                             setTempSettings({...tempSettings, resolution: options[parseInt(e.target.value)]});
                           }}
                           className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                         />
                         <div className="flex justify-between px-1 mt-2 text-[7px] text-white/30 uppercase">
                           <span>{t("cad.resolution_low")}</span>
                           <span>{t("cad.resolution_medium")}</span>
                           <span>{t("cad.resolution_high")}</span>
                         </div>
                       </div>
                     </div>

                     {/* Anti-Aliasing Toggle */}
                     <div className="flex items-center justify-between group">
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[8px] uppercase tracking-tighter text-white/50">{t("cad.anti_aliasing") || "Anti-Aliasing"}</span>
                         <span className="text-[7px] text-white/30">{t("cad.anti_aliasing_desc") || "Smooth vector rendering"}</span>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="sr-only peer"
                           checked={tempSettings.antiAliasing}
                           onChange={(e) => setTempSettings({...tempSettings, antiAliasing: e.target.checked})}
                         />
                         <div className="w-8 h-4 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                       </label>
                     </div>

                     {/* Shading Mode */}
                     <div>
                       <label className="text-[8px] text-white/40 uppercase mb-1.5 block">Shading Mode</label>
                       <div className="flex flex-wrap gap-1">
                         {(['Wireframe', 'Solid', 'Realistic', 'Stress'] as const).map(mode => (
                           <button 
                             key={mode}
                             onClick={() => setTempSettings({...tempSettings, shading: mode})}
                             className={`flex-1 py-1.5 text-[8px] uppercase rounded border transition-all ${tempSettings.shading === mode ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'}`}
                           >
                             {mode}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Output Format Dropdown */}
                     <div className="space-y-2">
                       <span className="text-[8px] uppercase tracking-tighter text-white/50">{t("cad.export_format") || "Export Format"}</span>
                       <div className="flex flex-wrap gap-1">
                         {(['PNG', 'JPG', 'STL', 'OBJ'] as const).map(fmt => (
                            <button 
                                key={fmt}
                                onClick={() => setTempSettings({...tempSettings, outputFormat: fmt as any})}
                                className={`flex-1 py-1.5 text-[8px] uppercase rounded border transition-all ${tempSettings.outputFormat === fmt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'}`}
                            >
                                {fmt}
                            </button>
                         ))}
                       </div>
                     </div>
                   </div>

                   {/* Footer */}
                   <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex gap-2">
                     <button 
                       onClick={() => setIsSettingsOpen(false)}
                       className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                     >
                       {t("cad.cancel") || "Cancel"}
                     </button>
                     <button 
                       onClick={handleSaveSettings}
                       className="flex-1 px-3 py-2 rounded bg-blue-600 border border-blue-500 text-[9px] uppercase font-bold text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-1.5"
                     >
                       <Check className="w-3 h-3" /> {t("cad.save") || "Save"}
                     </button>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Toolbar */}
        <div className="w-12 bg-[#0a0a0b] border-l border-white/5 flex flex-col p-2 gap-2 shrink-0 items-center">
          <ToolIcon icon={MousePointer2} active />
          <ToolIcon icon={Compass} />
          <ToolIcon icon={Ruler} />
          <ToolIcon icon={Layers} />
        </div>
      </div>
    </div>
  );
}

function TreeItem({ name, icon: Icon, active }: { name: string, icon: any, active?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-sm cursor-pointer transition-colors ${active ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[8px] truncate tracking-tight">{name}</span>
    </div>
  );
}

function ToolIcon({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <div className={`p-1.5 rounded cursor-pointer transition-all ${active ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}
