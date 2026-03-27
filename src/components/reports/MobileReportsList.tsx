import { useNavigate } from "react-router-dom";
import { Download, ChevronRight, Circle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTestTypeColor } from "@/data/trainingTemplates";

interface Report {
  id: string;
  date: string;
  team: string;
  player: string;
  type: string;
  studentId: string;
  teamId: string;
}

interface MobileReportsListProps {
  reports: Report[];
  isStudent?: boolean;
}

const MobileReportsList = ({ reports, isStudent = false }: MobileReportsListProps) => {
  const navigate = useNavigate();
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">目前沒有檢測報告</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const typeColor = getTestTypeColor(report.type);
        
        return (
          <div
            key={report.id}
            className="bg-card rounded-lg border border-border p-4 active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => navigate(`/reports/${report.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Content */}
              <div className="flex-1 min-w-0">
                {/* Date and Type */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">{report.date}</span>
                  <Badge 
                    className={cn(
                      "flex items-center gap-1 text-[10px] px-1.5 py-0.5 border-0",
                      typeColor.bg,
                      typeColor.text,
                      `hover:${typeColor.bg}`
                    )}
                  >
                    <Circle className={cn("w-1.5 h-1.5", typeColor.dot)} />
                    {report.type}
                  </Badge>
                </div>
                
                {/* School and Player - only for coaches */}
                {!isStudent && (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {report.player}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {report.team}
                    </p>
                  </div>
                )}
                
                {/* For students, just show a summary line */}
                {isStudent && (
                  <p className="text-sm font-medium text-foreground">
                    {report.type}檢測報告
                  </p>
                )}
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileReportsList;
