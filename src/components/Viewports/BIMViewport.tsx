/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Home, Ruler, Layers, BoxSelect, ZoomIn, Upload, Download, FileUp, FileDown, CheckCircle2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";

const getMaterialFeedRate = (material: string | undefined) => {
  switch (material?.toLowerCase()) {
    case 'pine': return 400;
    case 'oak': return 200;
    case 'walnut': return 250;
    case 'maple': return 220;
    case 'steel': return 50;
    default: return 220;
  }
};

export function BIMViewport() {
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
                <div className="flex justify-between items-center text-[9px] mb-1">
                  <span className="text-zinc-500">{t("bim.material")}</span>
                  <select 
                     className="w-16 bg-black border border-orange-500/30 text-white px-1 py-0.5 rounded text-[9px] focus:border-orange-500 focus:outline-none transition-colors"
                     value={selectedPart.material}
                     onChange={e => updateSelectedPart({ material: e.target.value })}
                  >
                    <option value="Oak">{t("bim.oak") || "Oak"}</option>
                    <option value="Pine">{t("bim.pine") || "Pine"}</option>
                    <option value="Walnut">{t("bim.walnut") || "Walnut"}</option>
                    <option value="Maple">{t("bim.maple") || "Maple"}</option>
                    <option value="Steel">{t("bim.steel") || "Steel"}</option>
                  </select>
                </div>
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
               {/* Grid */}
               <path d="M 0 150 Q 200 200 400 150 M 200 50 L 200 250" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />
               <path d="M 100 120 L 300 180 M 300 120 L 100 180" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />

               {/* Abstract Architectural frame */}
               <g className="text-orange-500/80" fill="none" stroke="currentColor" strokeWidth="1">
                 {/* Main stud */}
                 {(() => {
                   const stud = parts.find(p => p.id === "S-201");
                   const l = stud ? stud.length / 16 : 150;
                   const profileW = stud && stud.profile === "150x50mm" ? 30 : stud && stud.profile === "200x50mm" ? 40 : stud && stud.profile === "250x50mm" ? 50 : 20;
                   return (
                     <>
                       <motion.path 
                         onClick={() => setSelectedPartId("S-201")}
                         className={`cursor-pointer transition-colors ${selectedPartId === "S-201" ? "fill-orange-500/30 stroke-orange-500" : "fill-orange-500/10 stroke-orange-500/50 hover:fill-orange-500/20"}`}
                         d={`M 180 80 L ${180 + profileW} ${80 - profileW/2} L ${180 + profileW} ${80 - profileW/2 + l} L 180 ${80 + l} Z`} 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 1 }}
                       />
                       <path d={`M ${180 + profileW} ${80 - profileW/2} L ${180 + profileW + 20} ${80 - profileW/2 + 10} L ${180 + profileW + 20} ${80 - profileW/2 + 10 + l} L ${180 + profileW} ${80 - profileW/2 + l}`} opacity="0.5" pointerEvents="none" />
                     </>
                   );
                 })()}
                 
                 {/* Connecting beam (Custom Part) */}
                 {(() => {
                   const beam = parts.find(p => p.id === "B-104");
                   const l = beam ? beam.length / 26.66 : 120;
                   const profileH = beam && beam.profile === "100x50mm" ? 13 : beam && beam.profile === "200x50mm" ? 26 : beam && beam.profile === "250x50mm" ? 33 : 20;
                   return (
                     <>
                       <motion.path 
                         onClick={() => setSelectedPartId("B-104")}
                         className={`cursor-pointer transition-colors ${selectedPartId === "B-104" ? "fill-orange-500/40 stroke-orange-400" : "fill-orange-500/20 stroke-orange-500/50 hover:fill-orange-500/30"}`}
                         d={`M 200 100 L ${200 + l} ${100 + l/2} L ${200 + l} ${100 + l/2 + profileH} L 200 ${100 + profileH} Z`} 
                         strokeWidth="1.5"
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ delay: 0.5, duration: 1 }}
                       />
                       <path d={`M ${200 + l} ${100 + l/2} L ${200 + l + 20} ${100 + l/2 - 10} L ${200 + l + 20} ${100 + l/2 - 10 + profileH} L ${200 + l} ${100 + l/2 + profileH}`} opacity="0.5" pointerEvents="none" />

                       {/* Cutting Tool Path Indicator */}
                       {selectedPartId === "B-104" && (
                         <>
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
                         </>
                       )}
                     </>
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
}

function PropertySection({ title, id, children }: { title: string, id: string, children: React.ReactNode }) {
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
}

function PropertyRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-[9px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
}

function ControlBtn({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-1.5 bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-orange-500/20 transition-all rounded">
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
