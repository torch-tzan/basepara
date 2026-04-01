import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface A4PageContainerProps {
  children: ReactNode;
  className?: string;
  /** 頁碼（可選） */
  pageNumber?: number;
  /** 總頁數（可選） */
  totalPages?: number;
}

/**
 * A4 頁面容器
 * - 螢幕上：max-width 210mm 居中 + 陰影邊框模擬紙張感
 * - 列印時：自動分頁 + 隱藏裝飾
 */
const A4PageContainer = ({
  children,
  className,
  pageNumber,
  totalPages,
}: A4PageContainerProps) => {
  return (
    <section
      className={cn(
        // 螢幕樣式
        "relative bg-card mx-auto mb-8 rounded-lg border border-border shadow-lg",
        "w-full max-w-[210mm] min-h-[297mm] p-8",
        // 列印樣式
        "print:shadow-none print:border-0 print:rounded-none print:mb-0 print:p-[15mm]",
        "print:break-after-page print:break-inside-avoid",
        "print:max-w-none print:min-h-0",
        className
      )}
    >
      {children}

      {/* 頁碼 */}
      {pageNumber != null && (
        <div className="absolute bottom-4 right-8 text-xs text-muted-foreground print:bottom-[10mm] print:right-[15mm]">
          {totalPages ? `${pageNumber} / ${totalPages}` : pageNumber}
        </div>
      )}
    </section>
  );
};

export default A4PageContainer;
