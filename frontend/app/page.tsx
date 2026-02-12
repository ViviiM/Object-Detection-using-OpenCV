"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { 
  Camera, 
  Car, 
  Database, 
  Server, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Info, 
  Activity,
  CheckCircle,
  XCircle,
  Settings,
  PanelRightOpen,
  PanelRightClose,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import ProjectInfo from "../components/ProjectInfo";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import SettingsModal from "../components/SettingsModal";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration
  const [apiUrl, setApiUrl] = useState("http://localhost:3000");

  // State
  const [detections, setDetections] = useState<any[]>([]); // For UI Log (limited)
  const [sessionDetections, setSessionDetections] = useState<any[]>([]); // For Analytics (all)
  const [isDetecting, setIsDetecting] = useState(false);
  const [saveToSalesforce, setSaveToSalesforce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  
  // Modals
  const [showInfo, setShowInfo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // System Health
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isMobile, setIsMobile] = useState(false);

  // Initialize API URL from env if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        if (envUrl) setApiUrl(envUrl);
    }
  }, []);

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
        setBackendStatus("checking");
        // Ensure no trailing slash for health check
        const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const res = await axios.get(`${cleanUrl}/health`, { timeout: 2000 });
        if (res.status === 200) {
            setBackendStatus("online");
            setError(null);
        }
    } catch (err) {
        setBackendStatus("offline");
    }
  }, [apiUrl]);

  useEffect(() => {
    checkHealth();
    // Check if mobile and set initial log state
    const handleResize = () => {
        const mobile = window.innerWidth < 1024; // lg breakpoint
        setIsMobile(mobile);
        // Default: Show logs on Desktop, Hide on Mobile
        if (mobile) {
            setShowLogs(false);
        } else {
            setShowLogs(true);
        }
    };
    
    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [checkHealth]);

  // Video Constraints
  const videoConstraints = {
    facingMode: facingMode
  };

  // Capture Frame Loop
  const captureFrame = async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await axios.post(`${cleanUrl}/detect`, {
        image: imageSrc,
        save_to_salesforce: saveToSalesforce
      }, { timeout: 2000 }); // Fast timeout for realtime

      const data = response.data;
      if (data.detections) {
        drawDetections(data.detections);
        updateLog(data.detections);
        setBackendStatus("online"); 
        setError(null);
      }
    } catch (err) {
      console.error("Error detecting objects:", err);
      setBackendStatus("offline");
      // Optional: Don't spam error toast loops
    }
  };

  const drawDetections = (detectedObjects: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !webcamRef.current?.video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video size
    const video = webcamRef.current.video;
    // Ensure dimensions are valid
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detectedObjects.forEach((obj: any) => {
        const [x, y, x2, y2] = obj.box;
        const width = x2 - x;
        const height = y2 - y;

        // Draw box
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        ctx.fillStyle = "#00FF00";
        const text = `${obj.label} ${(obj.confidence * 100).toFixed(1)}%`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px Arial"; 
        ctx.fillText(text, x + 5, y - 5);
    });
  };

  const updateLog = (newDetections: any[]) => {
    if(newDetections.length > 0) {
        const timestamp = new Date().toLocaleTimeString();
        const enriched = newDetections.map((d: any) => ({ ...d, time: timestamp }));
        
        // Update Session Log (All)
        setSessionDetections(prev => [...prev, ...enriched]);

        // Update UI Log (Recent)
        setDetections(prev => {
            // Prepend new detections (Show latest first)
            return [...enriched, ...prev].slice(0, 50);
        }); 
    }
  };

  // Toggle Detection
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetecting) {
      interval = setInterval(captureFrame, 500); // 2 FPS to be safe
    } else {
       // Clear canvas when stopped
       const canvas = canvasRef.current;
       const ctx = canvas?.getContext("2d");
       if (canvas && ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
       }
    }
    return () => clearInterval(interval);
  }, [isDetecting, apiUrl]);

  const exitFullscreen = () => {
      if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
             console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
      }
  };

  const handleStop = () => {
    setIsDetecting(false);
    exitFullscreen();
    setShowAnalytics(true);
  };

  const enterFullscreen = () => {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
  };

  const handleStart = () => {
      setIsDetecting(true);
      enterFullscreen();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col overflow-hidden">
      
      {/* Header */}
      <header className="z-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center shadow-lg h-16 shrink-0">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${backendStatus === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <Car size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight sm:hidden">Vehicle Detection <span className="text-blue-500">Pro</span></h1>
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
             {/* Status indicator (Icon only on mobile) */}
             <div onClick={checkHealth} className="cursor-pointer flex items-center gap-1 text-xs text-gray-400 mr-2 hover:text-white transition-colors">
                 {backendStatus === 'online' ? 
                     <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14}/> <span className="hidden sm:inline">Online</span></span> : 
                     <span className="text-red-400 flex items-center gap-1"><XCircle size={14}/> <span className="hidden sm:inline">Offline</span></span>
                 }
                 {backendStatus === 'checking' && <span className="hidden sm:inline animate-pulse">...</span>}
             </div>

             <button 
                onClick={() => setShowLogs(!showLogs)}
                className={`p-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium ${showLogs ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                title="Toggle Logs"
             >
                {/* Dynamic Icon based on state & device */}
                {isMobile ? 
                    (showLogs ? <ChevronDown size={20} /> : <ChevronUp size={20} />) : 
                    (showLogs ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />)
                }
                <span className="hidden sm:inline">{showLogs ? 'Hide Logs' : 'Show Logs'}</span>
             </button>

             <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
                title="Settings"
             >
                <Settings size={22} />
             </button>
             <button 
                onClick={() => setShowInfo(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
                title="Project Info"
             >
                <Info size={22} />
             </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left: Camera Feed */}
        <section 
            ref={containerRef}
            className={`relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                 <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="absolute w-full h-full object-contain"
                    forceScreenshotSourceSize={true}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Overlays */}
                {!isDetecting && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                        <div className="text-center space-y-6 p-6">
                            <div className="inline-block p-4 rounded-full bg-blue-600/20 text-blue-400 mb-2">
                                <Camera size={48} />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold">Ready to Detect</h2>
                            <p className="text-gray-300 max-w-md mx-auto text-sm sm:text-base">
                                Point camera at objects to identify them with MobileNet SSD.
                            </p>
                            
                            <button 
                                onClick={handleStart}
                                className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Detection <Server size={18} />
                                </span>
                                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                            </button>

                            <div className="flex gap-4 justify-center mt-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-gray-800/80 px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={saveToSalesforce}
                                        onChange={(e) => setSaveToSalesforce(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                                    />
                                    <span className="text-sm">Save Data</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls Overlay (Always visible when active or hovering) */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md p-2 rounded-2xl flex gap-3 pointer-events-auto border border-white/10 shadow-lg">
                        {isDetecting && (
                            <button 
                                onClick={handleStop}
                                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg hover:shadow-red-900/50"
                                title="Stop Detection"
                            >
                                <div className="w-6 h-6 flex items-center justify-center font-bold">■</div>
                            </button>
                        )}
                        
                        <button 
                            onClick={toggleCamera}
                            className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                            title="Switch Camera"
                        >
                            <RotateCcw size={24} />
                        </button>

                        <button 
                            onClick={toggleFullscreen}
                            className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                        </button>
                    </div>
                </div>

                {/* Error Toast */}
                {error && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none p-4">
                        <div className="bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3 animate-bounce-in max-w-sm text-sm">
                            <XCircle size={20} className="shrink-0" /> 
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Right: Sidebar / Log - Collapsible */}
        <aside 
            className={`
                bg-gray-900 border-l border-gray-800 flex flex-col 
                transition-all duration-300 ease-in-out
                ${isFullscreen ? 'hidden' : ''}
                ${showLogs 
                    ? 'lg:w-96 w-full h-[35vh] lg:h-auto opacity-100'  /* Mobile: Fixed Height, Desktop: Auto Height */
                    : 'lg:w-0 w-full h-0 lg:h-auto opacity-0 overflow-hidden border-none'
                }
            `}
        >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 shrink-0">
                <h3 className="font-semibold flex items-center gap-2 text-gray-200">
                    <Database size={18} className="text-blue-400" />
                    Live Activity
                </h3>
                {isMobile && (
                     <button onClick={() => setShowLogs(false)} className="text-gray-500 hover:text-white">
                         <ChevronDown size={20}/>
                     </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {detections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 min-h-[100px]">
                        <Activity size={32} className="opacity-20" />
                        <p className="text-sm">No objects detected yet</p>
                    </div>
                ) : (
                    detections.map((det: any, idx: number) => (
                        <div key={idx} className="group flex items-start justify-between bg-gray-800/40 p-3 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors animate-fade-in-up">
                            <div>
                                <div className="font-medium text-gray-200 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    {det.label.charAt(0).toUpperCase() + det.label.slice(1)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 pl-3.5">
                                    {det.time}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    det.confidence > 0.8 ? 'bg-green-500/20 text-green-400' : 
                                    det.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                    {(det.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>

      </main>

      {/* Modals */}
      <ProjectInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <AnalyticsDashboard 
        detections={sessionDetections} 
        isVisible={showAnalytics} 
        onClose={() => {
            setShowAnalytics(false);
            setSessionDetections([]); // Clear session on close 
        }} 
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        currentUrl={apiUrl} 
        onSave={(url) => {
            setApiUrl(url);
            setBackendStatus("checking"); 
        }} 
      />

    </div>
  );
}
