import { Mesh } from "./mesh";
import { SimulationResult } from "./simulation";
import { Vector3 } from "./geometry";

class ComputeClient {
  private worker: Worker;
  private messageId = 0;
  private callbacks = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

  constructor() {
    this.worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(e: MessageEvent) {
    const { id, type, data, error } = e.data;
    const callbacks = this.callbacks.get(id);
    if (!callbacks) return;

    if (type === "SUCCESS") {
      callbacks.resolve(data);
    } else {
      callbacks.reject(new Error(error));
    }
    this.callbacks.delete(id);
  }

  private sendCommand<T>(type: string, payload: any): Promise<T> {
    const id = ++this.messageId;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, data: payload });
    });
  }

  async weldMesh(mesh: Mesh, epsilon: number = 0.01): Promise<Mesh> {
    const result = await this.sendCommand<any>("MESH_WELD", { 
        vertices: mesh.vertices, 
        faces: mesh.faces,
        epsilon 
    });
    return this.restoreMesh(result.vertices, result.faces);
  }

  async smoothMesh(mesh: Mesh, iterations: number = 1): Promise<Mesh> {
    const result = await this.sendCommand<any>("MESH_SMOOTH", { 
        vertices: mesh.vertices, 
        faces: mesh.faces,
        iterations 
    });
    return this.restoreMesh(result.vertices, result.faces);
  }

  async simulateStaticLoad(mesh: Mesh): Promise<SimulationResult> {
    const result = await this.sendCommand<any>("SIM_LOAD", {
        vertices: mesh.vertices,
        faces: mesh.faces
    });
    // Restore Vector3 instances for displacements
    return {
        ...result,
        vertexDisplacements: result.vertexDisplacements.map((v: any) => new Vector3(v.x, v.y, v.z))
    };
  }

  private restoreMesh(vertices: any[], faces: any[]): Mesh {
    const v3s = vertices.map((v: any) => new Vector3(v.x, v.y, v.z));
    const mesh = new Mesh(v3s, faces);
    mesh.computeNormals();
    return mesh;
  }
}

export const computeClient = new ComputeClient();
