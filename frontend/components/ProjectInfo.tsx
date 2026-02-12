import React from 'react';
import { X } from 'lucide-react';

interface ProjectInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProjectInfo({ isOpen, onClose }: ProjectInfoProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white p-2 rounded-full transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
                        Project Overview: MobileNet SSD Object Detection
                    </h2>

                    <div className="space-y-8 text-gray-300">
                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-blue-500 pl-3">1. What is MobileNet SSD?</h3>
                            <p className="leading-relaxed">
                                This project utilizes the <strong>Single Shot Detector (SSD)</strong> framework with a <strong>MobileNet</strong> backend. 
                                MobileNet is a streamlined architecture that uses <em>depth-wise separable convolutions</em> to build lightweight deep neural networks.
                                This combination allows for real-time object detection on resource-constrained devices like mobile phones and embedded systems (e.g., Raspberry Pi, Jetson Nano).
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-green-500 pl-3">2. Architecture & Optimization</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="font-bold text-blue-300 mb-2">Depthwise Separable Convolutions</h4>
                                    <p className="text-sm">Standard convolutions are replaced with depthwise and pointwise convolutions, significantly reducing the number of parameters and computation cost with minimal loss in accuracy.</p>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="font-bold text-blue-300 mb-2">SSD Framework</h4>
                                    <p className="text-sm">Discretizes the output space of bounding boxes into a set of default boxes over different aspect ratios and scales per feature map location.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-purple-500 pl-3">3. How It Works</h3>
                            <ol className="list-decimal list-inside space-y-2 ml-2">
                                <li><strong>Input:</strong> Camera feed is captured frame-by-frame.</li>
                                <li><strong>Preprocessing:</strong> Frames are resized to 300x300 and mean subtracted (blobFromImage).</li>
                                <li><strong>Inference:</strong> The Caffe model processes the blob to predict classes and bounding boxes.</li>
                                <li><strong>Post-processing:</strong> Confidence thresholding filters weak detections; Non-Maximum Suppression (NMS) removes overlapping boxes.</li>
                                <li><strong>Visualization:</strong> Bounding boxes and class labels are drawn on the original frame.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-yellow-500 pl-3">4. Model Details</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>Framework:</strong> Caffe (running via OpenCV DNN module)</li>
                                <li><strong>Classes:</strong> 21 (Aeroplane, Bicycle, Bird, Boat, Bottle, Bus, Car, Cat, Chair, Cow, Dining Table, Dog, Horse, Motorbike, Person, Potted Plant, Sheep, Sofa, Train, TV/Monitor, Background)</li>
                                <li><strong>Input Size:</strong> 300x300 pixels</li>
                            </ul>
                        </section>
                        
                        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg mt-4">
                            <h4 className="font-bold text-blue-400 mb-2">Educational Resources</h4>
                            <ul className="text-sm space-y-1">
                                <li><a href="https://arxiv.org/abs/1704.04861" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">MobileNet Paper (Google Research)</a></li>
                                <li><a href="https://arxiv.org/abs/1512.02325" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">SSD: Single Shot MultiBox Detector</a></li>
                                <li><a href="https://docs.opencv.org/4.x/d6/d0f/group__dnn.html" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">OpenCV DNN Module Documentation</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-800 bg-gray-900/95 sticky bottom-0 text-right">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
