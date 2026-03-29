import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Camera } from 'lucide-react';

interface ProctoringWarningOverlayProps {
    enabled: boolean;
    onViolation: () => void;
    onAutoSubmit: () => void;
    warningCount: number;
    isViolating: boolean;
    countdown: number;
    currentConfidence: number;
}

export function ProctoringWarningOverlay({
    enabled,
    onViolation,
    onAutoSubmit,
    warningCount,
    isViolating,
    countdown,
    currentConfidence
}: ProctoringWarningOverlayProps) {

    if (!enabled) return null;

    const needsAttention = currentConfidence < 70;

    return (
        <>
            {/* Confidence indicator (always visible) */}
            <div className="fixed top-4 right-4 z-50 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-md border border-white/10">
                <div className="flex items-center gap-2">
                    <Camera className="h-3 w-3 text-white" />
                    <div className={`h-2 w-2 rounded-full ${currentConfidence >= 70 ? 'bg-green-500' : 'bg-red-500'
                        } animate-pulse`} />
                    <span className="text-xs text-white font-medium">
                        {currentConfidence}%
                    </span>
                </div>
            </div>

            {/* Warning overlay (shown when violating) */}
            <AnimatePresence>
                {isViolating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: -20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: -20 }}
                            className="bg-red-500 text-white px-8 py-6 rounded-lg shadow-2xl max-w-md border-4 border-red-600"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="h-8 w-8 animate-pulse" />
                                <div>
                                    <h3 className="text-xl font-bold">Proctoring Violation</h3>
                                    <p className="text-sm opacity-90">Warning {warningCount}/3</p>
                                </div>
                            </div>
                            <p className="text-sm mb-2">
                                {needsAttention ?
                                    <>
                                        Face not detected or turned away from screen
                                        <div className="mt-2 text-2xl font-bold text-white animate-pulse">
                                            {countdown}s remaining
                                        </div>
                                    </> :
                                    "Multiple people detected in frame"
                                }
                            </p>
                            <p className="text-xs opacity-75">
                                Please ensure only you are visible and looking at the screen. After 3 warnings, your quiz will be automatically submitted.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
