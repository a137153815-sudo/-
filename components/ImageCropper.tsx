import React, { useState, useRef } from 'react';
import { getCroppedImg } from '../utils/fileUtils';
import { Check, X, Scissors } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBase64: string, transform: { x: number; y: number; scale: number }) => void;
  onCancel: () => void;
  lang: 'zh' | 'en';
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel, lang }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const t = lang === 'zh' ? "完成裁剪" : "Done";
  
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPanRef.current.x, y: e.clientY - startPanRef.current.y });
  };

  const handleDone = async () => {
    if (!containerRef.current) return;
    const croppedImage = await getCroppedImg(
      imageSrc,
      { x: 0, y: 0, width: 0, height: 0 },
      { x: pan.x, y: pan.y, scale: zoom },
      containerRef.current.clientWidth
    );
    const normX = pan.x / containerRef.current.clientWidth;
    const normY = pan.y / containerRef.current.clientHeight;
    onConfirm(croppedImage, { x: normX, y: normY, scale: zoom });
  };

  return (
    <div className="flex flex-col h-full p-4 animate-in fade-in duration-300">
      
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Solid Frame */}
        <div className="relative p-4 bg-[#FFEBEE] rounded-[2rem] shadow-none">
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D32F2F] text-white px-4 py-2 rounded-xl text-sm font-cute flex items-center gap-1 shadow-[0_4px_0_#B71C1C]">
              <Scissors className="w-4 h-4" /> {lang === 'zh' ? '调整位置' : 'Adjust'}
           </div>
           
           <div 
            ref={containerRef}
            className="relative w-[280px] h-[280px] bg-white rounded-2xl overflow-hidden cursor-move touch-none border-4 border-dashed border-[#D32F2F]/20"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          >
            <img
              src={imageSrc}
              draggable={false}
              className="absolute top-1/2 left-1/2 w-auto h-auto max-w-full max-h-full object-contain select-none"
              style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          </div>
        </div>

        <div className="w-[280px] mt-8 flex items-center gap-3">
           <span className="text-sm font-bold text-[#D32F2F]">-</span>
           <input 
             type="range" min="0.5" max="5" step="0.1" 
             value={zoom} 
             onChange={(e) => setZoom(parseFloat(e.target.value))}
             className="flex-1"
           />
           <span className="text-sm font-bold text-[#D32F2F]">+</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onCancel} className="w-14 h-14 rounded-2xl bg-[#FFEBEE] flex items-center justify-center text-[#D32F2F] shadow-[0_4px_0_#FFCDD2] active:translate-y-1 active:shadow-none transition-all">
          <X className="w-6 h-6" />
        </button>
        <button 
          onClick={handleDone}
          className="flex-1 h-14 bg-[#D32F2F] text-white font-cute text-xl rounded-2xl shadow-[0_4px_0_#B71C1C] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6" /> {t}
        </button>
      </div>
    </div>
  );
};