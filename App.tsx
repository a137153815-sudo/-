
import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ImageCropper } from './components/ImageCropper';
import { HatEditor } from './components/HatEditor';
import { generateMatchingHat, HatOptions } from './services/geminiService';
import { RefreshCw, Gift, Sparkles, Palette, Grid3X3, Type, Globe } from 'lucide-react';

type Step = 'upload' | 'crop' | 'generate' | 'edit';
type Lang = 'zh' | 'en';

const translations = {
  zh: {
    title: "圣诞礼物工坊",
    subtitle: "为你的照片包装惊喜",
    step1: "选取照片",
    step2: "裁剪画面",
    step3: "正在变身",
    modeStructured: "挑选款式",
    modeFreeform: "自由咒语",
    labelPattern: "花纹", // Changed from Shape
    labelColor: "配色",
    labelDecor: "装饰",
    labelPrompt: "输入你的奇思妙想...",
    placeholderPrompt: "例如：一个粉色的毛绒发卡，带有星星装饰...",
    btnGenerate: "开始制作",
    btnGenerating: "包装中...",
    btnRetake: "重选",
    patterns: { solid: "纯色", striped: "条纹", plaid: "格纹", snowflakes: "雪花", dots: "波点" }, // New patterns
    colors: { Red: "红", Green: "绿", Gold: "金", Blue: "蓝", Pink: "粉" },
    decors: { Bells: "铃铛", Holly: "冬青", Stars: "星星", Lights: "彩灯" },
    errorGeneric: "魔法失效了，请重试",
    unboxing: "惊喜即将揭晓",
  },
  en: {
    title: "XMAS GIFT SHOP",
    subtitle: "Wrap a surprise for your photo",
    step1: "Upload",
    step2: "Crop",
    step3: "Magic",
    modeStructured: "Styles",
    modeFreeform: "Custom",
    labelPattern: "Pattern", // Changed from Shape
    labelColor: "Color",
    labelDecor: "Decor",
    labelPrompt: "Describe your hat...",
    placeholderPrompt: "E.g. A pink fluffy headband with stars...",
    btnGenerate: "Make it!",
    btnGenerating: "Wrapping...",
    btnRetake: "Reset",
    patterns: { solid: "Solid", striped: "Striped", plaid: "Plaid", snowflakes: "Snow", dots: "Dots" }, // New patterns
    colors: { Red: "Red", Green: "Green", Gold: "Gold", Blue: "Blue", Pink: "Pink" },
    decors: { Bells: "Bells", Holly: "Holly", Stars: "Stars", Lights: "Lights" },
    errorGeneric: "Magic failed, try again",
    unboxing: "Unwrapping...",
  }
};

