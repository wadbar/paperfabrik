import { Mesh } from "../core/mesh";
import { SimulationEngine } from "../core/simulation";

/**
 * PaperFabrik Kernel Worker
 * Inspired by Chromium's Render Process Isolation
 */
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case "MESH_WELD": {
        const mesh = new Mesh(data.vertices, data.faces);
        mesh.weld(data.epsilon);
        self.postMessage({ type: "SUCCESS", data: { vertices: mesh.vertices, faces: mesh.faces } });
        break;
      }
      case "MESH_SMOOTH": {
        const mesh = new Mesh(data.vertices, data.faces);
        mesh.smooth(data.iterations);
        mesh.computeNormals();
        self.postMessage({ type: "SUCCESS", data: { vertices: mesh.vertices, faces: mesh.faces } });
        break;
      }
      case "SIM_LOAD": {
        const mesh = new Mesh(data.vertices, data.faces);
        const result = SimulationEngine.simulateStaticLoad(mesh);
        self.postMessage({ type: "SUCCESS", data: result });
        break;
      }
      default:
        self.postMessage({ type: "ERROR", error: "Unknown task type" });
    }
  } catch (err: any) {
    self.postMessage({ type: "ERROR", error: err.message });
  }
};
