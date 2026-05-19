import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Cpu, Activity, Database, CheckCircle2, AlertCircle, Loader2, Play, RefreshCw } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";
import { ProjectionCompute, Vector3 } from "../../core/geometry";
import { Mesh } from "../../core/mesh";
import { computeClient } from "../../core/computeClient";

type NodeStatus = "IDLE" | "RUNNING" | "SUCCESS" | "ERROR";

interface ProcessingNode {
  id: string;
  labelKey: string;
  status: NodeStatus;
  progress: number;
  duration: number;
}

export function PhotogrammetryViewport() {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry();
  const [nodes, setNodes] = useState<ProcessingNode[]>([
    { id: "FE", labelKey: "photo.feature_extraction", status: "IDLE", progress: 0, duration: 2000 },
    { id: "CA", labelKey: "photo.camera_alignment", status: "IDLE", progress: 0, duration: 3000 },
    { id: "SFM", labelKey: "photo.structure_from_motion", status: "IDLE", progress: 0, duration: 5000 },
    { id: "MESH", labelKey: "photo.meshing", status: "IDLE", progress: 0, duration: 4000 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mesh, setMesh] = useState<Mesh | null>(null);
  const [isWorkerBusy, setIsWorkerBusy] = useState(false);

  // Generate a procedural dense mesh (Real reconstruction simulation)
  const generateMesh = () => {
    const vertices: Vector3[] = [];
    const faces: any[] = [];
    const res = 10;
    
    // Create a sphere-like topography
    for (let i = 0; i <= res; i++) {
        const phi = (i / res) * Math.PI;
        for (let j = 0; j <= res; j++) {
            const theta = (j / res) * Math.PI * 2;
            const r = 40 + (Math.random() - 0.5) * 5;
            vertices.push(new Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ));
        }
    }

    // Connect faces
    for (let i = 0; i < res; i++) {
        for (let j = 0; j < res; j++) {
            const first = i * (res + 1) + j;
            const second = first + res + 1;
            faces.push({ indices: [first, second, second + 1] });
            faces.push({ indices: [first, second + 1, first + 1] });
        }
    }

    const newMesh = new Mesh(vertices, faces);
    newMesh.computeNormals();
    setMesh(newMesh);
  };

  const handleSmooth = async () => {
    if (!mesh || isWorkerBusy) return;
    try {
        setIsWorkerBusy(true);
        const newMesh = await computeClient.smoothMesh(mesh, 1);
        setMesh(newMesh);
        recordEvent("MESH_SMOOTH_APPLIED");
    } finally {
        setIsWorkerBusy(false);
    }
  };

  const handleWeld = async () => {
    if (!mesh || isWorkerBusy) return;
    try {
        setIsWorkerBusy(true);
        const newMesh = await computeClient.weldMesh(mesh, 0.1);
        setMesh(newMesh);
        recordEvent("MESH_WELD_APPLIED");
    } finally {
        setIsWorkerBusy(false);
    }
  };

  const startPipeline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    recordEvent("PHOTOGRAMMETRY_PIPELINE_START");

    const updatedNodes = [...nodes].map(n => ({ ...n, status: "IDLE" as NodeStatus, progress: 0 }));
    setNodes(updatedNodes);

    for (let i = 0; i < updatedNodes.length; i++) {
        const node = updatedNodes[i];
        node.status = "RUNNING";
        setNodes([...updatedNodes]);
        
        await new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += (100 / (node.duration / 100));
                node.progress = Math.min(100, progress);
                setNodes([...updatedNodes]);
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 100);
        });

        node.status = "SUCCESS";
        setNodes([...updatedNodes]);
        
        if (node.id === "MESH") generateMesh();
    }

    setIsProcessing(false);
    recordEvent("PHOTOGRAMMETRY_PIPELINE_COMPLETE");
  };

  const projectedFaces = useMemo(() => {
    if (!mesh) return [];
    const origin = { x: 120, y: 120 };
    const lightDir = new Vector3(0, 0, 1).normalize();
    
    return mesh.faces.map(face => {
        const points = face.indices.map(idx => {
            const p = ProjectionCompute.project(mesh.vertices[idx]);
            return { x: origin.x + p.x, y: origin.y + p.y };
        });
        const intensity = face.normal ? Math.max(0.1, face.normal.dot(lightDir)) : 0.5;
        return { path: ProjectionCompute.pointsToPath(points), intensity };
    });
  }, [mesh]);

  return (
    <div className="flex h-full font-mono text-[11px] bg-[#0a0a0b] overflow-hidden">
      {/* Node Graph Sidebar */}
      <div className="w-48 border-r border-white/5 flex flex-col p-3 gap-4 shrink-0 bg-black/20">
        <div className="flex items-center gap-2 text-blue-400 font-black text-[9px] uppercase tracking-widest border-b border-white/5 pb-2">
            <Cpu className="w-3 h-3" /> {t("photo.processing_node")}
        </div>

        <div className="flex flex-col gap-3">
          {nodes.map((node, i) => (
            <div key={node.id} className="relative">
              {i < nodes.length - 1 && (
                <div className={`absolute left-4 top-8 h-4 w-0.5 ${node.status === "SUCCESS" ? "bg-blue-500/50" : "bg-white/5"}`} />
              )}
              <div className={`p-2 rounded border transition-all ${
                node.status === "RUNNING" ? "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20" :
                node.status === "SUCCESS" ? "bg-emerald-500/5 border-emerald-500/20" :
                "bg-white/2 border-white/5"
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[8px] uppercase tracking-tighter ${node.status === "RUNNING" ? "text-blue-400" : "text-white/40"}`}>
                    {t(node.labelKey)}
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${node.status === "SUCCESS" ? "bg-emerald-500" : "bg-blue-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-2">
            {mesh && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleSmooth}
                        className="flex-1 py-1.5 border border-white/10 hover:bg-white/5 text-white/60 text-[8px] uppercase rounded flex items-center justify-center gap-2 transition-all"
                    >
                        <RefreshCw className="w-3 h-3" /> Smooth
                    </button>
                    <button 
                        onClick={handleWeld}
                        className="flex-1 py-1.5 border border-white/10 hover:bg-white/5 text-white/60 text-[8px] uppercase rounded flex items-center justify-center gap-2 transition-all"
                    >
                        <Database className="w-3 h-3" /> Weld
                    </button>
                </div>
            )}
            <button 
                onClick={startPipeline}
                disabled={isProcessing}
                className="w-full py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-30 text-black font-black uppercase text-[9px] rounded flex items-center justify-center gap-2 transition-all"
            >
                {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                {isProcessing ? t("photo.status_running") : "Execute Graph"}
            </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex flex-col p-4">
        <div className="flex justify-between items-center mb-2 z-10">
          <div className="flex flex-col">
            <h2 className="text-white font-black uppercase tracking-tighter flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" /> {t("photo.title")}
            </h2>
            <div className="flex gap-3 text-[8px] text-white/30 uppercase mt-1">
              <span className="flex items-center gap-1"><Database className="w-2 h-2" /> {mesh?.vertices.length || 0} Vtx</span>
              <span className="flex items-center gap-1"><Activity className="w-2 h-2" /> {mesh?.faces.length || 0} Tris</span>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded border border-white/5 bg-[#0d0d0f] relative overflow-hidden">
           <svg className="w-full h-full" viewBox="0 0 240 240">
             <g className="text-white/5" stroke="currentColor" strokeWidth="0.1">
               {[...Array(12)].map((_, i) => (
                 <React.Fragment key={i}>
                    <line x1={i * 20} y1="0" x2={i * 20} y2="240" />
                    <line x1="0" y1={i * 20} x2="240" y2={i * 20} />
                 </React.Fragment>
               ))}
             </g>

             <g>
                {projectedFaces.map((face, i) => (
                    <motion.path 
                        key={i}
                        d={face.path}
                        fill={`rgba(59, 130, 246, ${face.intensity * 0.7})`}
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="0.1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.001 }}
                    />
                ))}
             </g>
           </svg>
        </div>
      </div>
    </div>
  );
}
