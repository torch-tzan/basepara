# BasePara 開發 SOP

> 標準開發流程，每次開發新版本都遵循此文件。

## 完整流程

### Step 1：開新分支
```bash
git checkout main
git pull origin main
git checkout -b <分支名>
```

**分支命名規則**：
- `feature/xxx` — 新功能（例：`feature/report-pdf-export`）
- `fix/xxx` — Bug 修復（例：`fix/student-name-display`）
- `refactor/xxx` — 重構
- `MMDD` — 日期型分支（例：`0408`、`0415`）

### Step 2：開發 + 本地測試
```bash
npm run dev          # 本地預覽 http://localhost:5173
npx tsc --noEmit     # TypeScript 零錯誤檢查
```

### Step 3：Commit
```bash
git add <指定檔案>    # 不要用 git add . （避免誤加 .env）
git commit -m "feat: 新增 XXX 功能"
```

**Commit 訊息規範**：
| Prefix | 用途 |
|--------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修復 |
| `refactor:` | 重構 |
| `style:` | 樣式 / 排版 |
| `docs:` | 文件 |
| `chore:` | 雜項（依賴更新等） |

### Step 4：Push + 開 PR
```bash
git push -u origin <分支名>
gh pr create --base main --head <分支名> --title "..." --body "..."
```

### Step 5：Merge + 打 Tag
```bash
gh pr merge <PR編號> --merge
git checkout main
git pull
git tag -a v1.x-client-demo -m "版本說明"
git push origin v1.x-client-demo
```

### Step 6：Zeabur 自動部署
- Zeabur 偵測到 main 有新 commit → 自動 build & deploy
- 約 1-3 分鐘後重新整理線上網站即可看到新版

---

## 版本號規範

| 改動規模 | Tag 命名 | 範例 |
|---------|----------|------|
| 小修 bug、文案 | `v1.0.x` | `v1.0.1-client-demo` |
| 新功能 | `v1.x` | `v1.1-client-demo` |
| 大改版 | `vx.0` | `v2.0-client-demo` |

---

## 回滾方式

### 方法 A：Zeabur Dashboard 一鍵 Rollback（最快）
1. 進 Zeabur → service → Deployments
2. 找到要回滾的舊版 deployment
3. 點 Rollback
4. 30 秒內完成

### 方法 B：Git Revert（永久回退）
```bash
git checkout main
git revert <要回退的 commit hash>
git push origin main
# Zeabur 自動重新部署
```

### 方法 C：Checkout 特定 Tag
```bash
git checkout v1.0-client-demo  # 切到該版本
```

---

## 黃金守則

1. ✅ **永遠從 main 開新分支** — 不要在 main 上直接改
2. ✅ **每次推給客戶前打 tag** — 之後才能精準回到那一版
3. ✅ **Commit 訊息寫清楚** — 未來看 git log 才知道改了什麼
4. ✅ **PR 標題簡短，內容寫詳細** — Summary + Test plan
5. ❌ **不要 force push main** — 會洗掉歷史
6. ❌ **不要用 `git add .`** — 容易誤加敏感檔案
7. ❌ **不要 skip git hooks**（`--no-verify`）

---

## 與 Claude 協作的快速指令

| 你說 | Claude 會做 |
|------|------------|
| 「開發 XXX」 | 自動開新分支 → 開發 → commit |
| 「commit 並開 PR」 | Step 3-4 |
| 「直接推版」 | Step 5（merge + tag + push）|
| 「回到 v1.0」 | Git revert 或 Zeabur Rollback 教學 |
| 「修 XXX bug」 | 開 `fix/xxx` 分支 |

---

## 已發布版本記錄

| Tag | 日期 | 內容 |
|-----|------|------|
| v1.0-client-demo | 2026-04-08 | 檢測報告系統三輪重構（對齊 0327 會議規格） |
