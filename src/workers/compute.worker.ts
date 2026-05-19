import { Mesh } from "../core/mesh";
import { SimulationService } from "../core/simulation";
import { Vector3 } from "../core/geometry";

/**
 * PaperFabrik Compute Worker
 * Inspired by Chromium's Render Process Isolation
 */
self.onmessage = (e: MessageEvent) => {
  const { id, type, data } = e.data;

  // Helper to rehydrate instances (MessagePort strips methods)
  const hydrateMesh = (rawVertices: any[], rawFaces: any[]) => {
    const v3s = rawVertices.map(v => new Vector3(v.x, v.y, v.z));
    return new Mesh(v3s, rawFaces);
  };

  try {
    switch (type) {
      case "MESH_WELD": {
        const mesh = hydrateMesh(data.vertices, data.faces);
        mesh.weld(data.epsilon);
        self.postMessage({ id, type: "SUCCESS", data: { vertices: mesh.vertices, faces: mesh.faces } });
        break;
      }
      case "MESH_SMOOTH": {
        const mesh = hydrateMesh(data.vertices, data.faces);
        mesh.smooth(data.iterations);
        mesh.computeNormals();
        self.postMessage({ id, type: "SUCCESS", data: { vertices: mesh.vertices, faces: mesh.faces } });
        break;
      }
      case "SIM_LOAD": {
        const mesh = hydrateMesh(data.vertices, data.faces);
        const result = SimulationService.simulateStaticLoad(mesh);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      default:
        self.postMessage({ id, type: "ERROR", error: "Unknown task type" });
    }
  } catch (err: any) {
    self.postMessage({ id, type: "ERROR", error: err.message });
  }
};
