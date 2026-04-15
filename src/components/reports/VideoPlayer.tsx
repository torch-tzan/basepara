import { useState } from "react";
import { Video, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  /** 檢測日期（顯示於標題旁） */
  date?: string;
}

/**
 * 動作影片播放器 — 列印 / PDF 輸出時自動隱藏（print:hidden）
 * 標題右側使用下拉選單切換影片（取代左右箭頭）
 */
const VideoPlayer = ({ type, clips = [], date }: VideoPlayerProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const title = type === "batting" ? "打擊動作影片" : "投球動作影片";
  const activeClip = clips[activeIdx];

  return (
    <div className="mt-6 print:hidden">
      {date && clips.length > 0 && (
        <div className="mb-2 text-[11px] text-muted-foreground">
          當日日期：<span className="font-medium text-foreground">{date}</span>
          <span className="ml-2">共 {clips.length} 則影片</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-3 gap-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          {title}
          {clips.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({activeIdx + 1} / {clips.length})
            </span>
          )}
        </h4>

        {/* 切換影片：下拉選單 */}
        {clips.length > 0 && (
          <Select
            value={String(activeIdx)}
            onValueChange={(v) => setActiveIdx(Number(v))}
          >
            <SelectTrigger className="w-64 h-8 text-xs">
              <SelectValue placeholder="切換影片" />
            </SelectTrigger>
            <SelectContent>
              {clips.map((clip, idx) => (
                <SelectItem key={idx} value={String(idx)} className="text-xs">
                  {clip.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      )}

      <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
        <Video className="w-3 h-3" />
        註：影片於 PDF 輸出時不顯示
      </p>
    </div>
  );
};

export default VideoPlayer;
