import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import TargetSelector, { type ComparisonTarget } from "@/components/comparison/TargetSelector";
import ComparisonTable from "@/components/comparison/ComparisonTable";
import ComparisonPitchTable from "@/components/comparison/ComparisonPitchTable";
import { useComparisonData } from "@/hooks/useComparisonData";
import {
  getMetricGroupsByComparisonType,
  getPitchMetrics,
  getArmMetrics,
  type ComparisonType,
} from "@/data/metricDefinitions";
import { allPitchTypes } from "@/components/reports/PitchTypeSection";

const comparisonTypeOptions = [
  { value: "打擊", label: "打擊" },
  { value: "投球", label: "投球" },
  { value: "身體素質", label: "身體素質" },
];

const testMethodOptions = [
  { value: "實戰", label: "實戰" },
  { value: "發球機", label: "發球機" },
];

const pitchTypeOptions = allPitchTypes.map((pt) => ({ value: pt, label: pt }));

const Comparison = () => {
  const [targetA, setTargetA] = useState<ComparisonTarget | null>(null);
  const [targetB, setTargetB] = useState<ComparisonTarget | null>(null);
  const [comparisonType, setComparisonType] = useState<ComparisonType>("打擊");
  const [pitchType, setPitchType] = useState("四縫線");
  const [_testMethod, setTestMethod] = useState("實戰");
  const [showResults, setShowResults] = useState(false);

  const { valuesA, valuesB, pitchValuesA, pitchValuesB, isReady } = useComparisonData({
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

  // 把 secondary filter（縣市/層級交叉）加入顯示 label：例「高中甲組・新北市」
  const formatTargetLabel = (t: ComparisonTarget | null, fallback: string) => {
    if (!t?.label) return fallback;
    if (t.secondary?.id) return `${t.label}・${t.secondary.id}`;
    return t.label;
  };
  const labelA = formatTargetLabel(targetA, "A");
  const labelB = formatTargetLabel(targetB, "B");

  return (
    <AppLayout title="層級比較">
      <div className="space-y-6">
        {/* ── 資料來源說明（一行） ── */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            成績比較資料僅納入經授權的內部上傳來源（依「角色權限管理 ‧ 納入層級比較」設定）
          </span>
        </div>

        {/* ── 選擇面板 ── */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* A vs B 選擇器 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TargetSelector
                side="A"
                target={targetA}
                onChange={(t) => { setTargetA(t); setShowResults(false); }}
              />
              <TargetSelector
                side="B"
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

        {/* ── 結果表格 ── */}
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
            />
            <ComparisonPitchTable
              title="揮臂數據"
              metrics={getArmMetrics()}
              valuesA={pitchValuesA}
              valuesB={pitchValuesB}
              labelA={labelA}
              labelB={labelB}
              pitchType={pitchType}
            />
          </>
        )}

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
