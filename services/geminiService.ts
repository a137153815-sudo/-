
import { GoogleGenAI } from "@google/genai";
import { processHatAsset } from "../utils/fileUtils";

export interface GenerateHatResult {
  imageUrl: string | null;
  error?: string;
}

export interface HatOptions {
  mode: 'structured' | 'freeform';
  // Structured options
  pattern: string; // Changed from shape to pattern
  color: string;
  material: string;
  decor: string[];
  trim: string;
  // Freeform prompt
  customPrompt: string;
}

/**
 * Generates a Christmas hat asset using Gemini Flash Image.
 */
export const generateMatchingHat = async (
  base64Image: string,
  mimeType: string,
  options: HatOptions
): Promise<GenerateHatResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // Should not happen in standard env, but good to handle
      return { imageUrl: null, error: "API Key 未配置。" };
    }
    
    // Switch back to Flash Image (Nano Banana) for broader accessibility
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const model = "gemini-2.5-flash-image";
    
    // 1. Construct the Core Description
    let coreDescription = "";

    if (options.mode === 'freeform') {
      coreDescription = options.customPrompt;
    } else {
      // Build from structured options
      
      // STRICT CONSTRAINT: Always a Santa Hat
      const baseObject = "A Christmas Santa Hat (classic conical shape with folded brim and a pompom at the tip)";
      
      const patternMap: Record<string, string> = {
        'solid': 'Solid color design, no pattern',
        'striped': 'Candy Cane Stripes pattern (diagonal stripes)',
        'plaid': 'Scottish Tartan Plaid pattern',
        'snowflakes': 'Nordic pattern with Snowflake motifs',
        'dots': 'Polka Dot pattern'
      };
      
      const colorMap: Record<string, string> = {
        'Red': 'Vibrant Cardinal Red',
        'Blue': 'Royal Blue',
        'Gold': 'Metallic Gold',
        'Pink': 'Pastel Pink',
        'Green': 'Forest Green',
        'Silver': 'Shimmering Silver',
        'Black': 'Elegant Black'
      };

      const materialMap: Record<string, string> = {
        'Velvet': 'Plush Velvet fabric',
        'Knit': 'Chunky Hand-Knitted Wool texture',
        'Silk': 'Smooth Satin/Silk',
        'Fur': 'Faux Fur texture all over',
        'Felt': 'Stiff Felt material'
      };

      const trimMap: Record<string, string> = {
        'Classic': 'thick fluffy white fur brim and pompom',
        'None': 'simple fabric brim (no fur)',
        'Gold': 'gold braided brim'
      };

      coreDescription = `${baseObject}. `;
      coreDescription += `Pattern: ${patternMap[options.pattern] || 'Solid'}. `;
      coreDescription += `Main Color: ${colorMap[options.color] || 'Red'}. `;
      coreDescription += `Material: ${materialMap[options.material] || 'Velvet'}. `;
      coreDescription += `Trim Style: ${trimMap[options.trim] || 'Classic white fur'}. `;
      
      if (options.decor && options.decor.length > 0) {
        coreDescription += `Decorations: ${options.decor.join(', ')} attached to the hat. `;
      }
    }

    // 2. Construct the Master Prompt
    // Optimized for Flash Image with strict Style Consistency
    const promptText = `
      TASK: Generate a SINGLE, ISOLATED Christmas Hat asset that looks like it belongs in the provided user image.

      [STYLE CLONING - CRITICAL]
      1. ANALYZE the input image's art style (e.g., Oil Painting, 3D Render, Anime, Pixel Art, Polaroid, Studio Photography).
      2. GENERATE the hat using the EXACT SAME rendering style, brush strokes, texture, and noise level.
      3. IF the image is blurry/low-res, generate a blurry/low-res hat. IF it is crisp/4K, generate a crisp/4K hat.
      4. MATCH the lighting direction, color temperature, and contrast of the input image.

      [OBJECT DESCRIPTION]
      ${coreDescription}

      [TECHNICAL CONSTRAINTS]
      1. BACKGROUND: Pure Chroma Key Green (Hex #00FF00). Flat color. NO gradients.
      2. LIGHTING: Render self-shadows on the hat for 3D volume, but DO NOT cast a shadow on the green background.
      3. OPACITY: The object must be 100% Solid/Opaque. No transparency.
      4. PERSPECTIVE: Match the camera angle of the input image subject (usually Front or 3/4 view).
      5. COMPOSITION: Center the object. Keep it fully visible within the frame.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const resultMimeType = part.inlineData.mimeType || "image/png";
          const rawImageUrl = `data:${resultMimeType};base64,${part.inlineData.data}`;
          
          // Use smart processing to remove background
          const transparentHat = await processHatAsset(rawImageUrl);
          
          return { imageUrl: transparentHat };
        }
      }
    }

    return { imageUrl: null, error: "生成失败，请稍后重试。" };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { imageUrl: null, error: "服务繁忙，请稍后再试。" };
  }
};
