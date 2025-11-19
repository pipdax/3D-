import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SlicerScene } from './components/SlicerScene';
import { UIOverlay } from './components/UIOverlay';
import { GeometryType } from './types';

const App: React.FC = () => {
  const [geometryType, setGeometryType] = useState<GeometryType>(GeometryType.CUBE);
  const [isFrozen, setIsFrozen] = useState(false);
  const [alignTrigger, setAlignTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleReset = useCallback(() => {
    setIsFrozen(false);
    setAlignTrigger(0);
    // Increment reset trigger to notify scene to reset plane orientation
    setResetTrigger(prev => prev + 1);
  }, []);

  const handleUpdatePlane = useCallback((pos: THREE.Vector3, rot: THREE.Euler) => {
    // This callback allows us to display debug info if we wanted to
    // console.log(pos, rot);
  }, []);

  // Global click handler for the "Execute Cut" interaction
  // We wrap the canvas in a div that captures clicks if not on UI
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Simple logic: if clicking on canvas and not frozen, freeze it.
    if (!isFrozen) {
      setIsFrozen(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50">
      <div className="absolute inset-0" onDoubleClick={() => setIsFrozen(false)} onClick={handleCanvasClick}>
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
      />
    </div>
  );
};

export default App;