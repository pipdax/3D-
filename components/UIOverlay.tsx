import React from 'react';
import { GeometryType, SHAPES } from '../types';
import { 
  RotateCcw, 
  Eye, 
  Scissors,
  Lock,
  Unlock
} from 'lucide-react';

interface UIOverlayProps {
  currentShape: GeometryType;
  onShapeChange: (shape: GeometryType) => void;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  onReset: () => void;
  onAlignView: () => void;
}

// Map geometry types to Chinese names
const SHAPE_NAMES: Record<GeometryType, string> = {
  [GeometryType.CUBE]: '立方体',
  [GeometryType.SPHERE]: '球体',
  [GeometryType.CYLINDER]: '圆柱体',
  [GeometryType.CONE]: '圆锥体',
  [GeometryType.TORUS]: '圆环体',
  [GeometryType.TETRAHEDRON]: '四面体',
  [GeometryType.OCTAHEDRON]: '八面体',
  [GeometryType.DODECAHEDRON]: '十二面体',
  [GeometryType.ICOSAHEDRON]: '二十面体',
  [GeometryType.CAPSULE]: '胶囊体',
  [GeometryType.HEXPRISM]: '六棱柱',
};

// Custom SVG Icon Component for Shapes to ensure they look "Real" and distinct
const ShapeIcon: React.FC<{ type: GeometryType; className?: string }> = ({ type, className = "w-6 h-6" }) => {
  switch (type) {
    case GeometryType.CUBE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" /><path d="M3 9h18" /> {/* Looks more like a box frame */}
        </svg>
      );
    case GeometryType.SPHERE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15 15 0 0 0 0 20" />
          <path d="M2 12h20" />
        </svg>
      );
    case GeometryType.CYLINDER:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case GeometryType.CONE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <ellipse cx="12" cy="19" rx="9" ry="3" />
          <path d="M3 19L12 2l9 17" />
        </svg>
      );
    case GeometryType.TORUS:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <ellipse cx="12" cy="12" rx="10" ry="6" />
          <ellipse cx="12" cy="12" rx="3" ry="1" />
        </svg>
      );
    case GeometryType.TETRAHEDRON:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 2L3 20h18L12 2z" />
          <path d="M12 2v18" />
        </svg>
      );
    case GeometryType.OCTAHEDRON:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 2L3 12l9 10 9-10L12 2z" />
          <path d="M3 12h18" />
          <path d="M12 2v20" />
        </svg>
      );
    case GeometryType.DODECAHEDRON:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 2l8.5 6.2-3.3 10.8h-10.4L3.5 8.2z" />
          <path d="M12 12l-3 9" /><path d="M12 12l3 9" /><path d="M12 12V2" />
        </svg>
      );
    case GeometryType.ICOSAHEDRON:
       return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
           <path d="M12 2l9 5.5v9L12 22l-9-5.5v-9z" />
           <path d="M12 2l5 9-5 11-5-11z" />
        </svg>
       );
    case GeometryType.CAPSULE:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="6" y="6" width="12" height="12" rx="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      );
    case GeometryType.HEXPRISM:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 2l8 4v12l-8 4-8-4V6z" />
          <path d="M4 6l8 4 8-4" />
          <path d="M12 10v12" />
        </svg>
      );
    default:
      return <div className={className} />;
  }
};

export const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  onShapeChange,
  isFrozen,
  onToggleFreeze,
  onReset,
  onAlignView
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header / Title */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Scissors className="w-8 h-8 text-blue-600" />
            3D几何剖面探究实验室
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-md">
            移动鼠标定位切面。<b>右键拖动</b> 或 <b>Q/E/W/A/S/D</b> 旋转刀具。左键点击锁定切割。
          </p>
        </div>
      </div>

      {/* Left Sidebar: Shape Selector - Updated to Grid Layout with Scroll */}
      <div className="absolute left-6 top-24 bottom-32 pointer-events-auto flex flex-col">
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col h-full max-h-[60vh]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">选择图形</h3>
          <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
            <div className="grid grid-cols-2 gap-2">
              {SHAPES.map((shape) => (
                <button
                  key={shape}
                  onClick={() => onShapeChange(shape)}
                  className={`
                    relative group p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 aspect-square
                    ${currentShape === shape 
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-sm' 
                      : 'bg-slate-50 text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md border border-transparent hover:border-blue-200'
                    }
                  `}
                >
                  <ShapeIcon type={shape} className={`w-8 h-8 mb-1 ${currentShape === shape ? 'stroke-[1.5px]' : 'stroke-[1.5px]'}`} />
                  <span className="text-[10px] font-medium leading-tight text-center">{SHAPE_NAMES[shape]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Actions */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-4">
        
        {/* Align View Button */}
        <button
          onClick={onAlignView}
          className="flex flex-col items-center gap-1 group"
          title="垂直观察切面"
        >
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 text-slate-700 group-hover:text-blue-600 ring-1 ring-slate-900/5">
            <Eye className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">正视剖面</span>
        </button>

         {/* Reset Button */}
         <button
          onClick={onReset}
          className="flex flex-col items-center gap-1 group"
          title="重置物体状态"
        >
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 text-slate-700 group-hover:text-red-500 ring-1 ring-slate-900/5">
            <RotateCcw className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">重置</span>
        </button>
      </div>

      {/* Bottom Control Bar: Action Button */}
      <div className="pointer-events-auto self-center mb-4">
        <button
          onClick={onToggleFreeze}
          className={`
            px-10 py-4 rounded-full font-bold text-xl shadow-2xl transition-all duration-300 flex items-center gap-3
            ${isFrozen 
              ? 'bg-slate-800 text-white hover:bg-slate-900 ring-4 ring-slate-200 scale-100' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-blue-500/30 ring-4 ring-blue-200/50'
            }
          `}
        >
          {isFrozen ? (
            <>
              <Unlock className="w-6 h-6" />
              解锁 / 继续切割
            </>
          ) : (
            <>
              <Lock className="w-6 h-6" />
              点击执行切割
            </>
          )}
        </button>
      </div>
      
      {/* Hints */}
      <div className="absolute bottom-6 left-6 pointer-events-none text-xs text-slate-500 font-medium space-y-1.5 bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/40">
        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 左键点击：执行切割 / 锁定</p>
        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> 右键拖动：旋转刀具</p>
        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> 空白处左键拖动：旋转视角</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};