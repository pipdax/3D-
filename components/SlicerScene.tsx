import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GeometryType } from '../types';
import { InteractionMode } from '../App';

interface SlicerSceneProps {
  geometryType: GeometryType;
  isFrozen: boolean;
  triggerAlignView: number; // Increment to trigger alignment
  triggerReset: number;     // Increment to trigger reset
  onUpdatePlane: (pos: THREE.Vector3, rot: THREE.Euler) => void;
  interactionMode: InteractionMode;
}

const MaterialSettings = {
  baseColor: '#3b82f6', // Blue
  capColor: '#ef4444',  // Red
  roughness: 0.5,
  metalness: 0.1,
};

// Helper to create geometries based on type
const createGeometry = (type: GeometryType): THREE.BufferGeometry => {
  switch (type) {
    case GeometryType.CUBE: return new THREE.BoxGeometry(2, 2, 2);
    case GeometryType.SPHERE: return new THREE.SphereGeometry(1.4, 64, 64);
    case GeometryType.CYLINDER: return new THREE.CylinderGeometry(1, 1, 3, 64);
    case GeometryType.CONE: return new THREE.ConeGeometry(1.2, 3, 64);
    case GeometryType.TORUS: return new THREE.TorusGeometry(1.2, 0.4, 32, 100);
    case GeometryType.TETRAHEDRON: return new THREE.TetrahedronGeometry(1.6);
    case GeometryType.OCTAHEDRON: return new THREE.OctahedronGeometry(1.6);
    case GeometryType.DODECAHEDRON: return new THREE.DodecahedronGeometry(1.4);
    case GeometryType.ICOSAHEDRON: return new THREE.IcosahedronGeometry(1.4);
    case GeometryType.CAPSULE: return new THREE.CapsuleGeometry(0.8, 1.5, 4, 16);
    case GeometryType.HEXPRISM: return new THREE.CylinderGeometry(1.2, 1.2, 2.5, 6); // 6 segments = Hexagonal Prism
    default: return new THREE.BoxGeometry(2, 2, 2);
  }
};

// The component that renders the mesh and the stencil cap
const SlicedObject = ({ 
  geometry, 
  plane, 
  renderOrder 
}: { 
  geometry: THREE.BufferGeometry, 
  plane: THREE.Plane,
  renderOrder: number 
}) => {
  const capMeshRef = useRef<THREE.Mesh>(null);

  // Fix: Update the cap mesh transform every frame to match the plane perfectly
  useFrame(() => {
    if (capMeshRef.current) {
      const normal = plane.normal;
      const constant = plane.constant;
      
      // The plane equation is: normal . P + constant = 0
      // The point on the plane closest to origin is: -constant * normal
      const pos = normal.clone().multiplyScalar(-constant);
      capMeshRef.current.position.copy(pos);
      
      // Orient the mesh to face the normal
      // PlaneGeometry default normal is (0,0,1) (Z axis)
      // We want Z axis to align with plane.normal
      const lookAtPos = pos.clone().add(normal);
      capMeshRef.current.lookAt(lookAtPos);
    }
  });

  return (
    <group>
      {/* Pass 1: Render Back Faces to Increment Stencil */}
      <mesh geometry={geometry} renderOrder={renderOrder}>
        <meshBasicMaterial
          depthWrite={false}
          depthTest={false}
          colorWrite={false}
          stencilWrite={true}
          stencilFunc={THREE.AlwaysStencilFunc}
          side={THREE.BackSide}
          stencilFail={THREE.IncrementWrapStencilOp}
          stencilZFail={THREE.IncrementWrapStencilOp}
          stencilZPass={THREE.IncrementWrapStencilOp}
          clippingPlanes={[plane]}
        />
      </mesh>

      {/* Pass 2: Render Front Faces to Decrement Stencil */}
      <mesh geometry={geometry} renderOrder={renderOrder + 1}>
        <meshBasicMaterial
          depthWrite={false}
          depthTest={false}
          colorWrite={false}
          stencilWrite={true}
          stencilFunc={THREE.AlwaysStencilFunc}
          side={THREE.FrontSide}
          stencilFail={THREE.DecrementWrapStencilOp}
          stencilZFail={THREE.DecrementWrapStencilOp}
          stencilZPass={THREE.DecrementWrapStencilOp}
          clippingPlanes={[plane]}
        />
      </mesh>

      {/* Pass 3: The "Cap" - Covers the hole */}
      {/* We use a large planeGeometry to ensure it covers the whole viewport cut */}
      <mesh ref={capMeshRef} renderOrder={renderOrder + 2} frustumCulled={false}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color={MaterialSettings.capColor}
          metalness={0.1}
          roughness={0.8}
          stencilWrite={true}
          stencilFunc={THREE.NotEqualStencilFunc}
          stencilRef={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pass 4: The actual visible clipped mesh */}
      <mesh geometry={geometry} renderOrder={renderOrder + 3}>
        <meshStandardMaterial
          color={MaterialSettings.baseColor}
          metalness={MaterialSettings.metalness}
          roughness={MaterialSettings.roughness}
          side={THREE.DoubleSide}
          clippingPlanes={[plane]}
        />
      </mesh>
      
      {/* Internal Shadow/Outline helper for depth perception inside */}
      <mesh geometry={geometry} renderOrder={renderOrder + 3}>
         <meshBasicMaterial 
            color={'#1e3a8a'} 
            wireframe 
            transparent 
            opacity={0.1} 
            side={THREE.BackSide}
            clippingPlanes={[plane]}
         />
      </mesh>
    </group>
  );
};

