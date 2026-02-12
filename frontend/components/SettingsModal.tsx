import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, X, Smartphone } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string;
    onSave: (url: string) => void;
}

export default function SettingsModal({ isOpen, onClose, currentUrl, onSave }: SettingsModalProps) {
    const [url, setUrl] = useState(currentUrl);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setUrl(currentUrl);
        setIsMobile(window.innerWidth < 768);
    }, [currentUrl, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Basic validation: ensure it starts with http/https and doesn't end with slash
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = `http://${cleanUrl}`;
        }
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        onSave(cleanUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-blue-400" />
                        App Settings
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Backend API URL
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://192.168.1.X:3000"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
                            <Smartphone size={14} className="mt-0.5" />
                            <span>
                                For mobile testing, use your computer's local IP address (e.g., <code>http://192.168.1.5:3000</code>) instead of localhost.
                            </span>
                        </p>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <h4 className="text-blue-400 text-sm font-bold mb-1">Tip</h4>
                        <p className="text-xs text-gray-300">
                            If the camera feed is black on mobile, ensure you've allowed camera permissions in your browser and that the site is served via HTTPS (or localhost for testing).
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 rounded-b-2xl">
                    <button 
                        onClick={() => setUrl("http://localhost:3000")}
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <RotateCcw size={16} /> Reset Default
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-900/20 flex items-center gap-2"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
