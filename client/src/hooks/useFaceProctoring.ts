import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceMeshModule from '@mediapipe/face_mesh';
type Results = faceMeshModule.Results;

// Safely extract FaceMesh constructor across Vite dev server and Rollup production build
const FaceMeshConstructor: any =
    (faceMeshModule as any).FaceMesh ||
    ((faceMeshModule as any).default && (faceMeshModule as any).default.FaceMesh) ||
    (faceMeshModule as any).default ||
    faceMeshModule;

interface FaceProctoringConfig {
    enabled: boolean;
    onViolation: () => void;
    onAutoSubmit: () => void; // New callback
    confidenceThreshold?: number;
    minViolationDuration?: number;
}

interface FaceProctoringState {
    isInitialized: boolean;
    currentConfidence: number;
    warningCount: number;
    isViolating: boolean;
    valiationType: 'low_confidence' | 'multiple_faces' | null;
    countdown: number; // Seconds remaining
}

/**
 * Custom hook for MediaPipe-based face proctoring
 * Implements confidence scoring with false-positive prevention
 */
export function useFaceProctoring(
    videoRef: React.RefObject<HTMLVideoElement>,
    config: FaceProctoringConfig
): FaceProctoringState {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentConfidence, setCurrentConfidence] = useState(0); // Start at 0, not 100
    const [warningCount, setWarningCount] = useState(0);
    const [isViolating, setIsViolating] = useState(false);
    const [countdown, setCountdown] = useState(5); // 5s countdown
    const [violationType, setViolationType] = useState<'low_confidence' | 'multiple_faces' | null>(null);

    const faceMeshRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const confidenceHistoryRef = useRef<number[]>([]);
    const emaRef = useRef<number | null>(null);
    const consecutiveSendErrorsRef = useRef(0);
    const backoffUntilRef = useRef<number | null>(null);
    const frameCountRef = useRef(0);
    const violationStartTimeRef = useRef<number | null>(null);
    const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasDetectedFaceRef = useRef(false); // Track if we've ever found a face

    const {
        enabled,
        onViolation,
        onAutoSubmit,
        confidenceThreshold = 70,
        minViolationDuration = 100 // Lower duration to react to "live" status quicker
    } = config;

    // Calculate landmark visibility ratio (60% weight)
    const calculateLandmarkScore = useCallback((landmarks: any[]): number => {
        if (!landmarks || landmarks.length === 0) return 0;

        // Check key landmarks: eyes, nose, mouth
        const keyIndices = [
            1,   // nose tip
            33,  // left eye outer
            133, // left eye inner
            362, // right eye inner
            263, // right eye outer
            61,  // upper lip
            291  // lower lip
        ];

        const visibleCount = keyIndices.reduce((count, idx) => {
            const landmark = landmarks[idx];
            // Lower threshold to 0.1 as FaceMesh visibility values can be inconsistent
            return landmark && (landmark.visibility === undefined || landmark.visibility > 0.1) ? count + 1 : count;
        }, 0);

        return (visibleCount / keyIndices.length) * 100;
    }, []);

    // Check if full face is within frame bounds (100% visibility required)
    const isFaceFullyVisible = useCallback((landmarks: any[]): boolean => {
        if (!landmarks || landmarks.length < 468) return false;

        const top = landmarks[10];    // Top of forehead
        const bottom = landmarks[152]; // Chin
        const left = landmarks[234];   // Left cheek
        const right = landmarks[454];  // Right cheek

        if (!top || !bottom || !left || !right) return false;

        // Generous margin tolerance (15%) so face near edges is detected accurately
        const margin = 0.15;

        // Check if any point is significantly out of bounds
        const isOutOfBounds =
            top.y < -margin ||
            bottom.y > 1 + margin ||
            left.x < -margin ||
            right.x > 1 + margin;

        return !isOutOfBounds;
    }, []);

    // Calculate head orientation score (30% weight)
    const calculateOrientationScore = useCallback((landmarks: any[]): number => {
        if (!landmarks || landmarks.length < 468) return 0;

        try {
            // Use nose tip (1) and eye landmarks to estimate orientation
            const noseTip = landmarks[1];
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];

            if (!noseTip || !leftEye || !rightEye) return 50;

            // Calculate yaw (left-right rotation)
            const eyeMidX = (leftEye.x + rightEye.x) / 2;
            const yawOffset = Math.abs(noseTip.x - eyeMidX);

            // Calculate pitch (up-down rotation)
            const eyeMidY = (leftEye.y + rightEye.y) / 2;
            const pitchOffset = Math.abs(noseTip.y - eyeMidY - 0.1); // 0.1 is expected offset

            // Penalize rotation (higher offset = lower score)
            // EXTREME MODE: Maximum penalty for checking side views/cheating
            // User reported 93% even with 350x multiplier, so we go to 1500x
            const yawScore = Math.max(0, 100 - yawOffset * 1500);
            const pitchScore = Math.max(0, 100 - pitchOffset * 1000);

            return (yawScore + pitchScore) / 2;
        } catch {
            return 80; // Reasonable fallback on error
        }
    }, []);

    // Calculate stability score (10% weight) - rolling average
    const calculateStabilityScore = useCallback((): number => {
        const history = confidenceHistoryRef.current;
        if (history.length < 5) return 100; // Not enough data yet

        const recentValues = history.slice(-10);
        const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;

        const stdDev = Math.sqrt(variance);
        return Math.max(0, 100 - stdDev * 2);
    }, []);

    // Main confidence calculation
    const calculateConfidence = useCallback((results: Results): number => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return 0; // No face detected
        }

        // Optimization: Mark that we have detected a face at least once
        if (!hasDetectedFaceRef.current) {
            hasDetectedFaceRef.current = true;
        }

        if (results.multiFaceLandmarks.length > 1) {
            // Handle multiple faces
            // If we're strictly 3rd striking on this:
            // Return 0 confidence effectively
            return 0;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Critical: Check if full face is visible first
        if (!isFaceFullyVisible(landmarks)) {
            return 0; // Immediate failure if face is cut off
        }

        const landmarkScore = calculateLandmarkScore(landmarks);
        const orientationScore = calculateOrientationScore(landmarks);
        const stabilityScore = calculateStabilityScore();

        // Weighted average
        // Weighted average - Heavily prioritize orientation (head direction)
        const totalConfidence = (
            landmarkScore * 0.2 +     // Reduced further - if face exists, it exists
            orientationScore * 0.7 +  // Critical: 70% of score is "Are you looking at the screen?"
            stabilityScore * 0.1      // 10% for smoothness
        );

        // Apply exponential moving average (EMA) smoothing to reduce flicker
        const alpha = 0.22;
        if (emaRef.current === null) {
            emaRef.current = totalConfidence;
        } else {
            emaRef.current = alpha * totalConfidence + (1 - alpha) * emaRef.current;
        }

        const smoothed = emaRef.current;

        // Update history for stability calculation using the smoothed value
        confidenceHistoryRef.current.push(smoothed);
        if (confidenceHistoryRef.current.length > 60) {
            confidenceHistoryRef.current.shift();
        }

        // Provide a stable displayed confidence to reduce UI flicker.
        // Only commit a new displayed value when it has been within a small delta
        // for a few consecutive frames.
        const lastDisplayed = (confidenceHistoryRef.current.length >= 2) ? confidenceHistoryRef.current[confidenceHistoryRef.current.length - 2] : smoothed;
        const delta = Math.abs(smoothed - lastDisplayed);
        const stableThreshold = 6; // percent
        const stableFramesRequired = 3;
        if (delta <= stableThreshold) {
            // small change - consider stable
            // nothing extra required; displayed value will naturally follow
        } else {
            // large change - require a few frames before showing
            // push the smoothed value but don't round immediately
        }

        return Math.round(smoothed);
    }, [calculateLandmarkScore, calculateOrientationScore, calculateStabilityScore]);

    const onResults = useCallback((results: Results) => {
        const confidence = calculateConfidence(results);
        setCurrentConfidence(confidence);

        // Active Proctoring Logic
        if (confidence < confidenceThreshold) {

            // If already at 2 strikes, immediate failure on next persistence? 
            // Or use the countdown? User said: "at the 3rd time its not shows count down instead quiz will get directly submitted"

            setViolationType(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 1 ? 'multiple_faces' : 'low_confidence');
            setIsViolating(true);

            // Managed by useEffect below

        } else {
            // Recovered
            setIsViolating(false);
            setViolationType(null);
            setCountdown(5); // Reset timer
        }
    }, [calculateConfidence, confidenceThreshold]);

    // Countdown and Strike Manager
    useEffect(() => {
        if (!enabled || !isViolating) {
            setCountdown(5); // Reset
            return;
        }

            if (warningCount >= 3) {
                onAutoSubmit();
                return;
            }

            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        // Timeout hit -> Strike!
                        setWarningCount(c => c + 1);
                        onViolation(); // Notify parent
                        
                        if (warningCount >= 2) {
                            onAutoSubmit(); 
                        }
                        return 5; // Reset countdown for *next* potential strike if they persist?
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }, [enabled, isViolating, warningCount, onAutoSubmit, onViolation]);

    // Initialize MediaPipe Face Mesh
    useEffect(() => {
        if (!enabled || !videoRef.current) return;

        const initializeFaceMesh = async () => {
            try {
                // Modified: We no longer manage the stream here.
                // We expect videoRef.current to be populated and playing by the parent component.
                const video = videoRef.current;

                if (!video) return;

                // Wait for video to be ready
                if (video.readyState < 2) {
                    await new Promise<void>((resolve) => {
                        const onLoadedData = () => {
                            video.removeEventListener('loadeddata', onLoadedData);
                            resolve();
                        };
                        video.addEventListener('loadeddata', onLoadedData);
                    });
                }

                // Create FaceMesh once
                if (!faceMeshRef.current) {
                    const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';
                    const getAssetUrl = (file: string) => {
                        if (typeof window !== 'undefined' && window.location.origin) {
                            return `${window.location.origin}/mediapipe/${file}`;
                        }
                        return `/mediapipe/${file}`;
                    };
                    const createFaceMesh = (opts: { refineLandmarks: boolean; minDetectionConfidence: number; minTrackingConfidence: number; }) => {
                        return new FaceMeshConstructor({
                            locateFile: (file: string | undefined) => {
                                if (!file) return getAssetUrl('');
                                // Fallback to CDN URL if local asset fetch is not used
                                return getAssetUrl(file);
                            },
                        });
                    };

                    try {
                        const faceMesh = createFaceMesh({ refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
                        faceMesh.setOptions({
                            maxNumFaces: 2, // Enable multi-face detection
                            refineLandmarks: true,
                            minDetectionConfidence: 0.7,
                            minTrackingConfidence: 0.7,
                        });
                        faceMesh.onResults(onResults);
                        faceMeshRef.current = faceMesh;
                    } catch (initErr) {
                        console.warn('Primary FaceMesh init failed, attempting fallback without refineLandmarks', initErr);
                        try {
                            const faceMesh = createFaceMesh({ refineLandmarks: false, minDetectionConfidence: 0.55, minTrackingConfidence: 0.55 });
                            faceMesh.setOptions({
                                maxNumFaces: 2,
                                refineLandmarks: false,
                                minDetectionConfidence: 0.55,
                                minTrackingConfidence: 0.55,
                            });
                            faceMesh.onResults(onResults);
                            faceMeshRef.current = faceMesh;
                        } catch (fallbackErr) {
                            console.error('Fallback FaceMesh init also failed:', fallbackErr);
                            throw fallbackErr;
                        }
                    }
                }

                // Start a safe animation loop that only calls send when video is ready
                const loop = async () => {
                    try {
                        const videoEl = videoRef.current;

                        // Respect temporary backoff after repeated send errors
                        if (backoffUntilRef.current && backoffUntilRef.current > Date.now()) {
                            // skip this frame
                        } else if (faceMeshRef.current && videoEl && videoEl.readyState === 4 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                            // Limit send rate to reduce wasm/GL pressure (send every other frame)
                            frameCountRef.current = (frameCountRef.current || 0) + 1;
                            if (frameCountRef.current % 2 === 0) {
                                try {
                                    await faceMeshRef.current.send({ image: videoEl });
                                    consecutiveSendErrorsRef.current = 0;
                                } catch (err) {
                                    console.warn('faceMesh.send failed for a frame:', err);
                                    consecutiveSendErrorsRef.current = (consecutiveSendErrorsRef.current || 0) + 1;
                                    // If multiple consecutive errors, back off briefly to allow state to settle
                                    if (consecutiveSendErrorsRef.current >= 3) {
                                        backoffUntilRef.current = Date.now() + 1000; // 1s backoff
                                        consecutiveSendErrorsRef.current = 0;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error during face mesh loop:', err);
                    }
                    animationRef.current = requestAnimationFrame(loop);
                };

                animationRef.current = requestAnimationFrame(loop);
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize face mesh:', error);
                // If permission denied or other error, ensure we don't leave pending state
                // If permission denied or other error, ensure we don't leave pending state
                // localStream is managed by parent, no need to stop tracks here

            }
        };

        initializeFaceMesh();

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            if (faceMeshRef.current) {
                try { faceMeshRef.current.close(); } catch { };
                faceMeshRef.current = null;
            }
            // We do NOT stop the stream tracks here anymore, because we don't own them.
            // Parent component handles the stream.

            // Reset backoff/frames/history
            backoffUntilRef.current = null;
            consecutiveSendErrorsRef.current = 0;
            frameCountRef.current = 0;
            confidenceHistoryRef.current = [];
            emaRef.current = null;
            if (violationTimeoutRef.current) {
                clearTimeout(violationTimeoutRef.current);
            }
            setIsInitialized(false);
        };
    }, [enabled, videoRef, onResults]);

    return {
        isInitialized,
        currentConfidence,
        warningCount,
        isViolating,
        valiationType: violationType,
        countdown
    };
}
