"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, Car, Database, Server, Smartphone, Monitor } from "lucide-react";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [saveToSalesforce, setSaveToSalesforce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constants for video size
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment", // Use back camera on mobile if available
  };

  const captureFrame = async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/detect";
      const response = await axios.post(apiUrl, {
        image: imageSrc,
        save_to_salesforce: saveToSalesforce
      });

      const data = response.data;
      if (data.detections) {
        drawDetections(data.detections);
        updateLog(data.detections);
        setError(null);
      }
    } catch (err) {
      console.error("Error detecting objects:", err);
      // Only show error if persistent, otherwise flicker
      setError("Backend not connected or error. Make sure Python server is running on port 5000.");
    }
  };

  const drawDetections = (detectedObjects: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !webcamRef.current?.video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video size
    const video = webcamRef.current.video;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detectedObjects.forEach((obj) => {
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
        ctx.font = "18px Arial"; 
        ctx.fillText(text, x + 5, y - 5);
    });
  };

  const updateLog = (newDetections: any[]) => {
    // Add unique detections to the log (simple logic: add if not identical to last few)
    // For a real app, you'd debounce/track IDs.
    if(newDetections.length > 0) {
        const timestamp = new Date().toLocaleTimeString();
        const enriched = newDetections.map(d => ({ ...d, time: timestamp }));
        setDetections(prev => [...enriched, ...prev].slice(0, 50)); // Keep last 50
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetecting) {
      interval = setInterval(captureFrame, 500); // 2 FPS
    }
    return () => clearInterval(interval);
  }, [isDetecting]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 bg-gray-800 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="text-blue-400" />
            Smart Vehicle Detection
        </h1>
        <div className="flex gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Monitor size={16}/> Web</span>
            <span className="flex items-center gap-1"><Smartphone size={16}/> Mobile</span>
            <span className="flex items-center gap-1"><Server size={16}/> API Active</span>
        </div>
      </header>

      <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Left: Video Feed */}
        <section className="flex-1 flex flex-col gap-4">
            <div className="relative rounded-xl overflow-hidden border-4 border-gray-700 bg-black aspect-video shadow-2xl">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {!isDetecting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-4">
                        <button 
                            onClick={() => setIsDetecting(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg flex items-center gap-2"
                        >
                            <Camera />
                            Start Detection
                        </button>
                        
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-800/80 px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={saveToSalesforce}
                                onChange={(e) => setSaveToSalesforce(e.target.checked)}
                                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500" 
                            />
                            <span className="text-sm font-medium">Save to Salesforce</span>
                        </label>
                    </div>
                )}
                 {isDetecting && (
                    <div className="absolute bottom-4 right-4">
                        <button 
                            onClick={() => setIsDetecting(false)}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="bg-red-900/50 text-red-200 p-3 rounded-lg border border-red-700 text-center">
                    {error}
                </div>
            )}
        </section>

        {/* Right: Detection Log */}
        <section className="lg:w-1/3 bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700 h-[600px] overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                <Database className="text-green-400" />
                Live Feed Log
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {detections.length === 0 ? (
                    <div className="text-gray-500 text-center py-10">
                        Waiting for detections...
                    </div>
                ) : (
                    detections.map((det, idx) => (
                        <div key={idx} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 flex justify-between items-start animate-fade-in">
                            <div>
                                <div className="font-bold text-blue-300">{det.label.toUpperCase()}</div>
                                <div className="text-xs text-gray-400">Time: {det.time}</div>
                                {det.plate && (
                                    <div className="text-xs text-yellow-500 mt-1 font-mono">Plate: {det.plate}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                                    {(det.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
      </main>
    </div>
  );
}
