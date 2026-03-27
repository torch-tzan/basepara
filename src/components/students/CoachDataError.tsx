import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/contexts/StudentsContext";

interface CoachDataErrorProps {
  className?: string;
}

export const CoachDataError = ({ className }: CoachDataErrorProps) => {
  const { hasCoachDataError, refetchCoachData } = useStudents();

  if (!hasCoachDataError) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>教練資料讀取失敗</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-destructive hover:text-destructive"
        onClick={refetchCoachData}
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        重試
      </Button>
    </div>
  );
};

interface CoachLoadingSkeletonProps {
  className?: string;
}

export const CoachLoadingSkeleton = ({ className }: CoachLoadingSkeletonProps) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-20 rounded-md" />
    </div>
  );
};

interface CoachSectionProps {
  label: string;
  coaches: string[];
  variant: "secondary" | "outline";
  isLoading: boolean;
}

export const CoachSection = ({ label, coaches, variant, isLoading }: CoachSectionProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <CoachLoadingSkeleton />
      ) : coaches && coaches.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {coaches.map((coach, idx) => (
            <Badge key={idx} variant={variant} className="text-sm py-1 px-3">
              {coach}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">-</p>
      )}
    </div>
  );
};

export default CoachDataError;
