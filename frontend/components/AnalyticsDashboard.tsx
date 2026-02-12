import React, { useMemo } from 'react';
import { BarChart, PieChart, Activity, Clock } from 'lucide-react';

interface Detection {
    label: string;
    confidence: number;
    time: string;
}

interface AnalyticsDashboardProps {
    detections: Detection[];
    isVisible: boolean;
    onClose: () => void;
}

export default function AnalyticsDashboard({ detections, isVisible, onClose }: AnalyticsDashboardProps) {
    if (!isVisible) return null;

    const stats = useMemo(() => {
        const total = detections.length;
        if (total === 0) return null;

        const classCounts: Record<string, number> = {};
        let totalConfidence = 0;

        detections.forEach(d => {
            classCounts[d.label] = (classCounts[d.label] || 0) + 1;
            totalConfidence += d.confidence;
        });

        const avgConfidence = (totalConfidence / total) * 100;
        
        // Sort classes by count
        const sortedClasses = Object.entries(classCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5

        const maxCount = sortedClasses[0]?.[1] || 0;

        return { total, classCounts, sortedClasses, avgConfidence, maxCount };
    }, [detections]);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-gray-800 border border-gray-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Activity className="text-green-400" />
                        Session Analytics
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors">
                        Close & Reset
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {!stats ? (
                        <div className="text-center py-20 text-gray-500">
                            No detections recorded in this session.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 flex items-center gap-4">
                                    <div className="p-4 bg-blue-500/20 text-blue-400 rounded-full">
                                        <BarChart size={32} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Detections</p>
                                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 flex items-center gap-4">
                                    <div className="p-4 bg-green-500/20 text-green-400 rounded-full">
                                        <PieChart size={32} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Avg. Confidence</p>
                                        <p className="text-3xl font-bold text-white">{stats.avgConfidence.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 flex items-center gap-4">
                                    <div className="p-4 bg-purple-500/20 text-purple-400 rounded-full">
                                        <Clock size={32} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Active Classes</p>
                                        <p className="text-3xl font-bold text-white">{Object.keys(stats.classCounts).length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Bar Chart: Distribution */}
                                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-200 mb-6">Object Distribution (Top 5)</h3>
                                    <div className="space-y-4">
                                        {stats.sortedClasses.map(([label, count]) => (
                                            <div key={label} className="relative">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="capitalize font-medium text-gray-300">{label}</span>
                                                    <span className="text-gray-400">{count} ({((count / stats.total) * 100).toFixed(0)}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${(count / stats.maxCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* List: Recent Timeline */}
                                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-200 mb-6">Recent Activity Log</h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {detections.slice(0, 10).map((det, i) => ( // Show first 10 (most recent since log is prepended)
                                            <div key={i} className="flex justify-between items-center p-3 bg-gray-800/80 rounded-lg border border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="capitalize font-medium text-gray-200">{det.label}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-gray-500">{det.time}</span>
                                                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                                                        {(det.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
