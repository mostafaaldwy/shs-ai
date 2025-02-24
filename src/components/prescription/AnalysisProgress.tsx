
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  progress: number;
  statusMessage: string;
  isAnalyzing: boolean;
}

export const AnalysisProgress = ({ progress, statusMessage, isAnalyzing }: AnalysisProgressProps) => {
  if (!isAnalyzing) return null;

  return (
    <div className="space-y-4">
      <Progress value={progress} className="w-full" />
      <p className="text-center text-primary">{statusMessage}</p>
    </div>
  );
};