const OptionBtn: React.FC<{ active: boolean, label: string, onClick: () => void, icon?: React.ReactNode }> = ({ active, label, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`
      relative px-3 py-3 text-sm font-cute transition-all rounded-xl
      flex flex-col items-center justify-center gap-1 shadow-[0_2px_0_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none
      ${active 
        ? 'bg-[#D32F2F] text-white scale-105 shadow-[0_4px_0_#B71C1C]' 
        : 'bg-[#FFEBEE] text-[#D32F2F] hover:bg-[#FFCDD2]'}
    `}
  >
    {icon && <span className={active ? 'opacity-100' : 'opacity-70'}>{icon}</span>}
    {label}
  </button>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('zh');
  const t = translations[lang];

  const [step, setStep] = useState<Step>('upload');
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropTransform, setCropTransform] = useState<{ x: number, y: number, scale: number } | null>(null);
  
  const [hatAsset, setHatAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnboxing, setIsUnboxing] = useState(false);

  const [hatOptions, setHatOptions] = useState<HatOptions>({
    mode: 'structured',
    pattern: 'solid', // Default pattern
    color: 'Red',
    material: 'Velvet',
    trim: 'Classic',
    decor: [],
    customPrompt: '',
  });

  const handleImageSelected = (base64: string, mimeType: string, file: File) => {
    setRawImage(base64);
    setStep('crop');
    setError(null);
  };

  const handleCropConfirmed = (croppedBase64: string, transform: { x: number, y: number, scale: number }) => {
    setCroppedImage(croppedBase64);
    setCropTransform(transform);
    setStep('generate');
  };

  const startGeneration = async () => {
    if (!croppedImage) return;
    setLoading(true);
    setIsUnboxing(false);
    setError(null);

    try {
      const base64Data = croppedImage.split(',')[1];
      const result = await generateMatchingHat(base64Data, 'image/jpeg', hatOptions);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.imageUrl) {
        setHatAsset(result.imageUrl);
        setTimeout(() => {
          setIsUnboxing(true);
          setLoading(false);
          setTimeout(() => setStep('edit'), 800); 
        }, 1000); 
      }
    } catch (e) {
      setError(t.errorGeneric);
      setLoading(false);
    }
  };

  const reset = () => {
    setRawImage(null);
    setCroppedImage(null);
    setHatAsset(null);
    setCropTransform(null);
    setStep('upload');
    setError(null);
    setIsUnboxing(false);
  };

  const toggleDecor = (item: string) => {
    setHatOptions(prev => {
      const exists = prev.decor.includes(item);
      return {
        ...prev,
        decor: exists ? prev.decor.filter(d => d !== item) : [...prev.decor, item]
      };
    });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 relative z-10">
      
      {/* MAIN CARD CONTAINER */}
      <div className="w-full max-w-md bg-[#FFF9F0] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden h-[90vh] ring-8 ring-white">
         
         {/* VERTICAL RIBBON DECORATION (Only visual) */}
         {!isUnboxing && step !== 'edit' && (
           <div className="absolute top-0 left-8 w-8 h-full bg-[#FFEBEE] z-0 pointer-events-none"></div>
         )}
         {!isUnboxing && step !== 'edit' && (
           <div className="absolute top-0 right-8 w-8 h-full bg-[#FFEBEE] z-0 pointer-events-none"></div>
         )}

         {/* HEADER - Solid Block Style */}
         <div className="relative z-20 pt-8 pb-4 px-6 flex flex-col items-center justify-center gap-3">
            
            {/* Lang Switch (Absolute Top Right) */}
            <button 
              onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
              className="absolute top-6 right-6 bg-[#FFEBEE] text-[#D32F2F] w-10 h-10 rounded-full flex items-center justify-center font-bold hover:bg-[#D32F2F] hover:text-white transition-colors shadow-sm"
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Logo Block */}
            <div className="w-16 h-16 bg-[#D32F2F] rounded-2xl flex items-center justify-center shadow-[0_4px_0_#B71C1C] rotate-3 hover:rotate-6 transition-transform">
               <Gift className="w-8 h-8 text-white" />
            </div>

            {/* Title Block - Signage Style */}
            <div className="bg-[#FFEBEE] px-6 py-3 rounded-2xl border-2 border-[#D32F2F] shadow-[0_4px_0_#D32F2F] flex flex-col items-center relative">
               {/* Decor Dots */}
               <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#D32F2F]"></div>
               <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D32F2F]"></div>
               <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#D32F2F]"></div>
               <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#D32F2F]"></div>
               
               <h1 className="font-cute text-2xl text-[#D32F2F] tracking-widest leading-none">
                  {t.title}
               </h1>
            </div>
         </div>

         {/* MAIN CONTENT AREA */}
         <div className="flex-1 relative z-10 bg-white mx-4 mb-4 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">
            
            {/* UNBOXING LID ANIMATION */}
            {isUnboxing && (
               <div className="absolute inset-0 z-50 bg-[#D32F2F] flex flex-col items-center justify-center animate-lid-open shadow-2xl">
                  <div className="bg-white p-6 rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)]">
                     <Gift className="w-20 h-20 text-[#D32F2F] animate-bounce" />
                  </div>
                  <h2 className="text-white text-2xl font-cute mt-8">{t.unboxing}</h2>
               </div>
            )}

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isUnboxing ? 'animate-content-appear' : ''}`}>
                
                {/* Step 1: Upload */}
                {step === 'upload' && (
                   <div className="flex-1 p-4 flex flex-col">
                      <UploadZone onImageSelected={handleImageSelected} lang={lang} />
                   </div>
                )}

                {/* Step 2: Crop */}
                {step === 'crop' && rawImage && (
                   <ImageCropper 
                     imageSrc={rawImage}
                     onConfirm={handleCropConfirmed}
                     onCancel={reset}
                     lang={lang}
                   />
                )}

                {/* Step 3: Generate */}
                {step === 'generate' && croppedImage && (
                   <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {/* Preview Area (Becomes Blind Box when Loading) */}
                      <div className="relative shrink-0 bg-[#FFEBEE] p-6 flex items-center justify-center overflow-hidden">
                          {loading && (
                            <LoadingSpinner lang={lang} />
                          )}
                          <div className="p-1 bg-white rounded-2xl shadow-lg transform -rotate-1">
                             <img src={croppedImage} className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl bg-gray-100" />
                          </div>
                      </div>

                      {/* Options Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-5">
                         {/* Tabs - Solid Blocks */}
                         <div className="flex gap-2 p-1 bg-[#FFEBEE] rounded-xl">
                            <button 
                              onClick={() => setHatOptions(h => ({...h, mode: 'structured'}))}
                              className={`flex-1 py-3 rounded-lg text-sm font-cute transition-all ${hatOptions.mode === 'structured' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#D32F2F]/60'}`}
                            >
                              {t.modeStructured}
                            </button>
                            <button 
                              onClick={() => setHatOptions(h => ({...h, mode: 'freeform'}))}
                              className={`flex-1 py-3 rounded-lg text-sm font-cute transition-all ${hatOptions.mode === 'freeform' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#D32F2F]/60'}`}
                            >
                              {t.modeFreeform}
                            </button>
                         </div>

                         {hatOptions.mode === 'structured' ? (
                           <div className="space-y-5 pb-20">
                             {/* Pattern (was Shape) */}
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-[#D32F2F] flex items-center gap-2">
                                   <Grid3X3 className="w-4 h-4"/> {t.labelPattern}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                   {Object.keys(t.patterns).map(k => (
                                     <OptionBtn key={k} active={hatOptions.pattern === k} label={t.patterns[k as keyof typeof t.patterns]} onClick={() => setHatOptions({...hatOptions, pattern: k})} />
                                   ))}
                                </div>
                             </div>
                             {/* Color */}
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-[#D32F2F] flex items-center gap-2">
                                   <Palette className="w-4 h-4"/> {t.labelColor}
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                   {Object.keys(t.colors).map(k => (
                                     <button 
                                       key={k} 
                                       onClick={() => setHatOptions({...hatOptions, color: k})}
                                       className={`h-10 rounded-full transition-transform shadow-[0_2px_0_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none ${hatOptions.color === k ? 'scale-110 ring-4 ring-[#FFEBEE]' : ''}`}
                                       style={{ backgroundColor: k.toLowerCase() === 'gold' ? '#FFD700' : k.toLowerCase() }}
                                     />
                                   ))}
                                </div>
                             </div>
                             {/* Decor */}
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-[#D32F2F] flex items-center gap-2">
                                   <Sparkles className="w-4 h-4"/> {t.labelDecor}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                   {Object.keys(t.decors).map(k => (
                                     <OptionBtn key={k} active={hatOptions.decor.includes(k)} label={t.decors[k as keyof typeof t.decors]} onClick={() => toggleDecor(k)} />
                                   ))}
                                </div>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-[#D32F2F] flex items-center gap-2">
                                 <Type className="w-4 h-4"/> {t.labelPrompt}
                              </label>
                              <textarea 
                                className="w-full h-32 p-4 bg-[#FFEBEE] rounded-xl text-[#D32F2F] placeholder-[#D32F2F]/40 outline-none resize-none font-cute focus:ring-2 focus:ring-[#D32F2F]"
                                placeholder={t.placeholderPrompt}
                                value={hatOptions.customPrompt}
                                onChange={(e) => setHatOptions({...hatOptions, customPrompt: e.target.value})}
                              />
                           </div>
                         )}
                      </div>

                      {/* Footer Actions */}
                      <div className="absolute bottom-0 left-0 w-full p-4 bg-white/95 border-t-2 border-[#FFEBEE] flex gap-3">
                         <button onClick={reset} disabled={loading} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#FFEBEE] text-[#D32F2F] shadow-[0_4px_0_#FFCDD2] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                            <RefreshCw className="w-6 h-6" />
                         </button>
                         <button 
                            onClick={startGeneration}
                            disabled={loading}
                            className="flex-1 h-14 bg-[#D32F2F] text-white rounded-2xl font-cute text-xl shadow-[0_4px_0_#B71C1C] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-80 disabled:translate-y-0 disabled:shadow-none"
                         >
                            {loading ? <span className="animate-pulse">{t.btnGenerating}</span> : <><Sparkles className="w-6 h-6" /> {t.btnGenerate}</>}
                         </button>
                      </div>
                   </div>
                )}

                {/* Step 4: Edit */}
                {step === 'edit' && rawImage && hatAsset && (
                   <HatEditor 
                      rawImage={rawImage}
                      hatImage={hatAsset}
                      initialPhotoTransform={cropTransform || { x: 0, y: 0, scale: 1 }}
                      onBack={() => setStep('generate')}
                      onRetry={startGeneration}
                      lang={lang}
                   />
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
