/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GeometricCompute - Real-world industrial CAD math service.
 * Handles 3D projections, vector transformations, and parametric generation.
 */

export class Vector3 {
  constructor(public x: number, public y: number, public z: number) {}

  add(v: Vector3): Vector3 { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v: Vector3): Vector3 { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s: number): Vector3 { return new Vector3(this.x * s, this.y * s, this.z * s); }
  
  dot(v: Vector3): number { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  
  length(): number { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  normalize(): Vector3 {
    const l = this.length();
    return l > 1e-10 ? this.mul(1 / l) : Vector3.zero();
  }

  distanceTo(v: Vector3): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
  }
  
  static zero() { return new Vector3(0, 0, 0); }
}

export type Matrix4 = number[];

export class ProjectionCompute {
  /**
   * Perspective Projection (Simulating Camera Pinhole Model)
   */
  static project(v: Vector3, fov = 400): { x: number; y: number; z: number } {
    const factor = fov / (fov + v.z + 200);
    return {
      x: v.x * factor,
      y: v.y * factor,
      z: v.z
    };
  }

  /**
   * Generates a parametric N-sided polygon extrusion
   */
  static generateExtrusion(sides: number, radius: number, height: number): { base: Vector3[], top: Vector3[] } {
    const base: Vector3[] = [];
    const top: Vector3[] = [];
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      base.push(new Vector3(x, 0, z));
      top.push(new Vector3(x, -height, z));
    }
    
    return { base, top };
  }

  /**
   * Converts a set of Projected points to an SVG Path string
   */
  static pointsToPath(points: { x: number, y: number }[], close = true): string {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    if (close) d += " Z";
    return d;
  }
}

export class CalibrationService {
  /**
   * Calculates material tolerance based on fabrication precision
   */
  static calculateTolerance(precision: "Low" | "Medium" | "High"): number {
    switch (precision) {
      case "High": return 0.05; // 50 microns
      case "Medium": return 0.2; // 200 microns
      case "Low": return 0.5;    // 500 microns
    }
  }
}
