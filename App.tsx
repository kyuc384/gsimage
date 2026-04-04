
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, AppState, GeneratedImage, ActiveTab, POPULAR_STYLES } from './types';
import { fileToDataUrl, extractPromptFromImage, generateImageVariant } from './services/geminiService';
import { Button } from './components/Button';
import { StyleSelector } from './components/StyleSelector';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    imageZoom: 1,
    extractedPrompt: '',
    manualPrompt: '',
    selectedStyleId: 'photorealistic',
    variants: [],
    status: AppStatus.IDLE,
    error: null,
    activeTab: 'vision',
    useReferenceImage: true,
  });

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setState(prev => ({ ...prev, status: AppStatus.UPLOADING, error: null }));
      const dataUrl = await fileToDataUrl(file);
      setState(prev => ({ 
        ...prev, 
        originalImage: dataUrl, 
        imageZoom: 1,
        extractedPrompt: '',
        variants: [],
        status: AppStatus.IDLE 
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        error: "Không thể tải ảnh. Vui lòng thử lại." 
      }));
    }
  };

  const adjustZoom = (delta: number) => {
    setState(prev => ({
      ...prev,
      imageZoom: Math.max(0.5, Math.min(5, prev.imageZoom + delta))
    }));
  };

  const resetZoom = () => {
    setState(prev => ({ ...prev, imageZoom: 1 }));
  };

  const getStyleSuffix = (styleId: string) => {
    const style = POPULAR_STYLES.find(s => s.id === styleId);
    return style ? style.promptSuffix : '';
  };

  const handleExtractPrompt = async () => {
    if (!state.originalImage) return;

    try {
      setState(prev => ({ ...prev, status: AppStatus.ANALYZING, error: null, variants: [] }));
      const prompt = await extractPromptFromImage(state.originalImage);
      
      setState(prev => ({ 
        ...prev, 
        extractedPrompt: prompt, 
        status: AppStatus.IDLE 
      }));

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        error: err.message || "Đã xảy ra lỗi khi phân tích hình ảnh." 
      }));
    }
  };

  const handleGenerateVisionaryVariants = async () => {
    if (!state.extractedPrompt) return;

    try {
      setState(prev => ({ ...prev, status: AppStatus.GENERATING, error: null }));

      const styleSuffix = getStyleSuffix(state.selectedStyleId);
      const referenceImage = state.useReferenceImage ? (state.originalImage || undefined) : undefined;

      const variantPromises = [
        generateImageVariant(state.extractedPrompt, styleSuffix, referenceImage),
        generateImageVariant(state.extractedPrompt, styleSuffix + ", alternative lighting and perspective", referenceImage)
      ];

      const [v1, v2] = await Promise.all(variantPromises);

      const newVariants: GeneratedImage[] = [
        { id: 'v1', url: v1 },
        { id: 'v2', url: v2 }
      ];

      setState(prev => ({ 
        ...prev, 
        variants: newVariants, 
        status: AppStatus.SUCCESS 
      }));

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        error: err.message || "Đã xảy ra lỗi khi tạo hình ảnh." 
      }));
    }
  };

  const processCreative = async () => {
    if (!state.manualPrompt.trim()) return;

    try {
      setState(prev => ({ ...prev, status: AppStatus.GENERATING, error: null, variants: [] }));
      
      const styleSuffix = getStyleSuffix(state.selectedStyleId);
      const referenceImage = state.useReferenceImage ? (state.originalImage || undefined) : undefined;

      const variantPromises = [
        generateImageVariant(state.manualPrompt, styleSuffix, referenceImage),
        generateImageVariant(state.manualPrompt, styleSuffix + ", slightly different interpretation", referenceImage)
      ];

      const [v1, v2] = await Promise.all(variantPromises);

      const newVariants: GeneratedImage[] = [
        { id: 'v1', url: v1 },
        { id: 'v2', url: v2 }
      ];

      setState(prev => ({ 
        ...prev, 
        variants: newVariants, 
        status: AppStatus.SUCCESS 
      }));

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        error: err.message || "Đã xảy ra lỗi khi tạo hình ảnh." 
      }));
    }
  };

  const resetApp = () => {
    // Reset native file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setState({
      originalImage: null,
      imageZoom: 1,
      extractedPrompt: '',
      manualPrompt: '',
      selectedStyleId: 'photorealistic',
      variants: [],
      status: AppStatus.IDLE,
      error: null,
      activeTab: state.activeTab, // Keep the current tab
      useReferenceImage: true,
    });
  };

  const setTab = (tab: ActiveTab) => {
    setState(prev => ({ ...prev, activeTab: tab, status: AppStatus.IDLE, variants: [], error: null }));
  };

  const handleEditVariant = (url: string) => {
    setState(prev => ({
      ...prev,
      originalImage: url,
      activeTab: 'vision',
      variants: [],
      extractedPrompt: '',
      imageZoom: 1,
      status: AppStatus.IDLE,
      error: null
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyPrompt = () => {
    if (!state.extractedPrompt) return;
    navigator.clipboard.writeText(state.extractedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = !!(
    state.originalImage || 
    state.variants.length > 0 || 
    state.manualPrompt.trim() !== '' || 
    state.extractedPrompt.trim() !== '' ||
    state.error
  );

  return (
    <div className="min-h-screen pb-12 bg-slate-950 text-slate-100 transition-colors duration-500">
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="hidden" 
        id="image-upload" 
      />

      {/* Header */}
      <header className="relative py-8 px-4 text-center">
        <div className="absolute top-8 right-4 md:right-8 flex gap-2">
          <Button 
            onClick={toggleFullscreen} 
            variant="secondary" 
            className="text-xs px-3 py-1.5 opacity-70 hover:opacity-100"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 0l5-5m0 0l-5 0m5 0l0 5m-5 11l5 5m0 0l-5 0m5 0l0-5m-11 0L4 20m0 0l5 0m-5 0l0-5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </Button>
          {hasContent && (
            <Button 
              onClick={resetApp} 
              variant="secondary" 
              className="text-xs px-3 py-1.5 opacity-70 hover:opacity-100"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Đặt lại
            </Button>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
          G-Image Studio
        </h1>
        <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
          Biến ý tưởng của bạn thành hình ảnh điện ảnh 16:9 sắc nét với AI.
        </p>
      </header>

      {/* Tabs */}
      <nav className="max-w-md mx-auto mb-10 px-4">
        <div className="flex p-1 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl">
          <button 
            onClick={() => setTab('vision')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${state.activeTab === 'vision' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Nhân bản ảnh
          </button>
          <button 
            onClick={() => setTab('text')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${state.activeTab === 'text' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Prompt sáng tạo
          </button>
        </div>
      </nav>

      {/* Style Selector */}
      <StyleSelector 
        selectedStyleId={state.selectedStyleId} 
        onSelect={(id) => setState(prev => ({ ...prev, selectedStyleId: id }))} 
      />

      <main className="max-w-6xl mx-auto px-4 space-y-8 relative">
        {state.activeTab === 'vision' && (
          <div className="space-y-8">
            {state.status === AppStatus.IDLE && !state.originalImage && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-12 glass-panel transition-all hover:border-blue-500/50">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Chuyển Ảnh thành Prompt</h2>
                <p className="text-slate-500 mb-6">Tải lên một hình ảnh để trích xuất phong cách và tạo các biến thể</p>
                <label htmlFor="image-upload">
                  <Button as="span" className="cursor-pointer">Chọn hình ảnh</Button>
                </label>
              </div>
            )}

            {(state.originalImage || state.status === AppStatus.SUCCESS) && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="glass-panel rounded-3xl p-6 h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Ảnh gốc
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700 backdrop-blur-sm">
                        <label htmlFor="image-upload" className="cursor-pointer p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white" title="Thay đổi ảnh">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                        </label>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button onClick={() => adjustZoom(-0.1)} className="p-1 hover:bg-slate-700 rounded transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
                        <span className="text-[10px] font-mono w-10 text-center text-slate-300">{Math.round(state.imageZoom * 100)}%</span>
                        <button onClick={() => adjustZoom(0.1)} className="p-1 hover:bg-slate-700 rounded transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                        <button onClick={resetZoom} className="ml-1 p-1 hover:bg-slate-700 rounded transition-colors text-blue-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                      </div>
                    </h3>
                    <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700 relative group cursor-zoom-in flex-grow aspect-square lg:aspect-auto min-h-[300px]">
                      <img 
                        src={state.originalImage!} 
                        alt="Original" 
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out origin-center will-change-transform" 
                        style={{ transform: `scale(${state.imageZoom})` }} 
                      />
                    </div>
                    {state.status === AppStatus.IDLE && !state.extractedPrompt && (
                      <div className="mt-6">
                        <Button onClick={handleExtractPrompt} className="w-full">Trích xuất Visual Prompt</Button>
                      </div>
                    )}
                  </div>

                  <div className="glass-panel rounded-3xl p-6 h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Prompt đã phân tích
                      </div>
                      {state.extractedPrompt && (
                        <button 
                          onClick={handleCopyPrompt}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                            copied 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                          title="Sao chép prompt"
                        >
                          {copied ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Đã chép
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              Sao chép
                            </>
                          )}
                        </button>
                      )}
                    </h3>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 flex-grow flex flex-col min-h-[300px]">
                      {state.extractedPrompt ? (
                        <>
                          <textarea
                            className="w-full flex-grow bg-transparent text-sm text-slate-300 leading-relaxed italic border-none focus:ring-0 resize-none p-0"
                            value={state.extractedPrompt}
                            onChange={(e) => setState(prev => ({ ...prev, extractedPrompt: e.target.value }))}
                            disabled={state.status === AppStatus.GENERATING}
                          />
                          <div className="mt-6 pt-4 border-t border-slate-700/50">
                            {state.originalImage && (
                              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={state.useReferenceImage}
                                    onChange={(e) => setState(prev => ({ ...prev, useReferenceImage: e.target.checked }))}
                                  />
                                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                  <span className="ms-3 text-sm font-medium text-slate-300">Giữ tham chiếu ảnh gốc</span>
                                </label>
                              </div>
                            )}
                            <Button 
                              onClick={handleGenerateVisionaryVariants} 
                              className="w-full"
                              isLoading={state.status === AppStatus.GENERATING}
                              disabled={!state.extractedPrompt.trim()}
                            >
                              Tạo các biến thể 16:9
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-40">
                          <p className="text-sm">Vui lòng nhấp "Trích xuất Visual Prompt"<br/>để bắt đầu phân tích hình ảnh.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {state.variants.length > 0 && (
                  <div className="pt-8 border-t border-slate-800">
                    <h2 className="text-2xl font-bold mb-6">Kết quả các biến thể</h2>
                    <ResultsGrid status={state.status} variants={state.variants} onEdit={handleEditVariant} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'text' && (
          <div className="space-y-8">
            <div className="glass-panel rounded-3xl p-8 max-w-5xl mx-auto border border-purple-500/20 shadow-xl shadow-purple-500/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">Tạo Ảnh từ Văn bản</h2>
              <textarea 
                placeholder="Mô tả những gì bạn muốn thấy..."
                className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y transition-all text-lg leading-relaxed"
                value={state.manualPrompt}
                onChange={(e) => setState(prev => ({ ...prev, manualPrompt: e.target.value }))}
                disabled={state.status === AppStatus.GENERATING}
              />
              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {state.originalImage && (
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={state.useReferenceImage}
                        onChange={(e) => setState(prev => ({ ...prev, useReferenceImage: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ms-3 text-sm font-medium text-slate-300">Giữ tham chiếu ảnh gốc</span>
                    </label>
                  </div>
                )}
                <Button 
                  onClick={processCreative} 
                  disabled={!state.manualPrompt.trim()}
                  isLoading={state.status === AppStatus.GENERATING}
                  className="bg-purple-600 hover:bg-purple-500"
                >
                  Tạo các biến thể
                </Button>
              </div>
            </div>
            {state.status === AppStatus.SUCCESS && state.variants.length > 0 && (
              <div className="pt-4"><ResultsGrid status={state.status} variants={state.variants} onEdit={handleEditVariant} /></div>
            )}
          </div>
        )}

        {(state.status === AppStatus.ANALYZING || state.status === AppStatus.GENERATING) && (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-6 animate-pulse border-blue-500/20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold text-blue-400">Đang xử lý...</h2>
          </div>
        )}

        {state.status === AppStatus.ERROR && (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center">
            <h3 className="text-red-400 font-bold mb-2">Lỗi xử lý</h3>
            <p className="text-red-200/70 mb-6">{state.error}</p>
            <Button onClick={() => setState(prev => ({ ...prev, status: AppStatus.IDLE }))} variant="danger">Bỏ qua</Button>
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      {hasContent && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
          <Button 
            onClick={resetApp} 
            variant="danger" 
            className="w-14 h-14 rounded-full shadow-2xl p-0 flex items-center justify-center group"
            title="Reset ứng dụng"
          >
            <svg className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      )}

      <footer className="mt-20 border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
        <p>Phát triển bởi G.Studio</p>
      </footer>
    </div>
  );
};

const ResultsGrid: React.FC<{ status: AppStatus, variants: GeneratedImage[], onEdit: (url: string) => void }> = ({ status, variants, onEdit }) => {
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>(
    variants.reduce((acc, v) => ({ ...acc, [v.id]: 1 }), {})
  );

  const handleZoom = (id: string, delta: number) => {
    setZoomLevels(prev => ({
      ...prev,
      [id]: Math.max(0.5, Math.min(5, (prev[id] || 1) + delta))
    }));
  };

  const resetZoom = (id: string) => {
    setZoomLevels(prev => ({ ...prev, [id]: 1 }));
  };

  if (status !== AppStatus.SUCCESS || variants.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {variants.map((variant, index) => {
        const zoom = zoomLevels[variant.id] || 1;
        return (
          <div key={variant.id} className="glass-panel rounded-3xl overflow-hidden group">
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
               <img 
                src={variant.url} 
                alt={`Biến thể ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out origin-center will-change-transform" 
                style={{ transform: `scale(${zoom})` }}
              />
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                  BIẾN THỂ {index + 1}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex items-center bg-black/60 rounded-lg p-1 border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => handleZoom(variant.id, -0.1)} className="p-1 hover:bg-white/10 rounded transition-colors text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
                <span className="text-[10px] font-mono w-10 text-center text-white/80">{Math.round(zoom * 100)}%</span>
                <button onClick={() => handleZoom(variant.id, 0.1)} className="p-1 hover:bg-white/10 rounded transition-colors text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                <button onClick={() => resetZoom(variant.id)} className="ml-1 p-1 hover:bg-white/10 rounded transition-colors text-blue-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-slate-400 text-sm">Được tạo bởi AI (16:9)</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(variant.url)}
                  className="text-purple-400 hover:text-purple-300 transition-colors p-2 hover:bg-white/5 rounded-lg"
                  title="Dùng làm ảnh gốc để sửa"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <a href={variant.url} download={`variant-${index + 1}.png`} className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-white/5 rounded-lg" title="Tải xuống"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default App;
