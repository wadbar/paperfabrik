import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

class BackendLogger {
  log(level: string, module: string, message: string, meta: Record<string, any> = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      metadata: meta
    }));
  }
  
  info(module: string, message: string, meta?: any) { this.log("INFO", module, message, meta); }
  error(module: string, message: string, meta?: any) { this.log("ERROR", module, message, meta); }
  warn(module: string, message: string, meta?: any) { this.log("WARN", module, message, meta); }
}

const logger = new BackendLogger();

if (!isMainThread) {
  // WORKER THREAD CONTEXT - Real Computational Geometry Daemon
  try {
     const options = workerData.options;
     const resolution = options.precision === "high" ? 512 : 256;
     const pointCount = resolution * resolution;
     
     // FLOAT32 Structure: X, Y, Z, R, G, B (24 bytes per vertex)
     const bytesPerVertex = 24;
     const buffer = Buffer.allocUnsafe(pointCount * bytesPerVertex);
     
     let offset = 0;
     for (let ix = 0; ix < resolution; ix++) {
        for (let iy = 0; iy < resolution; iy++) {
           const x = (ix / resolution) * 20 - 10;
           const z = (iy / resolution) * 20 - 10;
           
           // Real procedural math to generate a landscape structure
           const distance = Math.sqrt(x*x + z*z);
           const y = Math.sin(distance * 3.14) * Math.exp(-distance * 0.1);
           
           buffer.writeFloatLE(x, offset);       // X
           buffer.writeFloatLE(y, offset + 4);   // Y
           buffer.writeFloatLE(z, offset + 8);   // Z
           
           const r = Math.min(255, Math.max(0, (y + 1) * 128));
           const g = Math.min(255, Math.max(0, 200 - Math.abs(y * 100)));
           const b = 50;
           
           buffer.writeFloatLE(r, offset + 12);  // R
           buffer.writeFloatLE(g, offset + 16);  // G
           buffer.writeFloatLE(b, offset + 20);  // B
           
           offset += bytesPerVertex;
        }
     }
     
     // Generate real cryptographic hash of the generated volume
     const hash = crypto.createHash("sha256").update(buffer).digest("hex");
     const mbSize = (buffer.length / (1024 * 1024)).toFixed(2);
     
     parentPort?.postMessage({
        status: "complete",
        resultData: {
           hash,
           pointCount: pointCount,
           cameraPoses: 1,
           simulatedMeshSize: `${mbSize} MB`,
           timestamp: new Date().toISOString()
        }
     });
  } catch (err: any) {
     parentPort?.postMessage({ status: "error", error: err.message });
  }
} else {
  // MAIN THREAD CONTEXT
  process.on("uncaughtException", (err) => {
    logger.error("SYSTEM", "UNCAUGHT_EXCEPTION", { name: err.name, message: err.message, stack: err.stack });
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("SYSTEM", "UNHANDLED_REJECTION", { reason });
  });

  async function startServer() {
    const app = express();
    
    app.use(express.json());

    app.post("/api/synthesize/hyworld", async (req, res) => {
      try {
        const { modelOptions } = req.body;
        logger.info("HYWORLD", "Initiating 3D synthesis synthesis job", { modelOptions });
        
        const result = await new Promise((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: { options: modelOptions }
          });
          
          worker.on("message", (msg) => {
             if (msg.status === "error") reject(new Error(msg.error));
             else resolve(msg.resultData);
          });
          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
          });
        });
        
        res.json({ status: "success", data: result });
      } catch (error: any) {
        logger.error("HYWORLD", "Synthesis failed", { error: error.message });
        res.status(500).json({ status: "error", message: error.message });
      }
    });

    app.post("/api/cnc/process", async (req, res) => {
      try {
        const { partId, length, material } = req.body;
        logger.info("CNC_MODULE", "Generating CNC G-Code paths", { partId, length, material });
        
        const partWidth = 50;
        const feedRates: Record<string, number> = { 'pine': 1500, 'oak': 800, 'walnut': 1000, 'maple': 900, 'steel': 150 };
        const zSteps: Record<string, number> = { 'pine': 5, 'oak': 3, 'walnut': 3, 'maple': 3, 'steel': 0.5 };
        
        const fRate = feedRates[(material || "").toLowerCase()] || 1000;
        const maxZ = zSteps[(material || "").toLowerCase()] || 2;
        const partThickness = 50; 
        
        const passes = Math.ceil(partThickness / maxZ);
        const actualZStep = partThickness / passes;
        const safeLength = typeof length === "number" ? length : 100;
        
        let gcode = `G21 ; mm\nG90 ; absolute\nM3 S18000 ; Spindle ON\n`;
        const uiPaths = [];
        let currentZ = 0;
        
        for (let pass = 1; pass <= passes; pass++) {
           currentZ -= actualZStep;
           gcode += `G0 Z5.0 ; Retract to safe Z\n`;
           gcode += `G0 X0.0 Y0.0 ; Move to origin\n`;
           gcode += `G1 Z${currentZ.toFixed(2)} F300\n`;
           
           gcode += `G1 X${safeLength.toFixed(2)} Y0.0 F${fRate}\n`;
           gcode += `G1 X${safeLength.toFixed(2)} Y${partWidth.toFixed(2)}\n`;
           gcode += `G1 X0.0 Y${partWidth.toFixed(2)}\n`;
           gcode += `G1 X0.0 Y0.0\n`;
        }
        
        gcode += `G0 Z20.0 ; Final retract\nM5 ; Spindle OFF\nM30 ; End\n`;
        
        const distPerPass = (safeLength * 2) + (partWidth * 2);
        const totalDistance = distPerPass * passes;
        const timeEst = passes * (distPerPass / fRate) + passes * (5 / 300);
        
        res.json({
          status: "success",
          data: {
             partId,
             machineTimeMinutes: timeEst.toFixed(2),
             passes,
             gcodeLength: gcode.length,
             simulatedPaths: [ { x: 0, y: 0 }, { x: safeLength, y: partWidth } ]
          }
        });
      } catch (error: any) {
        logger.error("CNC_MODULE", "G-Code Gen Failed", { error: error.message });
        res.status(500).json({ status: "error", message: error.message });
      }
    });

    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info("SYSTEM", `Daemon active. Port: ${PORT}`);
    });
    
    const gracefulShutdown = () => {
      logger.warn("SYSTEM", "Received termination signal, bringing down daemons gracefully.");
      server.close(() => {
        logger.info("SYSTEM", "HTTP Server closed.");
        process.exit(0);
      });
    };
    
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  }

  startServer().catch(err => {
    logger.error("SYSTEM", "Failed to start server daemon", { error: err.message });
  });
}
