import { useState, useRef, useEffect } from "react";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { courseColorOptions, isValidHexColor, getCourseColorValue } from "@/data/trainingTemplates";

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  // 取得目前的實際色碼值
  const currentHexValue = getCourseColorValue(value);
  
  // 本地輸入狀態（不含 # 號）
  const [hexInput, setHexInput] = useState(currentHexValue.replace("#", ""));
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 當外部值改變時同步輸入框
  useEffect(() => {
    const newHexValue = getCourseColorValue(value);
    setHexInput(newHexValue.replace("#", ""));
  }, [value]);

  // 處理預設顏色點擊
  const handlePresetClick = (presetValue: string) => {
    onChange(presetValue);
  };

  // 處理 Hex 輸入變更
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 僅允許 hex 字元
    const input = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    if (input.length <= 6) {
      setHexInput(input);
    }
  };

  // 處理輸入框失焦時套用顏色
  const handleHexInputBlur = () => {
    if (hexInput.length === 6) {
      const hexColor = `#${hexInput}`;
      if (isValidHexColor(hexColor)) {
        onChange(hexColor);
      }
    }
  };

  // 處理 Enter 鍵
  const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleHexInputBlur();
    }
  };

  // 處理色盤選擇
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hexColor = e.target.value.toUpperCase();
    onChange(hexColor);
  };

  // 開啟色盤
  const openColorPicker = () => {
    colorInputRef.current?.click();
  };

  // 判斷顏色是否為深色（用於決定勾選標記顏色）
  const isColorDark = (hexColor: string): boolean => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // 判斷目前顏色是否為預設顏色
  const isPresetSelected = (presetValue: string): boolean => {
    return value === presetValue;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 預設顏色列 */}
      <div className="flex flex-wrap gap-2">
        {courseColorOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handlePresetClick(option.value)}
            className={cn(
              "relative w-8 h-8 rounded-full border-2 transition-all",
              isPresetSelected(option.value)
                ? "border-foreground scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: option.color }}
            title={option.label}
          >
            {isPresetSelected(option.value) && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check
                  className="w-4 h-4"
                  strokeWidth={3}
                  color={option.isDark ? "white" : "black"}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hex 輸入與色盤 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[160px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
            #
          </span>
          <Input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            onKeyDown={handleHexInputKeyDown}
            placeholder="FF5733"
            className="pl-7 font-mono uppercase"
            maxLength={6}
          />
        </div>
        
        {/* 色盤按鈕 */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openColorPicker}
            className="relative overflow-hidden"
            title="開啟色盤"
          >
            <div
              className="absolute inset-1 rounded"
              style={{ backgroundColor: currentHexValue }}
            />
            <Pipette className="relative z-10 w-4 h-4" style={{ 
              color: isColorDark(currentHexValue) ? "white" : "black" 
            }} />
          </Button>
          <input
            ref={colorInputRef}
            type="color"
            value={currentHexValue}
            onChange={handleColorPickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        </div>

        {/* 顏色預覽 */}
        <div
          className="w-8 h-8 rounded border border-border flex-shrink-0"
          style={{ backgroundColor: currentHexValue }}
          title={`目前顏色: ${currentHexValue}`}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        選擇的顏色將會在課表上顯示
      </p>
    </div>
  );
}
