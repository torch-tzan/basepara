import { useState, useRef } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CloudUpload, X, Mic, Video, CalendarIcon, Check, LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStudents } from "@/contexts/StudentsContext";

interface MediaFile {
  id: string;
  file: File;
  studentId: string;
  date: Date;
  isUploading: boolean;
  progress: number;
  isComplete: boolean;
}

interface TrainingMediaUploadProps {
  type: "audio" | "video";
}

const mediaConfig = {
  audio: {
    accept: "audio/*",
    icon: Mic,
    formats: "MP3、WAV、M4A 等音訊格式",
  },
  video: {
    accept: "video/*",
    icon: Video,
    formats: "MP4、MOV、AVI 等影片格式",
  },
};

const TrainingMediaUpload = ({ type }: TrainingMediaUploadProps) => {
  const { students } = useStudents();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = mediaConfig[type];
  const Icon: LucideIcon = config.icon;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const today = new Date();
    const newFiles: MediaFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      studentId: "",
      date: today,
      isUploading: false,
      progress: 0,
      isComplete: false,
    }));

    setMediaFiles((prev) => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileStudent = (id: string, studentId: string) => {
    setMediaFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, studentId } : f))
    );
  };

  const updateFileDate = (id: string, date: Date) => {
    setMediaFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, date } : f))
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Student options for dropdown
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.name} - ${s.teamName}`,
  }));

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drop Zone - Only show when no files */}
      {mediaFiles.length === 0 ? (
        <div
          onClick={handleDropZoneClick}
          className="border border-dashed border-border rounded-lg p-8 hover:border-muted-foreground cursor-pointer transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <CloudUpload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground mb-1">
                點擊上傳或拖曳檔案至此
              </p>
              <p className="text-xs text-muted-foreground">
                支援 {config.formats}，可選擇多個檔案
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Uploaded Files List with Add Button */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              已選擇 {mediaFiles.length} 個檔案
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDropZoneClick}
            >
              <Plus className="w-4 h-4" />
              新增檔案
            </Button>
          </div>
          
          {mediaFiles.map((mediaFile) => (
            <div
              key={mediaFile.id}
              className="p-4 bg-accent/50 dark:bg-white/5 rounded-lg border border-border space-y-3"
            >
              {/* File Info, Student & Date in One Row */}
              <div className="flex items-center gap-4">
                {/* File Icon & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-accent dark:bg-white/10 rounded flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{mediaFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(mediaFile.file.size)}
                    </p>
                  </div>
                </div>

                {/* Student Select */}
                <Select
                  value={mediaFile.studentId}
                  onValueChange={(value) => updateFileStudent(mediaFile.id, value)}
                >
                  <SelectTrigger className="w-48 shrink-0">
                    <SelectValue placeholder="選擇學員" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentOptions.map((student) => (
                      <SelectItem key={student.value} value={student.value}>
                        {student.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-36 shrink-0 justify-start text-left font-normal",
                        !mediaFile.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {mediaFile.date
                        ? format(mediaFile.date, "yyyy/MM/dd", { locale: zhTW })
                        : "選擇日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={mediaFile.date}
                      onSelect={(date) => date && updateFileDate(mediaFile.id, date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(mediaFile.id)}
                  disabled={mediaFile.isUploading}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {mediaFile.isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>上傳中...</span>
                    <span>{Math.round(mediaFile.progress)}%</span>
                  </div>
                  <Progress
                    value={mediaFile.progress}
                    className="h-2 bg-secondary dark:bg-white/10"
                  />
                </div>
              )}

              {/* Complete Status */}
              {mediaFile.isComplete && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Check className="w-4 h-4" />
                  <span>上傳完成</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingMediaUpload;
