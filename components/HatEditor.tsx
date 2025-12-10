import React, { useState, useRef } from 'react';
import { ChevronLeft, Download, Move, Camera, Sticker, Maximize2, RotateCw } from 'lucide-react';
import { composeFinalLayeredImage } from '../utils/fileUtils';

interface HatEditorProps {
  rawImage: string;
  hatImage: string;
  initialPhotoTransform: { x: number; y: number; scale: number };
  onBack: () => void;
  onRetry: () => void;
  lang: 'zh' | 'en';
}

export const HatEditor: React.FC<HatEditorProps> = ({ 
  rawImage, 
  hatImage, 
  initialPhotoTransform, 
  onBack, 
  onRetry,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'hat' | 'photo'>('hat');
  const [photoPos, setPhotoPos] = useState({ x: initialPhotoTransform.x, y: initialPhotoTransform.y });
  const [photoScale, setPhotoScale] = useState(initialPhotoTransform.scale);
  const [hatPos, setHatPos] = useState({ x: 0.5, y: 0.2 });
  const [hatScale, setHatScale] = useState(1.0);
  const [hatRotation, setHatRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startDragRef = useRef({ x: 0, y: 0 });

  const t = {
    zh: { hat: "调整帽子", photo: "调整照片", save: "保存图片", retry: "重做", saveFail: "保存失败" },
    en: { hat: "Edit Hat", photo: "Edit Photo", save: "Save", retry: "Retry", saveFail: "Failed" }
  }[lang];

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startDragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - startDragRef.current.x) / rect.width;
    const deltaY = (e.clientY - startDragRef.current.y) / rect.height;
    startDragRef.current = { x: e.clientX, y: e.clientY };

    if (activeTab === 'hat') {
      setHatPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    } else {
      setPhotoPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalUrl = await composeFinalLayeredImage(
        rawImage, 
        hatImage, 
        { x: photoPos.x, y: photoPos.y, scale: photoScale },
        { x: hatPos.x, y: hatPos.y, scale: hatScale, rotation: hatRotation }
      );
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = `XMAS_GIFT_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(t.saveFail);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FFF9F0]">
      
      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#FFEBEE] relative overflow-hidden rounded-b-[2rem]">
         {/* Pattern */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D32F2F 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

         <div className="relative w-[300px] h-[300px] shadow-2xl bg-white p-2 rounded-3xl">
            
            {/* Movable Badge - Solid Block */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D32F2F] px-4 py-2 rounded-xl shadow-md text-white text-xs font-cute flex items-center gap-1 z-20">
               <Move className="w-3 h-3" /> {lang === 'zh' ? '拖动画面' : 'Drag to Move'}
            </div>

            <div 
              ref={containerRef}
              className="w-full h-full relative overflow-hidden cursor-move touch-none rounded-2xl bg-gray-50"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => isDragging.current = false}
              onPointerLeave={() => isDragging.current = false}
            >
               {/* Photo Layer */}
               <div className="absolute inset-0 pointer-events-none">
                 <img 
                   src={rawImage} 
                   className="w-full h-full object-contain"
                   style={{ transform: `translate(${photoPos.x * 100}%, ${photoPos.y * 100}%) scale(${photoScale})` }}
                 />
               </div>
               {/* Hat Layer */}
               <div 
                className="absolute w-1/2 h-1/2 flex items-center justify-center top-0 left-0 pointer-events-none"
                style={{ transform: `translate(${hatPos.x * 300 - 75}px, ${hatPos.y * 300 - 75}px) rotate(${hatRotation}deg) scale(${hatScale})` }}
              >
                <img src={hatImage} className="w-full h-full object-contain filter drop-shadow-xl" />
              </div>
            </div>
         </div>
      </div>

      {/* Controls Area */}
      <div className="bg-white p-4 space-y-4 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         
         {/* Tab Switcher - Solid Blocks */}
         <div className="flex gap-2 p-1 bg-[#FFEBEE] rounded-xl">
            <button 
              onClick={() => setActiveTab('photo')}
              className={`flex-1 py-3 rounded-lg text-sm font-cute transition-all flex items-center justify-center gap-2 ${activeTab === 'photo' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#D32F2F]/60'}`}
            >
              <Camera className="w-4 h-4" /> {t.photo}
            </button>
            <button 
              onClick={() => setActiveTab('hat')}
              className={`flex-1 py-3 rounded-lg text-sm font-cute transition-all flex items-center justify-center gap-2 ${activeTab === 'hat' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#D32F2F]/60'}`}
            >
              <Sticker className="w-4 h-4" /> {t.hat}
            </button>
         </div>

         {/* Sliders - Clean */}
         <div className="space-y-4 px-2 py-2">
           {activeTab === 'hat' ? (
              <>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center text-[#D32F2F]"><Maximize2 className="w-4 h-4" /></div>
                   <input type="range" min="0.3" max="2.5" step="0.1" value={hatScale} onChange={(e) => setHatScale(parseFloat(e.target.value))} className="flex-1" />
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center text-[#D32F2F]"><RotateCw className="w-4 h-4" /></div>
                   <input type="range" min="-180" max="180" step="5" value={hatRotation} onChange={(e) => setHatRotation(parseInt(e.target.value))} className="flex-1" />
                </div>
              </>
           ) : (
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center text-[#D32F2F]"><Maximize2 className="w-4 h-4" /></div>
                  <input type="range" min="0.5" max="5" step="0.1" value={photoScale} onChange={(e) => setPhotoScale(parseFloat(e.target.value))} className="flex-1" />
              </div>
           )}
         </div>

         {/* Bottom Actions - Block Buttons */}
         <div className="flex gap-3 pt-2">
            <button onClick={onBack} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#FFEBEE] text-[#D32F2F] shadow-[0_4px_0_#FFCDD2] active:translate-y-1 active:shadow-none transition-all">
               <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={handleSave} className="flex-1 h-14 bg-[#D32F2F] text-white font-cute text-xl rounded-2xl shadow-[0_4px_0_#B71C1C] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
               <Download className="w-6 h-6" /> {t.save}
            </button>
         </div>

      </div>
    </div>
  );
};