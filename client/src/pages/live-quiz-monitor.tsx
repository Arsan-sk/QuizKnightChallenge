import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Camera, Users, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
// NavBar removed per request
import { useQuery } from "@tanstack/react-query";
import { Quiz } from "@shared/schema";

interface Student {
  id: number;
  username: string;
  avatarUrl?: string;
  lastScreenshot?: string;
  lastScreenshotTime?: Date;
  violations: number;
  status: "online" | "offline" | "warning";
}

export default function LiveQuizMonitorPage() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [captureFrequency, setCaptureFrequency] = useState(30); // in seconds
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();
  
  const { data: quiz } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
  });
  
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
      },
      { 
        id: 4, 
        username: "student4", 
        avatarUrl: "", 
        violations: 2, 
        status: "warning",
        lastScreenshotTime: new Date(Date.now() - 30000)
      },
      { 
        id: 5, 
        username: "student5", 
        avatarUrl: "", 
        violations: 0, 
        status: "online",
        lastScreenshotTime: new Date(Date.now() - 15000)
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
  };
  
  const handleStopCapture = () => {
    setIsCapturing(false);
    
    toast({
      title: "Screenshot monitoring stopped",
      description: "Students will no longer have screenshots captured.",
    });
  };
  
  const handleTakeImmediateScreenshot = (studentId: number) => {
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
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto py-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/teacher")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Live Quiz Monitoring</h1>
                <p className="text-muted-foreground">
                  {quiz ? quiz.title : "Loading quiz..."}
                </p>
              </div>
            </div>
            
            <Badge 
              variant={isCapturing ? "default" : "outline"} 
              className="px-3 py-1 text-base"
            >
              {isCapturing ? "Monitoring Active" : "Monitoring Inactive"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Connected Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-xl font-medium">{students.length} students</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">
                        Screenshot frequency (seconds)
                      </label>
                      <div className="flex mt-2 gap-2">
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
                          <Button onClick={handleStartCapture} className="whitespace-nowrap">
                            Start Monitoring
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2 font-medium">Monitoring features:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Periodic screenshots</li>
                        <li>Violation detection</li>
                        <li>Real-time notifications</li>
                        <li>Student activity tracking</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <p className="font-medium mb-1">Privacy notice</p>
                      <p>Screenshots and monitoring data will be automatically deleted after the quiz ends.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Active Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
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
                      <tbody className="divide-y">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar>
                                  <AvatarImage src={student.avatarUrl} alt={student.username} />
                                  <AvatarFallback>{student.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.username}</span>
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
                  
                  {students.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No students are currently active</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Student Screenshots Preview Area */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.filter(s => s.status === "warning").map(student => (
                  <Card key={`preview-${student.id}`} className="overflow-hidden">
                    <div className="p-3 bg-destructive/10 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{student.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{student.username}</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {student.violations} violations
                      </Badge>
                    </div>
                    <div className="p-4 h-32 flex items-center justify-center bg-muted/30">
                      <p className="text-muted-foreground text-sm italic">Screenshot preview would appear here</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 