import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useFaceProctoring } from '@/hooks/useFaceProctoring';

interface CameraIntegrityCheckProps {
    onVerified: () => void;
}

export function CameraIntegrityCheck({ onVerified }: CameraIntegrityCheckProps) {
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [checkingFace, setCheckingFace] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { isInitialized, currentConfidence } = useFaceProctoring(videoRef, {
        enabled: checkingFace,
        onViolation: () => { }, // No violations during check, just monitoring
        onAutoSubmit: () => { },
        confidenceThreshold: 70
    });

    // Request camera permission
    useEffect(() => {
        const requestCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' }
                });

                setStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                setPermissionGranted(true);
                setError(null);

                // Store stream for cleanup
                // We'll attach it to a ref or just rely on the video element srcObject cleanup logic
            } catch (err: any) {
                setPermissionGranted(false);

                if (err.name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access to continue.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found. Please connect a camera to take this quiz.');
                } else {
                    setError(`Camera error: ${err.message || 'Unable to access camera'}`);
                }
            }
        };

        requestCamera();

        requestCamera();

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Only run once on mount

    // Attach stream to video element when it becomes available
    useEffect(() => {
        if (checkingFace && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }, [checkingFace, stream]);

    const handleCheckCamera = () => {
        setCheckingFace(true);
    };

    const faceDetected = checkingFace && isInitialized && currentConfidence >= 70;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Camera Integrity Verification
                    </CardTitle>
                    <CardDescription>
                        This quiz requires camera-based monitoring to ensure academic integrity
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Camera Preview */}
                    <div className="relative w-full aspect-square sm:aspect-video min-h-[320px] sm:min-h-0 bg-muted rounded-xl overflow-hidden border-2 border-border flex items-center justify-center">
                        {permissionGranted === null && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <Camera className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                                    <p className="text-sm text-muted-foreground">Requesting camera access...</p>
                                </div>
                            </div>
                        )}

                        {permissionGranted === false && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-2 p-6">
                                    <XCircle className="h-12 w-12 mx-auto text-destructive" />
                                    <p className="text-sm font-medium">Camera access required</p>
                                </div>
                            </div>
                        )}

                        {permissionGranted && !checkingFace && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                                    <p className="text-sm text-muted-foreground">Camera ready</p>
                                    <p className="text-xs text-muted-foreground">Click "Check Camera" to verify</p>
                                </div>
                            </div>
                        )}

                        {checkingFace && (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-contain mx-auto"
                                    style={{ transform: 'scaleX(-1)' }}
                                />

                                {/* Confidence Indicator */}
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${currentConfidence >= 70 ? 'bg-green-500' : 'bg-red-500'
                                            } animate-pulse`} />
                                        <span className="text-xs text-white font-medium">
                                            {currentConfidence}% confidence
                                        </span>
                                    </div>
                                </div>

                                {/* Face Detection Status */}
                                {currentConfidence >= 70 ? (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <div className="flex items-center gap-2 text-white">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Verified</span>
                                        </div>
                                    </div>
                                ) : currentConfidence > 0 ? (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <div className="flex items-center gap-2 text-white">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Look directly at screen</span>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Instructions */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm">Before you begin:</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>Position yourself in a well-lit area</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>Ensure your entire face is visible in the camera</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>Remain focused on the screen during the quiz</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                                <span>No other person should be visible in the frame</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                                <span>You will receive warnings for violations (3 max before auto-submission)</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex gap-3">
                    {!checkingFace && permissionGranted && (
                        <Button
                            onClick={handleCheckCamera}
                            className="flex-1"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Check Camera
                        </Button>
                    )}

                    {checkingFace && (
                        <Button
                            onClick={onVerified}
                            disabled={currentConfidence < 70}
                            className={`flex-1 ${currentConfidence >= 70 ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            {currentConfidence >= 70 ? (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Proceed to Quiz
                                </>
                            ) : currentConfidence > 0 ? (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Look at screen ({currentConfidence}%)
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Waiting for face detection...
                                </>
                            )}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
