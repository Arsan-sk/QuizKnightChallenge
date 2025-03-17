import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Camera, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  id: number;
  username: string;
  avatarUrl?: string;
  lastScreenshot?: string;
  lastScreenshotTime?: Date;
  violations: number;
  status: "online" | "offline" | "warning";
}

interface LiveQuizMonitorProps {
  quizId: number;
  onClose: () => void;
}

export function LiveQuizMonitor({ quizId, onClose }: LiveQuizMonitorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [captureFrequency, setCaptureFrequency] = useState(30); // in seconds
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real implementation, this would connect to a WebSocket or use polling
    // to get real-time updates about connected students and their screenshots
    
    // For demo purposes, we'll create some sample data
    const sampleStudents: Student[] = [
      { 
        id: 1, 
        username: "student1", 
        avatarUrl: "", 
        violations: 0, 
        status: "online",
        lastScreenshotTime: new Date()
      },
      { 
        id: 2, 
        username: "student2", 
        avatarUrl: "", 
        violations: 1, 
        status: "warning",
        lastScreenshotTime: new Date(Date.now() - 60000)
      },
      { 
        id: 3, 
        username: "student3", 
        avatarUrl: "", 
        violations: 0, 
        status: "online",
        lastScreenshotTime: new Date(Date.now() - 120000)
      }
    ];
    
    setStudents(sampleStudents);
  }, [quizId]);
  
  const handleStartCapture = () => {
    setIsCapturing(true);
    
    toast({
      title: "Screenshot monitoring started",
      description: `Students will be notified that screenshots are being taken every ${captureFrequency} seconds.`,
    });
    
    // In a real implementation, this would initiate the screenshot capture process
    // through a backend service or WebSocket connection
  };
  
  const handleStopCapture = () => {
    setIsCapturing(false);
    
    toast({
      title: "Screenshot monitoring stopped",
      description: "Students will no longer have screenshots captured.",
    });
  };
  
  const handleTakeImmediateScreenshot = (studentId: number) => {
    // In a real implementation, this would trigger an immediate screenshot
    // for the specific student through a backend API call
    
    toast({
      title: "Screenshot requested",
      description: `Requesting immediate screenshot from student ${studentId}...`,
    });
    
    // Update the student's last screenshot time
    setStudents(
      students.map(student => 
        student.id === studentId 
          ? { ...student, lastScreenshotTime: new Date() } 
          : student
      )
    );
  };
  
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card rounded-lg shadow-xl border w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Live Quiz Monitoring</h2>
            <p className="text-muted-foreground">
              Monitor students' progress and ensure compliance
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 flex gap-4">
          <Card className="w-1/3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Connected Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p>{students.length} students online</p>
                <Badge variant={isCapturing ? "default" : "outline"}>
                  {isCapturing ? "Monitoring Active" : "Monitoring Inactive"}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Screenshot frequency (seconds)
                  </label>
                  <div className="flex mt-1 gap-2">
                    <input
                      type="number"
                      value={captureFrequency}
                      onChange={(e) => setCaptureFrequency(parseInt(e.target.value))}
                      min={10}
                      max={300}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={isCapturing}
                    />
                    {isCapturing ? (
                      <Button onClick={handleStopCapture} variant="destructive">
                        Stop
                      </Button>
                    ) : (
                      <Button onClick={handleStartCapture}>
                        Start
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Monitoring features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Periodic screenshots</li>
                    <li>Violation detection</li>
                    <li>Real-time notifications</li>
                    <li>Student activity tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="w-2/3 flex flex-col">
            <div className="border rounded-md overflow-hidden h-full">
              <div className="bg-muted p-3 border-b">
                <h3 className="font-medium">Active Students</h3>
              </div>
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Last Screenshot</th>
                      <th className="text-left p-3 font-medium">Violations</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={student.avatarUrl} alt={student.username} />
                              <AvatarFallback>{student.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{student.username}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={student.status === "warning" ? "destructive" : "outline"}
                            className="flex gap-1 items-center"
                          >
                            {student.status === "warning" && <AlertTriangle className="h-3 w-3" />}
                            {student.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {student.lastScreenshotTime ? formatTimeAgo(student.lastScreenshotTime) : "Never"}
                        </td>
                        <td className="p-3">
                          <span className={student.violations > 0 ? "text-destructive font-bold" : ""}>
                            {student.violations}
                          </span>
                        </td>
                        <td className="p-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTakeImmediateScreenshot(student.id)}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Screenshot
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t mt-auto">
          <p className="text-sm text-muted-foreground">
            Screenshots and monitoring data will be automatically deleted after the quiz ends.
            All monitoring activities comply with privacy regulations.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
} 