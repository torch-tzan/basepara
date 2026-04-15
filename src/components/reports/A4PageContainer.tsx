import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import baseparaLogo from "@/assets/basepara-logo.svg";
import baseparaLogoLight from "@/assets/basepara-logo-light.svg";

interface A4PageContainerProps {
  children: ReactNode;
  className?: string;
  /** 頁碼（可選） */
  pageNumber?: number;
  /** 總頁數（可選） */
  totalPages?: number;
  /** 是否顯示裝飾底圖（預設 true） */
  showDecoration?: boolean;
}

/**
 * A4 頁面容器 — 螢幕預覽 & 列印 / PDF 輸出共用
 * - 頂部藍色 header 色帶（延伸至紙張邊緣），左上角 basepara 淺色 logo
 * - 底部裝飾色帶 + 右下 basepara 浮水印
 * - 以 `.a4-page` / `.a4-header-band` class 對應 print CSS 的精準控制
 */
const A4PageContainer = ({
  children,
  className,
  pageNumber,
  totalPages,
  showDecoration = true,
}: A4PageContainerProps) => {
  return (
    <section
      className={cn(
        "a4-page",
        // 螢幕樣式
        "relative bg-card mx-auto mb-8 rounded-lg border border-border shadow-lg overflow-hidden",
        "w-full max-w-[210mm] h-[297mm]",
        // 上方保留 header 色帶空間（15mm）；左右下 15mm
        "pt-[25mm] px-[15mm] pb-[15mm]",
        className
      )}
    >
      {/* ═══ 頂部藍色 header 色帶（延伸至頁面邊緣） ═══ */}
      <header
        className="a4-header-band absolute top-0 left-0 right-0 h-[15mm] flex items-center px-[10mm] z-20"
        style={{ backgroundColor: "hsl(var(--primary))" }}
      >
        <img
          src={baseparaLogoLight}
          alt="basepara"
          className="h-[8mm] w-auto select-none"
          draggable={false}
        />
        <div className="ml-auto text-[10px] text-white/75 tracking-[0.2em] font-medium uppercase">
          basepara · assessment report
        </div>
      </header>

      {/* ═══ 裝飾層（僅在內容區） ═══ */}
      {showDecoration && (
        <>
          {/* 左上柔光（在 header 下方） */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[15mm] -left-16 w-56 h-56 rounded-full bg-primary/[0.04] blur-2xl"
          />
          {/* 底部裝飾色帶 */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"
          />
          {/* 右下 basepara 浮水印 */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-12 right-10 opacity-[0.045]"
          >
            <img
              src={baseparaLogo}
              alt=""
              className="w-48 h-48 object-contain select-none"
              draggable={false}
            />
          </div>
        </>
      )}

      {/* ═══ 內容層 ═══ */}
      <div className="relative z-10">{children}</div>

      {/* 頁碼（右下） */}
      {pageNumber != null && (
        <div className="absolute bottom-4 right-6 text-[10px] text-muted-foreground z-10">
          {totalPages ? `${pageNumber} / ${totalPages}` : pageNumber}
        </div>
      )}

      {/* 文件腳注（左下） */}
      <div className="absolute bottom-4 left-6 text-[10px] text-muted-foreground/70 z-10 tracking-wider">
        BASEPARA · 檢測報告
      </div>
    </section>
  );
};

export default A4PageContainer;
