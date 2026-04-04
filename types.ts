
export interface GeneratedImage {
  url: string;
  id: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ActiveTab = 'vision' | 'text';

export interface ImageStyle {
  id: string;
  name: string;
  promptSuffix: string;
  icon: string;
}

export const POPULAR_STYLES: ImageStyle[] = [
  { id: 'none', name: 'Original', promptSuffix: '', icon: '✨' },
  { id: 'cinematic', name: 'Cinematic', promptSuffix: 'cinematic lighting, hyper-realistic, 8k, wide angle lens, highly detailed', icon: '🎬' },
  { id: 'photorealistic', name: 'Photorealistic', promptSuffix: 'highly detailed, sharp focus, 8k resolution, realistic lighting, professional photography', icon: '📸' },
  { id: 'anime', name: 'Anime', promptSuffix: 'studio ghibli style, vibrant colors, clean lines, anime aesthetic', icon: '🌸' },
  { id: 'digital_art', name: 'Digital Art', promptSuffix: 'trending on artstation, sharp focus, intricate details, vivid colors', icon: '🎨' },
  { id: 'oil_painting', name: 'Oil Painting', promptSuffix: 'classical oil painting, textured brushstrokes, rich colors, canvas texture', icon: '🖌️' },
  { id: 'impressionist', name: 'Impressionist', promptSuffix: 'impressionist style, visible brushstrokes, emphasis on light and its changing qualities, ordinary subject matter', icon: '🎭' },
];

export interface AppState {
  originalImage: string | null;
  imageZoom: number;
  extractedPrompt: string;
  manualPrompt: string;
  selectedStyleId: string;
  variants: GeneratedImage[];
  status: AppStatus;
  error: string | null;
  activeTab: ActiveTab;
  useReferenceImage: boolean;
}
