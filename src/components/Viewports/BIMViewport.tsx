/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Home, Ruler, Layers, BoxSelect, ZoomIn, Upload, Download, FileUp, FileDown, CheckCircle2, AlertTriangle } from "lucide-react";
import * as d3 from "d3";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";

const MATERIAL_SPECS = {
  Oak: { color: "#8B4513", density: 0.75, feedRate: 200 },
  Pine: { color: "#F4A460", density: 0.45, feedRate: 400 },
  Walnut: { color: "#5D4037", density: 0.65, feedRate: 250 },
  Maple: { color: "#D2B48C", density: 0.70, feedRate: 220 },
  Steel: { color: "#78909C", density: 7.85, feedRate: 50 },
} as const;

const getMaterialFeedRate = (material: string | undefined) => {
  return MATERIAL_SPECS[material as keyof typeof MATERIAL_SPECS]?.feedRate || 220;
};

export const BIMViewport = React.memo(() => {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry("BIMViewport");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [parts, setParts] = useState([
    { id: "B-104", nameKey: "bim.custom_beam", fallbackName: "Custom Beam", material: "Oak", length: 3200, profile: "150x50mm", type: 'beam' },
    { id: "S-201", nameKey: "bim.wall_stud", fallbackName: "Wall Stud", material: "Pine", length: 2400, profile: "100x50mm", type: 'stud' },
  ]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>("B-104");
  const [materialPrice, setMaterialPrice] = useState<number>(5.00);
  const [pricingMode, setPricingMode] = useState<'kg'|'m3'>('kg');
  
  const selectedPart = parts.find(p => p.id === selectedPartId);

  const updateSelectedPart = (updates: Partial<typeof parts[0]>) => {
    if (!selectedPartId) return;
    setParts(parts.map(p => p.id === selectedPartId ? { ...p, ...updates } : p));
    if (updates.material) {
      recordEvent("PART_MATERIAL_CHANGED", { partId: selectedPartId, material: updates.material });
    }
  };
  
  const [isCncProcessing, setIsCncProcessing] = useState(false);
  const [cncData, setCncData] = useState<any>(null);

  const calculateCncProperties = async () => {
     if (!selectedPart) return;
     setIsCncProcessing(true);
     try {
        const res = await fetch("/api/cnc/process", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              partId: selectedPart.id,
              length: selectedPart.length,
              material: selectedPart.material
           })
        });
        const payload = await res.json();
        if (payload.status === "success") {
           setCncData(payload.data);
        }
     } catch(err) {
        console.error("CNC Daemon fault:", err);
     } finally {
        setIsCncProcessing(false);
     }
  };

  // Re-calculate when part changes
  React.useEffect(() => {
     calculateCncProperties();
  }, [selectedPartId, selectedPart?.length, selectedPart?.material, selectedPart?.profile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.rvt')) {
        setIsImporting(true);
        setFileStatus(t("bim.parsing"));
        setTimeout(() => {
          setFileStatus(t("bim.extracting"));
          setTimeout(() => {
            setIsImporting(false);
            setActiveModel(file.name);
            setFileStatus(`${file.name} ${t("bim.loaded")}`);
            setTimeout(() => setFileStatus(null), 3000);
          }, 1500);
        }, 1500);
      } else {
        alert(t("bim.alert.invalid"));
      }
    }
  };

  const handleExport = () => {
    if (!activeModel) {
      alert(t("bim.alert.nomodel"));
      return;
    }
    setIsExporting(true);
    setFileStatus(t("bim.generating"));
    setTimeout(() => {
      setIsExporting(false);
      setFileStatus(t("bim.exported"));
      
      // Simulate download
      const content = `BIM EXPORT DATA\nModel: ${activeModel}\nParts:\n${parts.map(p => `- ${p.id} (${t(p.nameKey) || p.fallbackName}): ${p.profile}, ${p.length}mm, ${t("bim." + (p.material?.toLowerCase() || "")) || p.material}`).join('\n')}`;
      const blob = new Blob([content], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeModel.replace(".rvt", "_Customized.rvt");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setFileStatus(null), 3000);
    }, 2000);
  };

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-orange-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex min-h-0 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')]">
        
        {/* Properties Panel */}
        <div className="w-40 bg-zinc-950/80 backdrop-blur-sm border-r border-orange-500/20 flex flex-col p-2 shrink-0 overflow-y-auto z-10">
          <div className="text-[7px] text-orange-500 uppercase font-black mb-2 flex items-center gap-1 leading-tight">
            <Home className="w-3 h-3 shrink-0" /> 
            <span className="truncate">{activeModel ? activeModel : t("bim.no_model")}</span>
          </div>
          
          <div className="flex gap-1 mb-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".rvt" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleImport}
              className="flex-1 py-1 bg-zinc-800 border border-white/10 text-zinc-300 text-[8px] font-bold uppercase hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-1 rounded-sm"
              disabled={isImporting || isExporting}
            >
              <FileUp className="w-3 h-3" />
              {t("bim.import")}
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 py-1 bg-zinc-800 border border-white/10 text-zinc-300 text-[8px] font-bold uppercase hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-1 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isImporting || isExporting || !activeModel}
            >
              <FileDown className="w-3 h-3" />
              {t("bim.export")}
            </button>
          </div>

          <div className="space-y-4">
            {selectedPart && (
              <PropertySection title={t(selectedPart.nameKey) || selectedPart.fallbackName} id={selectedPart.id}>
                <div className="flex justify-between items-center text-[9px] mb-1">
                  <span className="text-zinc-500">{t("bim.length")}</span>
                  <input 
                     type="number" 
                     className="w-16 bg-black border border-orange-500/30 text-white text-right px-1 py-0.5 rounded text-[9px] focus:border-orange-500 focus:outline-none transition-colors"
                     value={selectedPart.length}
                     onChange={e => updateSelectedPart({ length: Number(e.target.value) })}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] mb-1">
                  <span className="text-zinc-500">{t("bim.profile")}</span>
                  <select 
                     className="w-16 bg-black border border-orange-500/30 text-white px-1 py-0.5 rounded text-[9px] focus:border-orange-500 focus:outline-none transition-colors"
                     value={selectedPart.profile}
                     onChange={e => updateSelectedPart({ profile: e.target.value })}
                  >
                    <option value="100x50mm">100x50</option>
                    <option value="150x50mm">150x50</option>
                    <option value="200x50mm">200x50</option>
                    <option value="250x50mm">250x50</option>
                  </select>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{t("bim.material")}</span>
                    <div className="relative group/mat min-w-[70px]">
                      <select 
                         className="w-full bg-black border border-orange-500/30 text-white px-2 py-1 rounded text-[9px] focus:border-orange-500 focus:outline-none transition-all appearance-none cursor-pointer hover:bg-zinc-900"
                         value={selectedPart.material}
                         onChange={e => updateSelectedPart({ material: e.target.value })}
                      >
                        <option value="Oak">{t("bim.oak") || "Oak"}</option>
                        <option value="Pine">{t("bim.pine") || "Pine"}</option>
                        <option value="Walnut">{t("bim.walnut") || "Walnut"}</option>
                        <option value="Maple">{t("bim.maple") || "Maple"}</option>
                        <option value="Steel">{t("bim.steel") || "Steel"}</option>
                      </select>
                      <div 
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none transition-colors border border-white/10 shadow-sm"
                        style={{ backgroundColor: MATERIAL_SPECS[selectedPart.material as keyof typeof MATERIAL_SPECS]?.color || "#ccc" }}
                      />
                    </div>
                  </div>
                  
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(MATERIAL_SPECS[selectedPart.material as keyof typeof MATERIAL_SPECS]?.density / 8) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-zinc-600 uppercase tracking-tighter">
                    <span>{t("bim.density")}</span>
                    <span>{MATERIAL_SPECS[selectedPart.material as keyof typeof MATERIAL_SPECS]?.density} g/cm³</span>
                  </div>
                </div>
                {(() => {
                   const density = MATERIAL_SPECS[selectedPart.material as keyof typeof MATERIAL_SPECS]?.density || 0;
                   const minRequiredDensity = selectedPart.length * 0.25;
                   const isUnstable = (density * 1000) < minRequiredDensity;
                   if (isUnstable) {
                      return (
                         <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-1.5 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="text-[7.5px] text-red-400 font-bold leading-tight uppercase tracking-tighter uppercase">Structural Warning: Density ({density * 1000} kg/m³) below {minRequiredDensity} requirement for {selectedPart.length}mm span.</span>
                         </div>
                      );
                   }
                   return null;
                })()}
                <PropertyRow label={t("bim.join")} value={t("bim.join.val")} />
              </PropertySection>
            )}

            {selectedPart && selectedPart.type === 'beam' && (
              <PropertySection title={t("bim.cnc_path")} id="SYS">
                <PropertyRow label={t("bim.tool")} value="Flat End 12mm" />
                <PropertyRow label={t("bim.passes")} value={cncData ? `${cncData.passes} x 12.5mm` : "Calculating..."} />
                <PropertyRow label={t("bim.time")} value={cncData ? `${cncData.machineTimeMinutes}m` : (isCncProcessing ? "Processing..." : "...")} />
              </PropertySection>
            )}

            {selectedPart && (
              <PropertySection title="Material Economics" id="ECONOMICS">
                <div className="flex items-center gap-2 mb-2 justify-between">
                  <div className="flex items-center gap-1">
                    <span className={`text-[7px] uppercase ${pricingMode === 'kg' ? 'text-orange-500 font-black' : 'text-zinc-600 font-bold'}`}>KG</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={pricingMode === 'm3'} onChange={() => setPricingMode(prev => prev === 'kg' ? 'm3' : 'kg')} />
                      <div className="w-5 h-2.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-zinc-400 after:border-zinc-300 after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-orange-500/50 peer-checked:after:bg-orange-500"></div>
                    </label>
                    <span className={`text-[7px] uppercase ${pricingMode === 'm3' ? 'text-orange-500 font-black' : 'text-zinc-600 font-bold'}`}>M³</span>
                  </div>
                  <input 
                     type="number" 
                     className="w-12 bg-black border border-orange-500/30 text-white text-right px-1 py-0.5 rounded text-[8px] focus:border-orange-500 focus:outline-none transition-colors"
                     value={materialPrice}
                     onChange={e => {
                        const val = parseFloat(e.target.value);
                        setMaterialPrice(isNaN(val) ? 0 : val);
                     }}
                     min={0}
                     step={0.1}
                  />
                </div>
                
                {(() => {
                  const [widthStr, heightStr] = selectedPart.profile.replace('mm','').split('x');
                  const width = parseFloat(widthStr) || 0;
                  const height = parseFloat(heightStr) || 0;
                  const volumeCm3 = (width * height * selectedPart.length) / 1000;
                  const density = MATERIAL_SPECS[selectedPart.material as keyof typeof MATERIAL_SPECS]?.density || 0;
                  
                  let cost = 0;
                  if (pricingMode === 'kg') {
                    const massKg = (volumeCm3 * density) / 1000;
                    cost = massKg * materialPrice;
                  } else {
                    const volumeM3 = volumeCm3 / 1000000;
                    cost = volumeM3 * materialPrice;
                  }

                  return (
                    <PropertyRow label={`${selectedPart.id} Cost`} value={`$${cost.toFixed(2)}`} />
                  );
                })()}

                <CostTrendChart material={selectedPart.material} />
              </PropertySection>
            )}

            <div className="bg-orange-500/5 border border-orange-500/20 rounded p-1.5 mt-2">
              <div className="text-[7.5px] text-orange-500/80 font-black uppercase mb-1 flex items-center justify-between">
                <span>Project Summary</span>
                <span>{parts.length} Parts</span>
              </div>
              {(() => {
                 let totalCost = 0;
                 parts.forEach(p => {
                    const [widthStr, heightStr] = p.profile.replace('mm','').split('x');
                    const width = parseFloat(widthStr) || 0;
                    const height = parseFloat(heightStr) || 0;
                    const volumeCm3 = (width * height * p.length) / 1000;
                    const density = MATERIAL_SPECS[p.material as keyof typeof MATERIAL_SPECS]?.density || 0;
                    
                    if (pricingMode === 'kg') {
                       const massKg = (volumeCm3 * density) / 1000;
                       totalCost += massKg * materialPrice;
                    } else {
                       const volumeM3 = volumeCm3 / 1000000;
                       totalCost += volumeM3 * materialPrice;
                    }
                 });
                 return (
                    <div className="flex justify-between items-end">
                       <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest leading-none">Total</span>
                       <span className="text-sm text-orange-500 font-bold leading-none tracking-tight">${totalCost.toFixed(2)}</span>
                    </div>
                 );
              })()}
            </div>
          </div>

          <button className="w-full mt-auto py-1.5 bg-orange-600/20 border border-orange-500/50 text-orange-500 text-[8px] font-bold uppercase hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-1">
            <BoxSelect className="w-3 h-3" />
            {t("bim.isolate")}
          </button>
        </div>

        {/* Status Overlay */}
        {(isImporting || isExporting || fileStatus) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              {isImporting || isExporting ? (
                <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-orange-500" />
              )}
              <span className="text-orange-400 font-bold uppercase tracking-widest">{fileStatus}</span>
            </div>
          </div>
        )}

        {/* 3D Viewport Simulation */}
        <div className="flex-1 relative bg-gradient-to-b from-blue-900/10 to-zinc-900/50 flex items-center justify-center">
            
            <svg className="w-full h-full text-zinc-400" viewBox="0 0 400 300">
               {/* Canvas */}
               <path d="M 0 150 Q 200 200 400 150 M 200 50 L 200 250" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />
               <path d="M 100 120 L 300 180 M 300 120 L 100 180" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />

                {/* Abstract Architectural frame */}
                <g fill="none" stroke="currentColor" strokeWidth="1">
                  {/* Main stud */}
                  {(() => {
                    const stud = parts.find(p => p.id === "S-201");
                    const color = MATERIAL_SPECS[stud?.material as keyof typeof MATERIAL_SPECS]?.color || "currentColor";
                    const l = stud ? stud.length / 16 : 150;
                    const profileW = stud && stud.profile === "150x50mm" ? 30 : stud && stud.profile === "200x50mm" ? 40 : stud && stud.profile === "250x50mm" ? 50 : 20;
                    return (
                      <g style={{ color }}>
                        <motion.path 
                          onClick={() => setSelectedPartId("S-201")}
                          className={`cursor-pointer transition-colors ${selectedPartId === "S-201" ? "fill-orange-500/30 stroke-current" : "fill-current/10 stroke-current/50 hover:fill-current/20"}`}
                          d={`M 180 80 L ${180 + profileW} ${80 - profileW/2} L ${180 + profileW} ${80 - profileW/2 + l} L 180 ${80 + l} Z`} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 1 }}
                        />
                        <path d={`M ${180 + profileW} ${80 - profileW/2} L ${180 + profileW + 20} ${80 - profileW/2 + 10} L ${180 + profileW + 20} ${80 - profileW/2 + 10 + l} L ${180 + profileW} ${80 - profileW/2 + l}`} opacity="0.5" pointerEvents="none" />
                      </g>
                    );
                  })()}
                  
                  {/* Connecting beam (Custom Part) */}
                  {(() => {
                    const beam = parts.find(p => p.id === "B-104");
                    const color = MATERIAL_SPECS[beam?.material as keyof typeof MATERIAL_SPECS]?.color || "currentColor";
                    const l = beam ? beam.length / 26.66 : 120;
                    const profileH = beam && beam.profile === "100x50mm" ? 13 : beam && beam.profile === "200x50mm" ? 26 : beam && beam.profile === "250x50mm" ? 33 : 20;
                    return (
                      <g style={{ color }}>
                        <motion.path 
                          onClick={() => setSelectedPartId("B-104")}
                          className={`cursor-pointer transition-colors ${selectedPartId === "B-104" ? "fill-orange-500/40 stroke-current" : "fill-current/20 stroke-current/50 hover:fill-current/30"}`}
                          d={`M 200 100 L ${200 + l} ${100 + l/2} L ${200 + l} ${100 + l/2 + profileH} L 200 ${100 + profileH} Z`} 
                          strokeWidth="1.5"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, duration: 1 }}
                        />
                        <path d={`M ${200 + l} ${100 + l/2} L ${200 + l + 20} ${100 + l/2 - 10} L ${200 + l + 20} ${100 + l/2 - 10 + profileH} L ${200 + l} ${100 + l/2 + profileH}`} opacity="0.5" pointerEvents="none" />

                       {/* Cutting Tool Path Indicator */}
                       {selectedPartId === "B-104" && (
                         <g>
                           <path 
                              d={`M 200 105 L ${200 + l - 5} ${100 + l/2 + 2}`} 
                              stroke="rgba(255, 255, 255, 0.2)" 
                              strokeWidth="0.5" 
                              strokeDasharray="2 2"
                           />
                           <motion.circle 
                              r="1.5"
                              fill="#fff"
                              initial={{ cx: 200, cy: 105 }}
                              animate={{ cx: 200 + l - 5, cy: 100 + l/2 + 2 }}
                              transition={{ duration: 600 / getMaterialFeedRate(beam?.material), repeat: Infinity, ease: "linear" }}
                           />
                         </g>
                       )}
                     </g>
                   );
                 })()}
               </g>

               {/* Annotations */}
               <g className="text-orange-300 text-[6px] transition-all">
                  {(() => {
                     const beam = parts.find(p => p.id === "B-104");
                     const l = beam ? beam.length / 26.66 : 120;
                     return (
                       <>
                         <line x1="200" y1="110" x2="160" y2="110" stroke="currentColor" strokeWidth="0.5" />
                         <text x="155" y="112" textAnchor="end" fill="currentColor">{beam?.id} ({t("bim." + (beam?.material?.toLowerCase() || "")) || beam?.material})</text>

                         <line x1={200 + l/2} y1={100 + l/4 + 10} x2={200 + l/2} y2={100 + l/4 - 20} stroke="currentColor" strokeWidth="0.5" />
                         <text x={200 + l/2} y={100 + l/4 - 25} textAnchor="middle" fill="currentColor" className="font-bold">{beam?.length}mm</text>
                       </>
                     );
                  })()}
                  
                  {(() => {
                     const stud = parts.find(p => p.id === "S-201");
                     const l = stud ? stud.length / 16 : 150;
                     return (
                       <>
                         <line x1="190" y1="150" x2="140" y2="150" stroke="currentColor" strokeWidth="0.5" />
                         <text x="135" y="152" textAnchor="end" fill="currentColor">{stud?.id} ({t("bim." + (stud?.material?.toLowerCase() || "")) || stud?.material})</text>
                         
                         <line x1="170" y1="80" x2="170" y2={80 + l} stroke="currentColor" strokeWidth="0.5" />
                         <text x="165" y={80 + l/2} textAnchor="end" fill="currentColor" className="font-bold">{stud?.length}mm</text>
                       </>
                     );
                  })()}
               </g>
            </svg>

            {/* Viewport controls */}
            <div className="absolute right-2 bottom-2 flex flex-col gap-1">
               <ControlBtn icon={ZoomIn} />
               <ControlBtn icon={Layers} />
               <ControlBtn icon={Ruler} />
            </div>

        </div>

      </div>
    </div>
  );
});