export const SlicerScene: React.FC<SlicerSceneProps> = ({
  geometryType,
  isFrozen,
  triggerAlignView,
  triggerReset,
  onUpdatePlane,
  interactionMode
}) => {
  // Use selector to get reactive controls updates
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const controls = useThree((state) => state.controls);

  const [plane] = useState(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  // Refs for current plane state to avoid re-renders
  const planePosRef = useRef(new THREE.Vector3(0, 0, 0));
  const planeEulerRef = useRef(new THREE.Euler(0, 0, 0));
  const planeMeshRef = useRef<THREE.Group>(null);
  
  // Animation frame reference for canceling animations
  const animationFrameRef = useRef<number>(0);
  
  // Drag state for rotation
  const isDraggingRotate = useRef(false);
  const lastMouse = useRef<{x: number, y: number} | null>(null);

  // Enable stencil globally
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  const geometry = useMemo(() => createGeometry(geometryType), [geometryType]);

  // Handle Reset Trigger
  useEffect(() => {
    if (triggerReset === 0) return;
    
    // Cancel any ongoing camera animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    // Reset Plane
    planePosRef.current.set(0, 0, 0);
    planeEulerRef.current.set(0, 0, 0);

    // Reset Camera View completely
    const defaultPos = new THREE.Vector3(4, 4, 6);
    const defaultTarget = new THREE.Vector3(0, 0, 0);

    if (controls) {
      const orbit = controls as any;
      orbit.object.position.copy(defaultPos);
      orbit.target.copy(defaultTarget);
      orbit.update();
    } else {
      camera.position.copy(defaultPos);
      camera.lookAt(defaultTarget);
    }
  }, [triggerReset, camera, controls]);

  // Handle Align View Animation
  useEffect(() => {
    if (triggerAlignView === 0) return;

    // Cancel existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const normal = plane.normal.clone();
    const center = new THREE.Vector3(0, 0, 0);
    const distance = 5; // Distance to view from
    
    // Calculate target position
    // We multiply by -distance to position the camera on the "clipped" side,
    // looking towards the object. This ensures we face the cross-section (red cap).
    const targetPos = center.clone().add(normal.multiplyScalar(-distance));

    const startPos = camera.position.clone();
    const startTime = Date.now();
    const duration = 1000;

    const animateCam = () => {
      const now = Date.now();
      const t = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(0,0,0);

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animateCam);
      } else {
        // Ensure orbit controls target is reset to center
        if(controls) {
          (controls as any).target.set(0,0,0);
          (controls as any).update();
        }
        animationFrameRef.current = 0;
      }
    };
    animateCam();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [triggerAlignView, camera, plane, controls]);

  // Mouse Interaction Logic
  // Supports Right Click Drag (Desktop) OR Left Click Drag (Tablet/Mobile Mode)
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onPointerDown = (e: PointerEvent) => {
      const isRightClick = e.button === 2;
      const isLeftClick = e.button === 0;
      const isKnifeMode = interactionMode === 'knife';

      // Allow rotation if Right Click OR (Left Click AND Knife Mode)
      if (isRightClick || (isKnifeMode && isLeftClick)) {
        isDraggingRotate.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        
        // Optional: Capture pointer to ensure we get move events even outside canvas
        if (canvas.setPointerCapture) {
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (err) {
            // Ignore errors if pointer capture fails
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isFrozen) return;
      if (isDraggingRotate.current && lastMouse.current) {
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };

        // Sensitivity
        const speed = 0.01;
        
        // Map screen drag to Euler rotation
        planeEulerRef.current.y -= deltaX * speed;
        planeEulerRef.current.x -= deltaY * speed;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRotate.current) {
        isDraggingRotate.current = false;
        lastMouse.current = null;
        canvas.style.cursor = interactionMode === 'knife' ? 'grab' : 'auto';
        
        if (canvas.releasePointerCapture) {
          try {
            canvas.releasePointerCapture(e.pointerId);
          } catch (err) {
            // Ignore
          }
        }
      }
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl.domElement, isFrozen, interactionMode]);

  // Keyboard Rotation Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFrozen) return;
      const euler = planeEulerRef.current;
      const step = 0.1;
      
      if (e.key.toLowerCase() === 'q') euler.z += step;
      if (e.key.toLowerCase() === 'e') euler.z -= step;
      if (e.key.toLowerCase() === 'a') euler.y += step;
      if (e.key.toLowerCase() === 'd') euler.y -= step;
      if (e.key.toLowerCase() === 'w') euler.x += step;
      if (e.key.toLowerCase() === 's') euler.x -= step;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFrozen]);


  useFrame((state) => {
     // Plane Position Update
     // In knife mode, we don't want mouse hover to move the plane position as aggressively
     // because touch users might just be dragging to rotate.
     // So we only update position if NOT dragging rotation.
     if (!isFrozen && !isDraggingRotate.current) {
        const mouse = state.mouse;
        const raycaster = state.raycaster;
        raycaster.setFromCamera(mouse, state.camera);

        const normal = new THREE.Vector3();
        state.camera.getWorldDirection(normal);
        const interactionPlane = new THREE.Plane(normal, 0);
        
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(interactionPlane, target);

        if (target) {
          target.clampLength(0, 2.5);
          // Lower lerp speed for smoother feel
          planePosRef.current.lerp(target, 0.15);
        }
     }

     // Update the THREE.Plane based on refs
     const pos = planePosRef.current;
     const rot = planeEulerRef.current;

     // Create a quaternion from euler
     const quat = new THREE.Quaternion().setFromEuler(rot);
     const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(quat).normalize();
     
     const constant = -normal.dot(pos);

     // Update actual clipping plane
     plane.normal.copy(normal);
     plane.constant = constant;
     
     // Update UI callback
     onUpdatePlane(pos, rot);
     
     // Update visual helper
     if (planeMeshRef.current) {
       planeMeshRef.current.position.copy(pos);
       planeMeshRef.current.quaternion.copy(quat);
     }
  });


  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      <Grid infiniteGrid fadeDistance={20} sectionColor="#a0a0a0" cellColor="#e5e5e5" position={[0, -3, 0]} />

      <Center>
        <SlicedObject geometry={geometry} plane={plane} renderOrder={1} />
      </Center>

      {/* The "Knife" Visualizer */}
      {!isFrozen && (
        <group ref={planeMeshRef}>
          <mesh>
            <planeGeometry args={[4, 4]} />
            <meshBasicMaterial 
              color={interactionMode === 'knife' ? "#fbbf24" : "#ffffff"}
              side={THREE.DoubleSide} 
              transparent 
              opacity={interactionMode === 'knife' ? 0.2 : 0.1} 
              depthWrite={false} 
            />
          </mesh>
          <lineSegments>
             <edgesGeometry args={[new THREE.PlaneGeometry(4, 4)]} />
             <lineBasicMaterial color={interactionMode === 'knife' ? "#fbbf24" : "#ffffff"} opacity={0.5} transparent />
          </lineSegments>
          {/* Rotation Ring Helper */}
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <ringGeometry args={[1.8, 1.85, 64]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <axesHelper args={[0.5]} />
        </group>
      )}

      {/* 
         OrbitControls Setup:
         - Enabled only in 'camera' mode.
         - Right click (PAN) is disabled via mouseButtons so it doesn't conflict with our custom Right-Click-To-Rotate-Knife logic.
      */}
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI} 
        enablePan={false} 
        enabled={interactionMode === 'camera'}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: null as any // Disable right click on OrbitControls
        }}
      />
    </>
  );
};
