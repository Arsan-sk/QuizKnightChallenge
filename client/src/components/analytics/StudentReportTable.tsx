import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentReport } from "@/types/analytics";
import { formatTime } from "@/utils/analytics";
import { Eye, Users } from "lucide-react";
import { useState } from "react";

interface StudentReportTableProps {
  data: StudentReport[];
  quizId: string;
}

export function StudentReportTable({ data, quizId }: StudentReportTableProps) {
  const [sortBy, setSortBy] = useState<keyof StudentReport>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle column header click for sorting
  const handleSort = (column: keyof StudentReport) => {
    if (sortBy === column) {
      // Toggle direction if same column is clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Sort the data
  const sortedData = [...data].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    
    // Handle string comparisons
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === "asc" 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    
    // Handle number comparisons
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
  
  // Render sort indicator
  const renderSortIndicator = (column: keyof StudentReport) => {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Student Reports
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No student data available for this quiz
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("username")}
                  >
                    Student{renderSortIndicator("username")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort("score")}
                  >
                    Score (%){renderSortIndicator("score")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort("correctAnswers")}
                  >
                    Correct{renderSortIndicator("correctAnswers")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort("wrongAnswers")}
                  >
                    Wrong{renderSortIndicator("wrongAnswers")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort("timeTaken")}
                  >
                    Time{renderSortIndicator("timeTaken")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("completedAt")}
                  >
                    Completed{renderSortIndicator("completedAt")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((student) => (
                  <TableRow key={`${student.userId}-${student.completedAt}`}>
                    <TableCell>{student.username}</TableCell>
                    <TableCell className="text-right">
                      {student.score.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {student.correctAnswers}
                    </TableCell>
                    <TableCell className="text-right">
                      {student.wrongAnswers}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTime(student.timeTaken)}
                    </TableCell>
                    <TableCell>
                      {new Date(student.completedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/quiz-review/${quizId}?userId=${student.userId}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          Click column headers to sort the data
        </div>
      </CardContent>
    </Card>
  );
} 