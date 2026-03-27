import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface StudentProfileSkeletonProps {
  isMobile?: boolean;
}

const FieldSkeleton = () => (
  <div className="space-y-1">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-5 w-24" />
  </div>
);

const CoachSectionSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-16" />
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-20 rounded-md" />
    </div>
  </div>
);

export const MobileStudentProfileSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Action Buttons Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </div>

          {/* Coaches Section */}
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <CoachSectionSkeleton />
            <CoachSectionSkeleton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DesktopStudentProfileSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <FieldSkeleton />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-40" />
            </div>
            <FieldSkeleton />
          </div>
        </div>

        {/* Coaches Section */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <CoachSectionSkeleton />
          <CoachSectionSkeleton />
        </div>
      </CardContent>
    </Card>
  );
};

const StudentProfileSkeleton = ({ isMobile = false }: StudentProfileSkeletonProps) => {
  return isMobile ? <MobileStudentProfileSkeleton /> : <DesktopStudentProfileSkeleton />;
};

export default StudentProfileSkeleton;
