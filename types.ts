import * as THREE from 'three';

export enum GeometryType {
  CUBE = 'Cube',
  SPHERE = 'Sphere',
  CYLINDER = 'Cylinder',
  CONE = 'Cone',
  TORUS = 'Torus',
  TETRAHEDRON = 'Tetrahedron',
  OCTAHEDRON = 'Octahedron',
  DODECAHEDRON = 'Dodecahedron',
  ICOSAHEDRON = 'Icosahedron',
  CAPSULE = 'Capsule',
  HEXPRISM = 'HexPrism',
}

export interface SlicerState {
  geometryType: GeometryType;
  isFrozen: boolean; // If true, the cut is locked
  planePosition: THREE.Vector3;
  planeRotation: THREE.Euler;
  showHelper: boolean;
}

export const SHAPES = [
  GeometryType.CUBE,
  GeometryType.SPHERE,
  GeometryType.CYLINDER,
  GeometryType.CONE,
  GeometryType.TORUS,
  GeometryType.CAPSULE,
  GeometryType.HEXPRISM,
  GeometryType.TETRAHEDRON,
  GeometryType.OCTAHEDRON,
  GeometryType.DODECAHEDRON,
  GeometryType.ICOSAHEDRON,
];