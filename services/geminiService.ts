import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Helper to convert File or Blob to base64
 */
export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts base64 content from Data URL
 */
const getBase64FromDataUrl = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const extractPromptFromImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Bạn là một nhà thiết kế hình ảnh thu nhỏ YouTube chuyên nghiệp và chiến lược gia hình ảnh. 
  Nhiệm vụ của bạn là phân tích hình thu nhỏ tham khảo trên YouTube này và dựa trên đó mà tạo ra những ý tưởng hình thu nhỏ tốt hơn,
  giữ các yếu tố đối tượng chính trong hình ảnh, xóa văn bản giới thiệu, chỉ cung cấp nội dung mô tả bằng tiếng Việt.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: getBase64FromDataUrl(base64Image), mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
    }
  });

  return response.text || "Không thể trích xuất prompt.";
};

export const generateImageVariant = async (prompt: string, styleSuffix: string = '', base64Image?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Explicit instruction to avoid text generation in the image
  const textProhibition = "The image must contain absolutely NO text, NO letters, NO words, NO characters, NO logos, and NO typography. Provide a purely visual artistic scene.";

  const finalPrompt = styleSuffix 
    ? `Create a professional high-resolution artistic variation of this: ${prompt}. Apply style: ${styleSuffix}. ${textProhibition}`
    : `Create a professional high-resolution artistic variation of this: ${prompt}. ${textProhibition}`;

  const parts: any[] = [{ text: finalPrompt }];
  
  if (base64Image) {
    parts.unshift({ 
      inlineData: { 
        data: getBase64FromDataUrl(base64Image), 
        mimeType: 'image/png' 
      } 
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  // gemini-2.5-flash-image returns the image in candidates[0].content.parts
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data received from API");
};
