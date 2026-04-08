import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, Upload, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoClip {
  /** 影片標題（如「正面視角」「側面視角」） */
  label: string;
  /** 影片來源 URL（MP4 或其他瀏覽器支援格式） */
  src: string;
  /** 縮圖（可選） */
  poster?: string;
}

interface VideoPlayerProps {
  /** 動作類型（顯示在標題） */
  type: "batting" | "pitching";
  /** 影片清單；若為空則顯示 upload placeholder */
  clips?: VideoClip[];
}

/**
 * 動作影片播放器 — 列印 / PDF 輸出時自動隱藏（print:hidden）
 */
const VideoPlayer = ({ type, clips = [] }: VideoPlayerProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const title = type === "batting" ? "打擊動作影片" : "投球動作影片";
  const activeClip = clips[activeIdx];

  return (
    <div className="mt-6 print:hidden">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          {title}
          {clips.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({activeIdx + 1} / {clips.length})
            </span>
          )}
        </h4>
        {clips.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setActiveIdx((i) => Math.min(clips.length - 1, i + 1))}
              disabled={activeIdx === clips.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border/50 rounded-lg bg-muted/20">
          <Upload className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">尚未上傳動作影片</p>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            上傳影片
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 主要播放器 */}
          <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video">
            {activeClip?.src ? (
              <video
                key={activeClip.src}
                src={activeClip.src}
                poster={activeClip.poster}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Play className="w-10 h-10 opacity-40" />
              </div>
            )}
          </div>
          {/* 影片標籤 */}
          <p className="text-sm font-medium text-foreground">{activeClip?.label}</p>
          {/* 切換縮圖列 */}
          {clips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {clips.map((clip, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-md border text-xs transition-colors",
                    idx === activeIdx
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {clip.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
        <Video className="w-3 h-3" />
        註：影片於 PDF 輸出時不顯示
      </p>
    </div>
  );
};

export default VideoPlayer;
