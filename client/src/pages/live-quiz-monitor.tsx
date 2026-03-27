import { useRoute } from "wouter";

export default function LiveQuizMonitorPage() {
  const [, params] = useRoute("/teacher/monitor/:quizId");
  const quizId = params?.quizId;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Live Quiz Monitor</h1>
      <p>Monitoring quiz ID: {quizId}</p>
      {/* TODO: Implement real-time monitoring */}
    </div>
  );
}