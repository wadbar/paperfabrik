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

    // Structural Analysis Phase: Multi-variant stress calculation
    // 1. Calculate centroid for moment arm base logic
    const centroid = mesh.vertices.reduce((acc, v) => acc.add(v), Vector3.zero()).mul(1 / mesh.vertices.length);

    mesh.vertices.forEach((v, i) => {
        if (fixedVertices.has(i)) {
            stressValues[i] = 0.05; // Base residual stress
            return;
        }

        // Calculation of local structural metrics
        const height = Math.abs(v.z - minZ);
        const leverArm = new Vector3(v.x - centroid.x, v.y - centroid.y, 0).length();
        
        // Linear Elastic Approximation
        // Tensile/Normal Stress component (proportional to height/weight above)
        const normalStress = height * 0.15;
        
        // Bending Moment component (approximated cantilever behavior)
        const bendingMoment = (load.length() * height) * leverArm * 0.2;
        
        // von Mises approximation combining normal and shear (simplified for surface mesh)
        const combinedStress = Math.sqrt(Math.pow(normalStress, 2) + 3 * Math.pow(bendingMoment, 2));
        
        stressValues[i] = combinedStress;
        
        // Displacement: Scaled by material stiffness (Young's Modulus E proxy)
        const E = 2000; // Proxy for structural stiffness
        const displacementMagnitude = combinedStress / E;
        vertexDisplacements[i] = load.mul(displacementMagnitude * height);
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
