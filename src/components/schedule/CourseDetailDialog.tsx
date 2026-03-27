import { X, Clock, Dumbbell, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import type { CourseItem } from "@/data/trainingTemplates";

interface CourseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseItem | null;
}

const CourseDetailDialog = ({
  open,
  onOpenChange,
  course,
}: CourseDetailDialogProps) => {
  const { getActionsByIds } = useTrainingData();
  const isMobile = useIsMobile();

  if (!course || !open) return null;

  const actions = getActionsByIds(course.actionIds);
  const courseColor = getCourseColorValue(course.color);
  const isDarkColor = isCourseColorDark(course.color);

  // Calculate total sets and reps
  const totalSets = actions.reduce((sum, a) => sum + (a.sets || 0), 0);
  const totalReps = actions.reduce((sum, a) => sum + (a.sets || 0) * (a.reps || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col min-h-screen min-h-[100dvh] overflow-hidden">
      {/* Header with course color accent - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-[110] bg-card border-b border-border safe-area-top">
        {/* Color accent bar */}
        <div 
          className="h-1.5 w-full" 
          style={{ backgroundColor: courseColor }}
        />
        <div className="px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: courseColor }}
            />
            <h1 className="text-lg font-semibold text-foreground truncate">
              {course.name}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content - fills remaining space and scrolls, with top padding for fixed header */}
      {/* Mobile: add bottom padding for safe area */}
      <main className={`flex-1 overflow-y-auto pt-[62px] ${isMobile ? "pb-24 safe-area-bottom" : ""}`}>
        <div className={`p-4 md:p-6 lg:p-8 ${isMobile ? "" : "max-w-3xl mx-auto w-full"}`}>
          {/* Course Info Header */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              {course.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Dumbbell className="w-3 h-3 mr-1" />
              {actions.length} 個動作
            </Badge>
            {totalSets > 0 && (
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                共 {totalSets} 組
              </Badge>
            )}
          </div>

          {/* Notes Card */}
          {course.notes && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {course.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-foreground">訓練動作</h2>
              <span className="text-xs text-muted-foreground">
                {actions.length} 項
              </span>
            </div>

            {actions.length === 0 ? (
              <Card className="bg-muted/20">
                <CardContent className="py-12 text-center">
                  <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">尚無訓練動作</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <Card key={action.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Index indicator */}
                        <div 
                          className="w-12 md:w-14 flex items-center justify-center shrink-0"
                          style={{ 
                            backgroundColor: courseColor,
                            color: isDarkColor ? '#ffffff' : 'hsl(var(--foreground))'
                          }}
                        >
                          <span className="text-lg font-bold">{index + 1}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-4">
                          <h3 className="text-sm font-medium text-foreground mb-3">
                            {action.name}
                          </h3>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-muted/50 rounded-md">
                              <div className="text-xs text-muted-foreground mb-0.5">分類</div>
                              <div className="text-sm font-medium text-foreground truncate">
                                {action.actionCategory}
                              </div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-md">
                              <div className="text-xs text-muted-foreground mb-0.5">組數/次數</div>
                              <div className="text-sm font-medium text-foreground">
                                {action.sets} × {action.reps}
                              </div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-md">
                              <div className="text-xs text-muted-foreground mb-0.5">強度</div>
                              <div className="text-sm font-medium text-primary">
                                {action.intensity}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>最後更新：{course.updatedAt}</span>
            </div>
            {totalReps > 0 && (
              <span>總計 {totalReps} 次反覆</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetailDialog;
