import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { compressImage, getMimeType } from '../utils/fileUtils';

interface UploadZoneProps {
  onImageSelected: (base64: string, mimeType: string, file: File) => void;
  lang: 'zh' | 'en';
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, lang }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const t = lang === 'zh' ? "点击上传照片" : "Tap to Upload";

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      const base64 = await compressImage(file, 1280);
      const mimeType = getMimeType(file);
      onImageSelected(base64, mimeType, file);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsHovering(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) processFile(file);
      }}
      className="flex-1 w-full flex flex-col items-center justify-center cursor-pointer group"
    >
      {/* SOLID BLOCK CARD */}
      <div className={`
        relative w-64 h-80 bg-[#D32F2F] rounded-[2rem] shadow-[0_8px_0_#B71C1C]
        flex flex-col items-center justify-center gap-6 transition-all duration-300
        ${isHovering ? 'scale-105 -rotate-2' : 'group-hover:scale-105 group-hover:-rotate-1'}
      `}>
         
         {/* Icon Container */}
         <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] group-hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] transition-all">
            <Upload className="w-10 h-10 text-[#D32F2F]" />
         </div>
         
         <div className="flex flex-col items-center gap-2">
            <div className="bg-[#B71C1C]/20 px-4 py-1 rounded-full">
               <ImageIcon className="w-4 h-4 text-white/80" />
            </div>
            <div className="text-white font-cute text-xl font-bold tracking-wider px-6 text-center">
               {t}
            </div>
         </div>
         
         {/* Decor Lines */}
         <div className="absolute bottom-6 w-12 h-1 rounded-full bg-white/20"></div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};