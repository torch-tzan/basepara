

## 使用條款改為 Overlay 置中顯示

### 變更內容

將使用條款從 Popover 改為自訂的 overlay 模式，覆蓋在右側區域上方並置中顯示。

### 互動流程（不變）
1. 點擊「BasePara 使用條款」文字 → 開啟 overlay
2. 滾動到底部 → 按鈕變為可點擊
3. 點擊同意 → 關閉 overlay，checkbox 勾選

### 技術細節

**檔案：`src/pages/FirstLoginPasswordChange.tsx`**

1. **移除 Popover 相關元件**：不再使用 `Popover`、`PopoverTrigger`、`PopoverContent`、`PopoverAnchor`

2. **將右側容器改為 `relative`**：在右側 `div`（`w-full lg:w-1/2`）加上 `relative` 定位，作為 overlay 的定位參考

3. **新增 overlay 層**：當 `popoverOpen` 為 `true` 時，在右側容器內渲染：
   - 半透明背景遮罩：`absolute inset-0 z-40 bg-black/50` 覆蓋整個右側區域
   - 條款內容卡片：`absolute inset-0 z-50 flex items-center justify-center`，內部放置條款內容（寬度限制 `w-[90%] max-w-[420px]`）
   - 點擊遮罩背景可關閉（`onClick` 設定 `setPopoverOpen(false)`）

4. **條款觸發按鈕**：原本的 `PopoverTrigger` 改為普通 `button`，`onClick` 設定 `setPopoverOpen(true)`

5. **移除 `PopoverAnchor` 包裝**：Card 不再需要被 `PopoverAnchor` 包裝

6. **條款內容結構不變**：標題、滾動區域、同意按鈕的結構維持原樣，只是從 PopoverContent 搬到 overlay 卡片中