const PropertySection = React.memo(({ title, id, children }: { title: string, id: string, children: React.ReactNode }) => {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-white font-bold mb-1 flex justify-between items-center bg-white/5 px-1 py-0.5 rounded">
        <span>{title}</span>
        <span className="text-[7px] text-white/40">{id}</span>
      </div>
      <div className="space-y-0.5 px-1">
        {children}
      </div>
    </div>
  );
});

const PropertyRow = React.memo(({ label, value }: { label: string, value: string }) => {
  return (
    <div className="flex justify-between items-center text-[9px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
});

const ControlBtn = React.memo(({ icon: Icon }: { icon: any }) => {
  return (
    <button className="p-1.5 bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-orange-500/20 transition-all rounded">
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
});

const CostTrendChart = React.memo(({ material }: { material: string }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const density = MATERIAL_SPECS[material as keyof typeof MATERIAL_SPECS]?.density || 0.5;
    const basePrice = density * 10; 
    
    // Deterministic pseudo-random generation to avoid flashing
    const sfc32 = (a:number, b:number, c:number, d:number) => {
       return function() {
          a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
          var t = (a + b | 0) + d | 0;
          d = d + 1 | 0;
          a = b ^ b >>> 9;
          b = c + (c << 3) | 0;
          c = c << 21 | c >>> 11;
          c = c + t | 0;
          return (t >>> 0) / 4294967296;
       }
    };
    const rand = sfc32(100, 200, 300, material.charCodeAt(0));

    const data = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      price: basePrice * (1 + Math.sin(i * 0.5) * 0.2 + rand() * 0.1)
    }));

     const width = 120;
     const height = 30;
     const margin = { top: 2, right: 2, bottom: 2, left: 2 };

     const x = d3.scaleTime()
       .domain(d3.extent(data, d => d.date) as [Date, Date])
       .range([margin.left, width - margin.right]);

     const y = d3.scaleLinear()
       .domain([d3.min(data, d => d.price) as number * 0.9, d3.max(data, d => d.price) as number * 1.1])
       .range([height - margin.bottom, margin.top]);

     const line = d3.line<{date: Date, price: number}>()
       .x(d => x(d.date))
       .y(d => y(d.price))
       .curve(d3.curveMonotoneX);

     svg.append("path")
       .datum(data)
       .attr("fill", "none")
       .attr("stroke", "#f97316")
       .attr("stroke-width", 1)
       .attr("d", line);
       
     // Sparkline area fill
     const area = d3.area<{date: Date, price: number}>()
       .x(d => x(d.date))
       .y0(height)
       .y1(d => y(d.price))
       .curve(d3.curveMonotoneX);
       
     svg.append("path")
       .datum(data)
       .attr("fill", "url(#sparkline-gradient)")
       .attr("d", area);
       
     // Defs for gradient
     const defs = svg.append("defs");
     const gradient = defs.append("linearGradient")
        .attr("id", "sparkline-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
     gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f97316").attr("stop-opacity", 0.4);
     gradient.append("stop").attr("offset", "100%").attr("stop-color", "#f97316").attr("stop-opacity", 0.0);

  }, [material]);

  return (
    <div className="mt-2 bg-black/40 rounded border border-white/5 relative h-8 overflow-hidden">
      <div className="text-[6px] text-zinc-500 absolute top-1 left-1.5 uppercase font-bold tracking-widest z-10">30-Day FCST</div>
      <svg ref={chartRef} width="100%" height="100%" viewBox="0 0 120 30" preserveAspectRatio="none" className="absolute inset-0" />
    </div>
  );
});
