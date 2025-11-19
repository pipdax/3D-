import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SlicerScene } from './components/SlicerScene';
import { UIOverlay } from './components/UIOverlay';
import { GeometryType } from './types';

export type InteractionMode = 'camera' | 'knife';

const App: React.FC = () => {
  const [geometryType, setGeometryType] = useState<GeometryType>(GeometryType.CUBE);
  const [isFrozen, setIsFrozen] = useState(false);
  const [alignTrigger, setAlignTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('camera');
  
  // Refs to track click vs drag
  const clickStartRef = useRef<{x: number, y: number, t: number} | null>(null);

  const handleReset = useCallback(() => {
    setIsFrozen(false);
    setAlignTrigger(0);
    // Increment reset trigger to notify scene to reset plane orientation
    setResetTrigger(prev => prev + 1);
    setInteractionMode('camera'); // Reset to camera mode
  }, []);

  const handleUpdatePlane = useCallback((pos: THREE.Vector3, rot: THREE.Euler) => {
    // This callback allows us to display debug info if we wanted to
    // console.log(pos, rot);
  }, []);

  // Handle Pointer Down to start click tracking
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only track left mouse button (button 0)
    if (e.button === 0) {
      clickStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        t: Date.now()
      };
    }
  };

  // Handle Pointer Up to determine if it was a click
  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.button === 0 && clickStartRef.current) {
      const dx = Math.abs(e.clientX - clickStartRef.current.x);
      const dy = Math.abs(e.clientY - clickStartRef.current.y);
      const dt = Date.now() - clickStartRef.current.t;
      
      // If movement is small (< 10px) and duration is short (< 300ms), treat as click
      // This prevents "cutting" when the user just meant to rotate the camera
      if (dx < 10 && dy < 10 && dt < 300) {
         if (!isFrozen && interactionMode === 'camera') {
           setIsFrozen(true);
         }
      }
    }
    clickStartRef.current = null;
  };

  return (
    <div className="relative w-full h-full bg-slate-50">
      {/* 
        Wrapper div handles global interactions.
        onPointerDown/Up handles the "Click to Cut" logic safely.
        onDoubleClick handles "Unfreeze".
      */}
      <div 
        className="absolute inset-0" 
        onDoubleClick={() => setIsFrozen(false)} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <Canvas
          shadows
          camera={{ position: [4, 4, 6], fov: 45 }}
          gl={{ 
            antialias: true, 
            stencil: true, // CRITICAL: Enable stencil buffer for the cap rendering
            localClippingEnabled: true 
          }}
          dpr={[1, 2]}
        >
          <SlicerScene 
            geometryType={geometryType} 
            isFrozen={isFrozen}
            triggerAlignView={alignTrigger}
            triggerReset={resetTrigger}
            onUpdatePlane={handleUpdatePlane}
            interactionMode={interactionMode}
          />
        </Canvas>
      </div>

      <UIOverlay 
        currentShape={geometryType}
        onShapeChange={(t) => {
          setGeometryType(t);
          setIsFrozen(false);
          setResetTrigger(prev => prev + 1); // Also reset plane when shape changes for better UX
        }}
        isFrozen={isFrozen}
        onToggleFreeze={() => setIsFrozen(!isFrozen)}
        onReset={handleReset}
        onAlignView={() => setAlignTrigger(prev => prev + 1)}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
      />
    </div>
  );
};

export default App;