
import React, { useEffect, useState } from 'react';
import { HelpCircle, Scissors, Palette, Sparkles, PenTool } from 'lucide-react';

interface LoadingSpinnerProps {
  lang: 'zh' | 'en';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ lang }) => {
  const [textIndex, setTextIndex] = useState(0);

  const messages = lang === 'zh' 
    ? ["正在裁剪布料...", "缝制天鹅绒...", "调配复古滤镜...", "匹配光影风格...", "注入圣诞魔法..."]
    : ["Cutting fabric...", "Sewing velvet...", "Matching art style...", "Adjusting lighting...", "Adding magic..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#FFEBEE] rounded-2xl">
      
      {/* 1. The Box Container - Shakes after wrapping */}
      <div className="relative w-full h-full bg-[#D32F2F] flex items-center justify-center overflow-hidden animate-[shake-hard_2s_ease-in-out_infinite_1s]">
         
         {/* Texture on Box */}
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }}>
         </div>

         {/* 2. Crafting Tools Floating Up (Visualizing the "Making" process) */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Scissors - Cut */}
            <div className="absolute top-[60%] left-[30%] text-[#FFF9F0]/80 animate-[float-tool-left_2.5s_infinite_1s]">
               <Scissors className="w-8 h-8" />
            </div>
            {/* Palette - Color */}
            <div className="absolute top-[60%] right-[30%] text-[#FFF9F0]/80 animate-[float-tool-right_2.5s_infinite_1.5s]">
               <Palette className="w-8 h-8" />
            </div>
            {/* Needle - Sew */}
            <div className="absolute top-[50%] left-[40%] text-[#FFF9F0]/80 animate-[float-tool-center_3s_infinite_0.5s]">
               <PenTool className="w-6 h-6 rotate-45" />
            </div>
            {/* Sparkles - Magic */}
            <div className="absolute top-[55%] right-[40%] text-yellow-300 animate-[float-tool-center_2s_infinite_2s]">
               <Sparkles className="w-10 h-10" />
            </div>
         </div>

         {/* 3. Ribbons - Grow animation */}
         {/* Vertical Ribbon */}
         <div className="absolute top-0 bottom-0 w-8 bg-[#FFF9F0] shadow-sm animate-[ribbon-grow-v_0.8s_ease-out_forwards_0.5s] h-0 opacity-0"></div>
         {/* Horizontal Ribbon */}
         <div className="absolute left-0 right-0 h-8 bg-[#FFF9F0] shadow-sm animate-[ribbon-grow-h_0.8s_ease-out_forwards_0.5s] w-0 opacity-0"></div>

         {/* 4. The Mystery Badge (Question Mark) - Pops up */}
         <div className="relative z-10 bg-[#B71C1C] w-20 h-20 rounded-2xl rotate-6 flex items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.2)] animate-[box-appear_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards_1s] opacity-0 scale-0">
             <HelpCircle className="w-10 h-10 text-[#FFF9F0]" />
         </div>

      </div>

      {/* 5. Loading Text - Floating Badge at bottom */}
      <div className="absolute bottom-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border-2 border-[#D32F2F]/10 z-30">
         <span className="text-[#D32F2F] font-cute text-lg font-bold tracking-wide">
            {messages[textIndex]}
         </span>
      </div>

      {/* 0. Initial Curtain (The 'Wrapping Paper' sliding down) */}
      <div className="absolute inset-0 bg-[#D32F2F] z-20 animate-[paper-slide-down_0.5s_ease-out_forwards] pointer-events-none"></div>

    </div>
  );
};
