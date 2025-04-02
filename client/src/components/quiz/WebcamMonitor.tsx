import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface WebcamMonitorProps {
  enabled: boolean;
  onViolationDetected: () => void;
}

export function WebcamMonitor({ enabled, onViolationDetected }: WebcamMonitorProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facesDetected, setFacesDetected] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const monitoringRef = useRef<boolean>(false);
  const consecutiveDetectionsRef = useRef<number>(0);
  
  // Stop webcam function - reusable
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    // Reset the video element
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setDetectionActive(false);
    monitoringRef.current = false;
  }, [stream]);
  
  // Start webcam
  const startWebcam = useCallback(async () => {
    if (!enabled) return;
    
    // Clear any previous streams
    stopWebcam();
    
    try {
      // Clear any previous error messages
      setErrorMessage(null);
      setIsVerifying(true);
      
      const userMedia = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(userMedia);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = userMedia;
        
        // Listen for when the video actually starts playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                // Start detection loop once video is playing
                setDetectionActive(true);
                monitoringRef.current = true;
                setIsVerifying(false);
              })
              .catch(err => {
                console.error("Error playing video:", err);
                setErrorMessage("Could not start webcam monitoring. Please reload the page.");
                setIsVerifying(false);
                setDetectionActive(false);
                monitoringRef.current = false;
              });
          }
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setHasPermission(false);
      setDetectionActive(false);
      monitoringRef.current = false;
      
      // Provide more specific error messages
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No webcam detected. Please connect a camera to your device.");
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access denied. Please enable camera permissions in your browser settings.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMessage("Cannot access your camera. It may be in use by another application.");
      } else {
        setErrorMessage("Unable to access webcam. Please ensure your camera is connected and permissions are granted.");
      }
      
      toast({
        title: "Webcam Error",
        description: err.message || "Unable to access webcam for proctoring",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [enabled, stopWebcam]);
  
  // Re-initialize webcam when enabled changes
  useEffect(() => {
    if (enabled) {
      startWebcam();
    } else {
      stopWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [enabled, startWebcam, stopWebcam]);
  
  // Monitor for disconnected devices
  useEffect(() => {
    const handleDeviceChange = () => {
      // Only restart if we already had permission and monitoring is active
      if (hasPermission === true && enabled && !stream) {
        console.log("Device change detected, attempting to restart webcam");
        startWebcam();
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [hasPermission, enabled, stream, startWebcam]);
  
  // Face detection implementation
  useEffect(() => {
    if (!enabled || !hasPermission || !stream || !videoRef.current || !canvasRef.current || !detectionActive) {
      return;
    }
    
    let detectInterval: number;
    const detectionInterval = 3000; // Check every 3 seconds
    
    // This would use a real face detection API in production
    // For this implementation, we're using a more controlled simulation
    const detectFaces = () => {
      if (!monitoringRef.current || !videoRef.current || !canvasRef.current || !stream) {
        setFacesDetected(0);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context || video.videoWidth === 0) {
        consecutiveDetectionsRef.current = 0;
        return;
      }
      
      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // In a real implementation, we would now pass the canvas image data to
        // a face detection API like TensorFlow.js face-api or a similar library
        
        // Simulate face detection based on user presence
        // This is just a simulation - in a real app, use a proper face detection API
        const simulatedFaceCount = (video.readyState === 4 && stream.active) 
          ? Math.floor(Math.random() * 2) + 1  // 1 or 2 faces
          : 0; // No faces if video isn't playing
        
        setFacesDetected(simulatedFaceCount);
        
        // Track consecutive violations
        if (simulatedFaceCount > 1) {
          consecutiveDetectionsRef.current++;
          
          // Only trigger violation after multiple consecutive detections
          // to avoid false positives
          if (consecutiveDetectionsRef.current >= 2) {
            toast({
              title: "Multiple people detected",
              description: `Warning: ${simulatedFaceCount} people detected in camera view.`,
              variant: "destructive",
            });
            
            // Call the violation callback
            onViolationDetected();
            consecutiveDetectionsRef.current = 0; // Reset after reporting
          }
        } else {
          // Reset consecutive detections if only one face is detected
          consecutiveDetectionsRef.current = 0;
        }
      } catch (error) {
        console.error("Error in face detection:", error);
        consecutiveDetectionsRef.current = 0;
      }
    };
    
    // Initial detection
    detectFaces();
    
    // Set up interval for ongoing detection
    detectInterval = window.setInterval(detectFaces, detectionInterval);
    
    // Tab visibility handling to stop/resume detection when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab becomes invisible, pause monitoring
        monitoringRef.current = false;
      } else {
        // When tab becomes visible again, resume monitoring after a short delay
        setTimeout(() => {
          if (stream && stream.active && videoRef.current && videoRef.current.readyState === 4) {
            monitoringRef.current = true;
            detectFaces(); // Run a detection immediately
          } else if (enabled && hasPermission) {
            // Try to restart the webcam if it's not active
            startWebcam();
          }
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.clearInterval(detectInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, hasPermission, stream, onViolationDetected, detectionActive, startWebcam]);
  
  if (!enabled) return null;
  
  return (
    <div className="webcam-container">
      {hasPermission === false && (
        <div className="webcam-error p-4 bg-red-100 text-red-700 rounded-lg fixed top-20 right-4 z-50 shadow-lg max-w-xs">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-medium">Camera access error</p>
          </div>
          <p className="mt-1 text-sm">{errorMessage || "Camera access denied. Please enable your camera to continue with the quiz."}</p>
          <button 
            onClick={startWebcam}
            className="mt-2 px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-800"
          >
            Retry Camera Access
          </button>
        </div>
      )}
      
      {isVerifying && (
        <div className="fixed top-20 right-4 p-3 bg-amber-100 text-amber-700 rounded-lg z-50 shadow-lg max-w-xs">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p className="text-sm font-medium">Verifying camera access...</p>
          </div>
        </div>
      )}
      
      {/* Hidden video element to receive webcam stream */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{ display: 'none' }} 
      />
      
      {/* Hidden canvas for processing video frames */}
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }} 
        width="640" 
        height="480"
      />
      
      {/* Visual indicator of monitoring status */}
      {hasPermission && (
        <div className="webcam-status fixed top-4 right-4 p-2 bg-black/70 text-white rounded-lg flex items-center z-50 shadow-md">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            facesDetected === 1 ? 'bg-green-500' : 
            facesDetected > 1 ? 'bg-red-500 animate-pulse' : 
            'bg-yellow-500'
          }`}></div>
          <span className="text-xs">
            {!detectionActive ? "Initializing..." :
             facesDetected === 0 ? "No face detected" : 
             facesDetected === 1 ? "Proctoring active" : 
             `Warning: ${facesDetected} faces detected`}
          </span>
        </div>
      )}
    </div>
  );
} 