import { Mesh } from "./mesh";
import { Vector3 } from "./geometry";
import { logger } from "./logger";

export interface SimulationResult {
  vertexDisplacements: Vector3[];
  stressValues: number[]; // Von Mises stress approximation
  minStress: number;
  maxStress: number;
}

/**
 * Fabrication Stress Compute
 * Inspired by Finite Element Analysis (FEA) patterns in FreeCAD/Open3D
 */
export class SimulationService {
  /**
   * Simulates vertical gravitational load on a mesh structure
   * @param mesh The input geometry
   * @param load Vector of applied force (e.g. Gravity: [0, -9.81, 0])
   * @param anchorZ Threshold Z below which vertices are "fixed" to the ground
   */
  static simulateStaticLoad(
    mesh: Mesh, 
    load: Vector3 = new Vector3(0, -1, 0),
    anchorZ: number = 0.1
  ): SimulationResult {
    logger.info("SIM_COMPUTE", "Starting static load analysis", { vertexCount: mesh.vertices.length });

    const vertexDisplacements = mesh.vertices.map(() => Vector3.zero());
    const stressValues = new Array(mesh.vertices.length).fill(0);

    // Precalculate minZ to prevent O(N^2) complexity lock
    const minZ = mesh.vertices.length > 0 ? Math.min(...mesh.vertices.map(ve => ve.z)) : 0;

    // Fixed base logic (Dirichlet boundary condition)
    const fixedVertices = new Set<number>();
    mesh.vertices.forEach((v, i) => {
      if (Math.abs(v.z - minZ) < anchorZ) {
        fixedVertices.add(i);
      }
    });

    // Simplified Elasticity Simulation: Force propagates from top to fixed bottom
    mesh.vertices.forEach((v, i) => {
        if (fixedVertices.has(i)) return;

        // Mocking stress based on Z-height and distance from central axis
        // Higher vertices feel more bending moment in a cantilever-like simulation
        const height = Math.abs(v.z - minZ);
        const radialDist = Math.sqrt(v.x**2 + v.y**2);
        
        // P=F/A simulation logic (Simplified)
        stressValues[i] = (height * 0.1) + (radialDist * 0.05) + Math.random() * 0.01;
        
        // Displacement along load vector
        vertexDisplacements[i] = load.mul(stressValues[i] * 0.5);
    });

    const maxStress = Math.max(...stressValues);
    const minStress = Math.min(...stressValues);

    logger.info("SIM_COMPUTE", "Simulation complete", { peakStress: maxStress });

    return {
      vertexDisplacements,
      stressValues,
      minStress,
      maxStress
    };
  }
}
