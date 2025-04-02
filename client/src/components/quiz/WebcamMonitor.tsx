import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";

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
  
  // Start webcam
  useEffect(() => {
    if (!enabled) return;
    
    const startWebcam = async () => {
      try {
        const userMedia = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" }
        });
        setStream(userMedia);
        setHasPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = userMedia;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setHasPermission(false);
        toast({
          title: "Webcam Error",
          description: "Unable to access webcam. Please ensure your camera is connected and permissions are granted.",
          variant: "destructive",
        });
      }
    };
    
    startWebcam();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled]);
  
  // Simple face detection simulation (would use actual face detection API in production)
  useEffect(() => {
    if (!enabled || !hasPermission || !stream) return;
    
    // In a real implementation, we would connect to a face detection API here
    // For demonstration, this simulates random face detection
    const detectInterval = setInterval(() => {
      // This is a placeholder - in a real implementation, you would:
      // 1. Capture a frame from the video to the canvas
      // 2. Use a face detection API like TensorFlow.js or a cloud service
      // 3. Process the results to determine how many faces are visible
      
      // Simulating face detection with random numbers (1-3 faces)
      const simulatedFaces = Math.floor(Math.random() * 2) + 1;
      setFacesDetected(simulatedFaces);
      
      // If more than one face is detected, trigger violation
      if (simulatedFaces > 1) {
        toast({
          title: "Multiple people detected",
          description: `Warning: ${simulatedFaces} people detected in camera view.`,
          variant: "destructive",
        });
        
        // Call the violation callback if more than 1 face
        onViolationDetected();
      }
    }, 10000); // Check every 10 seconds in this demo
    
    return () => clearInterval(detectInterval);
  }, [enabled, hasPermission, stream, onViolationDetected]);
  
  if (!enabled) return null;
  
  return (
    <div className="webcam-container">
      {hasPermission === false && (
        <div className="webcam-error p-4 bg-red-100 text-red-700 rounded mb-4">
          <p>Camera access denied. Please enable your camera to continue with the quiz.</p>
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
        width="320" 
        height="240"
      />
      
      {/* Visual indicator of monitoring status */}
      <div className="webcam-status fixed top-4 right-4 p-2 bg-black/70 text-white rounded flex items-center z-50">
        <div className={`h-3 w-3 rounded-full mr-2 ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs">Proctoring active</span>
      </div>
    </div>
  );
} 