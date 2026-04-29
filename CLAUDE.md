# BasePara — 棒球訓練管理平台

## 專案資訊
- **Repo:** https://github.com/torch-tzan/basepara
- **主分支:** `main`
- **技術棧:** Vite + React + TypeScript + Tailwind + shadcn/ui + Recharts + Supabase
- **開發指令:** `npm run dev`（port 8080，佔用時遞增）

## Zeabur 部署（固定唯一目標）

**以後所有部署都推到這個專案／服務，不要建新的。**

- **Project:** `basepara` — ID `69ccff5d93a28c33a52a3381`
- **Service:** `basepara-dev` — ID `69ccffb193a28c33a52a339c`
- **Environment ID:** `69ccff5d9c2b3309e23e21dd`
- **線上網址:** https://basepara.zeabur.app

### 部署指令（非互動）
```bash
zeabur deploy \
  --project-id 69ccff5d93a28c33a52a3381 \
  --service-id 69ccffb193a28c33a52a339c \
  -i=false
```

### 標準流程
1. `git add` + `git commit` + `git push origin main`（先進 GitHub）
2. 執行上面的 `zeabur deploy` 指令將本地 build 推到 Zeabur
3. 開 https://basepara.zeabur.app 驗證

## 禁止事項
- 不要在 Zeabur 建立新的 basepara 專案／服務
- 不要改 `RootDirectory`、`Template`（目前為 `PREBUILT_V2`）
- 不要把 `.envrc`、`.claude/`、`.env` 進 commit
