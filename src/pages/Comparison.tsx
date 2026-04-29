import { useState } from "react";
import { FileDown, Printer, Search, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import TargetSelector, { type ComparisonTarget, type Sport } from "@/components/comparison/TargetSelector";
import ComparisonTable from "@/components/comparison/ComparisonTable";
import ComparisonPitchTable from "@/components/comparison/ComparisonPitchTable";
import { useComparisonData } from "@/hooks/useComparisonData";
import {
  getMetricGroupsByComparisonType,
  getPitchMetrics,
  getArmMetrics,
  type ComparisonType,
  type MetricDefinition,
} from "@/data/metricDefinitions";
import { allPitchTypes } from "@/components/reports/PitchTypeSection";

const comparisonTypeOptions = [
  { value: "打擊", label: "打擊" },
  { value: "投球", label: "投球" },
  { value: "身體素質", label: "身體素質" },
];

const sportOptions = [
  { value: "baseball", label: "棒球" },
  { value: "softball", label: "壘球" },
];

const testMethodOptions = [
  { value: "實戰", label: "實戰" },
  { value: "發球機", label: "發球機" },
];

const pitchTypeOptions = allPitchTypes.map((pt) => ({ value: pt, label: pt }));

const Comparison = () => {
  /** 運動類別：棒球（預設）/ 壘球；切換時 reset 兩邊 target 的層級/縣市選擇 */
  const [sport, setSport] = useState<Sport>("baseball");
  const [targetA, setTargetA] = useState<ComparisonTarget | null>(null);
  const [targetB, setTargetB] = useState<ComparisonTarget | null>(null);
  const [comparisonType, setComparisonType] = useState<ComparisonType>("打擊");
  const [pitchType, setPitchType] = useState("四縫線");
  const [_testMethod, setTestMethod] = useState("實戰");
  const [showResults, setShowResults] = useState(false);

  /**
   * 切運動類別時 reset 兩邊 target — 因為層級／學校／縣市可選清單在棒球與壘球之間
   * 不對稱（如「高中甲組」在壘球不存在），保留前次選值會誤導。
   */
  const handleSportChange = (val: string) => {
    setSport(val as Sport);
    setTargetA(null);
    setTargetB(null);
    setShowResults(false);
  };

  const { valuesA, valuesB, pitchValuesA, pitchValuesB, showPR, prMap, isReady } =
    useComparisonData({
      targetA: showResults ? targetA : null,
      targetB: showResults ? targetB : null,
      comparisonType,
      pitchType,
    });

  const canCompare = !!targetA?.id && !!targetB?.id;

  const handleCompare = () => {
    if (canCompare) setShowResults(true);
  };

  // 切換比較類型時重設結果
  const handleTypeChange = (val: string) => {
    setComparisonType(val as ComparisonType);
    setShowResults(false);
  };

  // 把 secondary filter（縣市/層級交叉）+ 性別加入顯示 label：例「高中甲組・新北市・男」
  const formatTargetLabel = (t: ComparisonTarget | null, fallback: string) => {
    if (!t?.label) return fallback;
    const parts: string[] = [t.label];
    if (t.secondary?.id) parts.push(t.secondary.id);
    if (t.type !== "individual" && t.gender && t.gender !== "all") {
      parts.push(t.gender === "male" ? "男" : "女");
    }
    return parts.join("・");
  };
  const labelA = formatTargetLabel(targetA, "A");
  const labelB = formatTargetLabel(targetB, "B");

  // ─────── 匯出工具 ───────
  /** 觸發瀏覽器下載 */
  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** 取得當前比較表格資料用以組 CSV */
  const buildCsvRows = (): string[][] => {
    const rows: string[][] = [];

    /** 將 cell 數值組成顯示文字（含 ± SD 與 N=） */
    const cellText = (
      v: { value: number | string | null; sd?: number | null; n?: number } | undefined,
      decimals = 1
    ): string => {
      if (!v || v.value == null) return "—";
      if (typeof v.value === "string") return v.value;
      let s = v.value.toFixed(decimals);
      if (v.sd != null) s += ` ± ${v.sd.toFixed(decimals)}`;
      if (v.n != null) s += ` (N=${v.n})`;
      return s;
    };

    const diffText = (
      a: { value: number | string | null } | undefined,
      b: { value: number | string | null } | undefined,
      decimals = 1
    ): string => {
      if (!a || !b || a.value == null || b.value == null) return "—";
      if (typeof a.value === "string" || typeof b.value === "string") return "—";
      const d = a.value - b.value;
      return `${d > 0 ? "+" : ""}${d.toFixed(decimals)}`;
    };

    const headerRow = ["分組", "參數", "單位", labelA, labelB, "差異"];
    if (showPR) headerRow.push("PR");

    const pushTable = (
      groupTitle: string,
      metrics: MetricDefinition[],
      vA: Array<{ key: string; value: number | string | null; sd?: number | null; n?: number }>,
      vB: Array<{ key: string; value: number | string | null; sd?: number | null; n?: number }>
    ) => {
      const mapA = new Map(vA.map((v) => [v.key, v]));
      const mapB = new Map(vB.map((v) => [v.key, v]));
      metrics.forEach((m) => {
        const a = mapA.get(m.key);
        const b = mapB.get(m.key);
        const row = [
          groupTitle,
          m.label,
          m.unit ?? "",
          cellText(a, m.decimals),
          cellText(b, m.decimals),
          diffText(a, b, m.decimals),
        ];
        if (showPR) row.push(prMap?.has(m.key) ? String(prMap.get(m.key)) : "—");
        rows.push(row);
      });
    };

    rows.push(headerRow);

    if (comparisonType === "投球") {
      pushTable(`球種數據（${pitchType}）`, getPitchMetrics(), pitchValuesA, pitchValuesB);
      pushTable(`揮臂數據（${pitchType}）`, getArmMetrics(), pitchValuesA, pitchValuesB);
    } else {
      getMetricGroupsByComparisonType(comparisonType).forEach((g) => {
        pushTable(g.title, g.metrics, valuesA, valuesB);
      });
    }
    return rows;
  };

  /** 把單一 cell 依 CSV 規則轉義（包含逗號/引號/換行需用引號包，內部 " 變 ""） */
  const csvEscape = (s: string): string => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const todayStamp = (): string => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };

  /** 產生安全的檔名片段（移除 / \ : * ? " < > | 與空白） */
  const sanitizeForFilename = (s: string): string =>
    s.replace(/[/\\:*?"<>|\s]+/g, "_");

  const handleExportCsv = () => {
    const rows = buildCsvRows();
    // BOM 讓 Excel 能正確識別 UTF-8
    const csv = "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const filename = `basepara-comparison-${sanitizeForFilename(labelA)}-vs-${sanitizeForFilename(labelB)}-${todayStamp()}.csv`;
    downloadFile(csv, filename, "text/csv;charset=utf-8");
  };

  /** 用 window.print() 觸發列印對話框（純前端，無額外 deps） */
  const handleExportPdf = () => {
    window.print();
  };

  return (
    <AppLayout title="層級比較">
      <div className="space-y-6">
        {/* ── 資料來源說明（一行） ── */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            成績比較資料僅納入經授權的內部上傳來源（依「角色權限管理 ‧ 納入層級比較」設定）
          </span>
        </div>

        {/* ── 選擇面板 ── */}
        <Card className="print:hidden">
          <CardContent className="pt-6 space-y-6">
            {/* 運動類別 — 影響層級可選清單（棒球 9 種 / 壘球 2 種） */}
            <div className="w-40">
              <FormSelect
                label="運動類別"
                value={sport}
                onValueChange={handleSportChange}
                options={sportOptions}
              />
            </div>

            {/* A vs B 選擇器 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TargetSelector
                side="A"
                sport={sport}
                target={targetA}
                onChange={(t) => { setTargetA(t); setShowResults(false); }}
              />
              <TargetSelector
                side="B"
                sport={sport}
                target={targetB}
                onChange={(t) => { setTargetB(t); setShowResults(false); }}
              />
            </div>

            {/* 比較類型 + 條件 + 按鈕 */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <FormSelect
                  label="比較類型"
                  value={comparisonType}
                  onValueChange={handleTypeChange}
                  options={comparisonTypeOptions}
                />
              </div>

              {comparisonType === "投球" && (
                <div className="w-36">
                  <FormSelect
                    label="球種"
                    value={pitchType}
                    onValueChange={(v) => { setPitchType(v); setShowResults(false); }}
                    options={pitchTypeOptions}
                  />
                </div>
              )}

              {comparisonType === "打擊" && (
                <div className="w-36">
                  <FormSelect
                    label="測驗情境"
                    value={_testMethod}
                    onValueChange={(v) => { setTestMethod(v); setShowResults(false); }}
                    options={testMethodOptions}
                  />
                </div>
              )}

              <Button onClick={handleCompare} disabled={!canCompare} className="h-10">
                <Search className="w-4 h-4 mr-2" />
                比較
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 匯出按鈕（結果出現時才顯示） ── */}
        {showResults && isReady && (
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileDown className="w-4 h-4 mr-2" />
              下載 CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Printer className="w-4 h-4 mr-2" />
              匯出 PDF
            </Button>
          </div>
        )}

        {/* ── 結果表格（列印區塊） ── */}
        <div id="comparison-printable">
          {showResults && isReady && (
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">層級比較報告</h2>
              <p className="text-sm text-muted-foreground">
                {labelA} vs {labelB}（{comparisonType}
                {comparisonType === "投球" ? `・${pitchType}` : ""}）
              </p>
            </div>
          )}

          {showResults && isReady && comparisonType !== "投球" && (
            <>
              {getMetricGroupsByComparisonType(comparisonType).map((group) => (
                <ComparisonTable
                  key={group.title}
                  title={group.title}
                  metrics={group.metrics}
                  valuesA={valuesA}
                  valuesB={valuesB}
                  labelA={labelA}
                  labelB={labelB}
                  showPR={showPR}
                  prMap={prMap}
                />
              ))}
            </>
          )}

          {showResults && isReady && comparisonType === "投球" && (
            <>
              <ComparisonPitchTable
                title="球種數據"
                metrics={getPitchMetrics()}
                valuesA={pitchValuesA}
                valuesB={pitchValuesB}
                labelA={labelA}
                labelB={labelB}
                pitchType={pitchType}
                showPR={showPR}
                prMap={prMap}
              />
              <ComparisonPitchTable
                title="揮臂數據"
                metrics={getArmMetrics()}
                valuesA={pitchValuesA}
                valuesB={pitchValuesB}
                labelA={labelA}
                labelB={labelB}
                pitchType={pitchType}
                showPR={showPR}
                prMap={prMap}
              />
            </>
          )}
        </div>

        {/* 空狀態 */}
        {!showResults && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg">選擇兩個比較對象後按「比較」</p>
            <p className="text-sm mt-1">支援個人、學校、層級、縣市之間的交叉比較</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Comparison;
