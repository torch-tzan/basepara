import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Dumbbell, Video, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import AppLayout from "@/components/layout/AppLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import CourseComments from "@/components/course/CourseComments";
import { usePersonalCourseById } from "@/hooks/useSupabasePersonalCourses";

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const { getCourseById, getPersonalCourseById, getActionsByIds, isLoading } = useTrainingData();
  const isMobile = useIsMobile();
  const { authUser } = useAuth();
  const isStudent = authUser?.role === "student";

  // Get date from URL params (for schedule context)
  const dateParam = searchParams.get("date");
  
  // Check URL param to determine course type
  const courseType = searchParams.get("type");
  const isPersonalCourse = courseType === "personal";

  // Try to get course from context first (for public courses or already-loaded personal courses)
  const publicCourse = courseId ? getCourseById(courseId) : undefined;
  const personalCourseFromContext = courseId ? getPersonalCourseById(courseId) : undefined;
  
  // For personal courses not in context, fetch directly from Supabase
  const { data: fetchedPersonalCourse, isLoading: isLoadingPersonalCourse } = usePersonalCourseById(
    isPersonalCourse && !personalCourseFromContext ? courseId : undefined
  );
  
  // Determine the course to display
  const course = isPersonalCourse 
    ? (personalCourseFromContext || (fetchedPersonalCourse ? {
        id: fetchedPersonalCourse.id,
        name: fetchedPersonalCourse.name,
        category: fetchedPersonalCourse.category,
        actionIds: fetchedPersonalCourse.actionIds,
        notes: fetchedPersonalCourse.notes || undefined,
        color: fetchedPersonalCourse.color || undefined,
        updatedAt: new Date(fetchedPersonalCourse.updated_at).toISOString().split("T")[0],
        type: "personal" as const,
      } : undefined))
    : publicCourse;

  // Show loading while data is being fetched
  if (isLoading || isLoadingPersonalCourse) {
    return (
      <AppLayout title="課程詳情">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout title="課程詳情">
        <div className="flex flex-col items-center justify-center py-16">
          <Dumbbell className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">找不到此課程</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </AppLayout>
    );
  }

  const actions = getActionsByIds(course.actionIds);
  const courseColor = getCourseColorValue(course.color);
  const isDarkColor = isCourseColorDark(course.color);


  const breadcrumbItems = [
    { label: "課表", path: "/schedule" },
    { label: course.name },
  ];

  const content = (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbItems} />

      {/* Course Header with color accent and category */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: courseColor }}
          />
          <h1 className="text-xl font-semibold text-foreground">
            {course.name}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {course.category}
          </Badge>
        </div>
        {/* Notes inline */}
        {course.notes && (
          <p className="text-sm text-muted-foreground leading-relaxed pl-7">
            {course.notes}
          </p>
        )}
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        <h2 className="text-base font-medium text-foreground">
          訓練動作
          <span className="text-muted-foreground font-normal ml-2">
            {actions.length} 個動作
          </span>
        </h2>

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
                      className="w-8 sm:w-10 flex items-start justify-center pt-3 sm:pt-4 shrink-0"
                      style={{ 
                        backgroundColor: courseColor,
                        color: isDarkColor ? '#ffffff' : 'hsl(var(--foreground))'
                      }}
                    >
                      <span className="text-xs sm:text-sm font-bold">{index + 1}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 space-y-2.5 sm:space-y-3 min-w-0">
                      {/* Header: Category badge + Name */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[11px] sm:text-xs shrink-0">
                            {action.actionCategory}
                          </Badge>
                          {action.category && (
                            <Badge variant="outline" className="text-[11px] sm:text-xs shrink-0">
                              {action.category}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                          {action.name}
                        </h3>
                      </div>

                      {/* Training parameters - responsive grid */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <div className="flex-1 sm:flex-initial bg-muted/40 rounded px-2 py-1.5 min-w-[52px]">
                          <div className="text-[10px] sm:text-xs text-muted-foreground">組數</div>
                          <div className="text-xs sm:text-sm font-medium text-foreground">{action.sets}</div>
                        </div>
                        <div className="flex-1 sm:flex-initial bg-muted/40 rounded px-2 py-1.5 min-w-[52px]">
                          <div className="text-[10px] sm:text-xs text-muted-foreground">次數</div>
                          <div className="text-xs sm:text-sm font-medium text-foreground">{action.reps}</div>
                        </div>
                        <div className="flex-1 sm:flex-initial bg-muted/40 rounded px-2 py-1.5 min-w-[52px]">
                          <div className="text-[10px] sm:text-xs text-muted-foreground">強度</div>
                          <div className="text-xs sm:text-sm font-medium text-primary">{action.intensity}%</div>
                        </div>
                        {action.bat && (
                          <div className="flex-1 sm:flex-initial bg-muted/40 rounded px-2 py-1.5">
                            <div className="text-[10px] sm:text-xs text-muted-foreground">球棒</div>
                            <div className="text-xs sm:text-sm font-medium text-foreground">{action.bat}</div>
                          </div>
                        )}
                        {action.equipment && (
                          <div className="flex-1 sm:flex-initial bg-muted/40 rounded px-2 py-1.5">
                            <div className="text-[10px] sm:text-xs text-muted-foreground">輔具</div>
                            <div className="text-xs sm:text-sm font-medium text-foreground">{action.equipment}</div>
                          </div>
                        )}
                      </div>

                      {/* Notes & Video link */}
                      {(action.notes || action.videoUrl) && (
                        <div className="space-y-1.5 pt-0.5">
                          {action.notes && (
                            <div className="flex items-start gap-1.5 text-muted-foreground">
                              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span className="text-xs sm:text-sm leading-relaxed">{action.notes}</span>
                            </div>
                          )}
                          {action.videoUrl && (
                            <a 
                              href={action.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>觀看影片</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <CourseComments courseId={courseId || ""} courseName={course.name} />
    </div>
  );

  // Use MobileLayout for student on mobile, otherwise AppLayout
  if (isMobile && isStudent) {
    return (
      <MobileLayout title="課程詳情">
        {content}
      </MobileLayout>
    );
  }

  return (
    <AppLayout title="課程詳情">
      {content}
    </AppLayout>
  );
};

export default CourseDetail;
