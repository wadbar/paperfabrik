/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Ruler, Compass, Box, Layers, MousePointer2, Settings2, Link, X, Check, 
  ChevronDown, Download, Activity, Wind, PlayCircle, BarChart3 
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";
import { ProjectionKernel, Vector3 } from "../../core/geometry";
import { Mesh } from "../../core/mesh";
import { SimulationEngine, SimulationResult } from "../../core/simulation";

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

  const runSimulation = () => {
    setIsSimulating(true);
    recordEvent("CAD_SIMULATION_START");
    
    setTimeout(() => {
        const result = SimulationEngine.simulateStaticLoad(geometryData.mesh);
        setSimResult(result);
        setIsSimulating(false);
        setSavedSettings(prev => ({ ...prev, shading: "Stress" }));
        recordEvent("CAD_SIMULATION_SUCCESS", { peakStress: result.maxStress });
    }, 800);
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

  const geometryData = useMemo(() => {
    // Industrial Parametric Generation via GeometryKernel
    const { base, top } = ProjectionKernel.generateExtrusion(sides, radius, extrude);
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

    const projectedFaces = mesh.faces.map(face => {
      const projectedPoints = face.indices.map(idx => {
        let v = mesh.vertices[idx];
        if (simResult && savedSettings.shading === "Stress") {
             v = v.add(simResult.vertexDisplacements[idx].mul(10)); 
        }
        const p = ProjectionKernel.project(v);
        return { x: origin.x + p.x, y: origin.y + p.y };
      });

      const intensity = face.normal ? Math.max(0.15, face.normal.dot(lightDir)) : 0.4;
      
      let fill = `rgba(59, 130, 246, ${intensity * 0.9})`;
      if (savedSettings.shading === "Stress" && simResult) {
          const avgStress = face.indices.reduce((sum, idx) => sum + simResult.stressValues[idx], 0) / 3;
          const t = (avgStress - simResult.minStress) / (simResult.maxStress - simResult.minStress || 1);
          const r = Math.floor(t * 255);
          const g = Math.floor((1 - t) * 150);
          const b = Math.floor((1 - t) * 255);
          fill = `rgba(${r}, ${g}, ${b}, ${intensity * 1.5})`;
      }

      return {
        path: ProjectionKernel.pointsToPath(projectedPoints),
        intensity,
        points: projectedPoints,
        fill
      };
    });

    return {
      faces: projectedFaces,
      basePath: ProjectionKernel.pointsToPath(base.map(v => {
        const p = ProjectionKernel.project(v);
        return { x: origin.x + p.x, y: origin.y + p.y };
      })),
      projectedBase: base.map(v => {
        const p = ProjectionKernel.project(v);
        return { x: origin.x + p.x, y: origin.y + p.y };
      }),
      mesh
    };
  }, [radius, sides, extrude]);

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-blue-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex gap-px bg-studio-grid min-h-0 overflow-hidden">
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
                   <input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Link className="w-2 h-2"/> Sides</span>
                   <input type="number" value={sides} onChange={e => setSides(Number(e.target.value))} min={3} max={12} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
                </div>
             </div>
          </div>

          <TreeItem name="Extrude_Pad" icon={Box} />
          
          <div className="pl-3 py-1 space-y-2 border-b border-white/5 pb-3 mb-2">
             <div className="flex flex-col gap-1 text-[8px] text-white/70">
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Box className="w-2 h-2"/> Length</span>
                   <input type="number" value={extrude} onChange={e => setExtrude(Number(e.target.value))} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
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
                  <span>Engine</span>
                  <span className="text-blue-400/80">Kernel V4</span>
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
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
           
           <svg 
             className="w-full h-full text-blue-400" 
             viewBox="0 0 200 200"
             shapeRendering={savedSettings.antiAliasing ? "auto" : "crispEdges"}
           >
             {/* Origin/Axes */}
             <g className="opacity-40">
               <path d="M100 20 L100 180 M20 100 L180 100" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" />
               <circle cx="100" cy="100" r="1.5" fill="#3b82f6" />
             </g>

             {/* Mesh Rendering (Shaded) */}
             <g>
                {geometryData.faces.map((face, i) => (
                  <motion.path 
                    key={i}
                    d={face.path}
                    fill={savedSettings.shading !== "Wireframe" ? face.fill : "none"}
                    stroke={savedSettings.shading === "Wireframe" ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.05)"}
                    strokeWidth={currentStrokeWidth}
                    className="transition-colors hover:fill-blue-500/50 cursor-crosshair"
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
                       <div className="grid grid-cols-4 gap-1">
                         {(['Wireframe', 'Solid', 'Realistic', 'Stress'] as const).map(mode => (
                           <button 
                             key={mode}
                             onClick={() => setTempSettings({...tempSettings, shading: mode})}
                             className={`py-1.5 text-[8px] uppercase rounded border transition-all ${tempSettings.shading === mode ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'}`}
                           >
                             {mode}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Output Format Dropdown */}
                     <div className="space-y-2">
                       <span className="text-[8px] uppercase tracking-tighter text-white/50">{t("cad.export_format") || "Export Format"}</span>
                       <div className="grid grid-cols-4 gap-1">
                         {(['PNG', 'JPG', 'STL', 'OBJ'] as const).map(fmt => (
                            <button 
                                key={fmt}
                                onClick={() => setTempSettings({...tempSettings, outputFormat: fmt as any})}
                                className={`py-1.5 text-[8px] uppercase rounded border transition-all ${tempSettings.outputFormat === fmt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'}`}
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
