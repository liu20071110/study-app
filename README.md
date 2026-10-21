# 學習輔助工具 (Study App)

<p align="center">
  <img src="icon.png" alt="App Icon" width="96" height="96" style="border-radius: 20px;">
</p>

<p align="center">
  <b>整合文件辨識、中英雙語對照與 Google Gemini 3.8 Flash 的全能 AI 學習輔助工作台</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-3.8_Flash-4f46e5?style=flat-square&logo=google" alt="Gemini 3.8 Flash">
  <img src="https://img.shields.io/badge/TailwindCSS-CDN-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PDF.js-3.11-e11d48?style=flat-square" alt="PDF.js">
  <img src="https://img.shields.io/badge/KaTeX-Math_Render-10b981?style=flat-square" alt="KaTeX">
  <img src="https://img.shields.io/badge/PWA-Supported-f59e0b?style=flat-square" alt="PWA Ready">
</p>

---

## 📖 專案簡介

**學習輔助工作台** 專為學生、研究者及自主學習者量身打造，將繁瑣的跨語系文獻閱讀與課業解題流程極簡化。透過現代化輕量網頁技術，結合 **Google Gemini 3.8 Flash** 強大語意分析能力，只需拖入 PDF、截圖或貼上文章，即可一秒生成精確的中英句段對照，並提供深入的解題教學與重點摘要。

---

## ✨ 核心特色

### 1. 📄 多格式文檔與圖片 OCR 辨識
- **PDF 文件解析**：內建 PDF.js 引擎，支援一鍵讀取多頁 PDF 內容。
- **AI 圖片與截圖辨識**：支援直接貼入截圖（`Ctrl + V`）或拖放圖片，由 Gemini 視覺模型精準辨識圖片中的文字、題目與算式。
- **純文字支援**：支援 `.txt`、`.md` 檔案上傳或直接文字貼入。

### 2. 🌐 智慧中英雙語對照
- 依照語意邏輯拆分句段，呈現左右分欄卡片式對照。
- **在地化正體繁體**：嚴格鎖定台灣常用繁體中文，避免生硬簡體或大陸用語。
- **智慧容錯備援**：內建自動重試機制與備用翻譯接口，確保體驗順暢不中斷。

### 3. 🤖 全能 AI 智慧學習助理 (Gemini 3.8 Flash)
- **詳細分析解答**：針對當前讀取的文件或題目，進行條理分明、層層剖析的深度解題。
- **核心重點摘要**：提煉文章大綱、核心關鍵詞與學習提綱。
- **自由追問與互動**：支援各學科課業解題、程式碼除錯、觀念推導與自由對話。
- **專業排版渲染**：支援完整 Markdown 樣式語法，並深度整合 **KaTeX** 數學公式渲染（行內 `$...$` 與區塊 `$$...$$`）。

### 4. 📱 PWA（漸進式 Web 應用程式）支援
- 支援安裝為桌面／手機獨立應用程式（Standalone 視窗），沉浸式學習不分心。
- 支援 Chrome、Edge、Safari 等主流瀏覽器「加入主畫面 / 安裝為 App」。

### 5. 🔐 隱私安全與個人金鑰
- **本機密鑰儲存**：Gemini API Key 僅儲存於使用者瀏覽器的 `localStorage` 中，不經過第三方伺服器儲存。
- **內建門禁管理機制**：支援管理員 Email 授權審核流程，保護個人私有工作台。

---

## 🚀 快速開始

### 本地直接執行

本專案採用無編譯純前端架構（Vanilla HTML/JS/CSS），無需複雜的 `npm install`：

1. **Clone 專案**
   ```bash
   git clone https://github.com/liu20071110/study-app.git
   cd study-app
   ```

2. **啟動本機伺服器**
   可使用 VS Code 的 **Live Server** 外掛，或使用 Python 快速架設本地 HTTP 伺服器：
   ```bash
   # Python 3
   python -m http.server 3000
   ```
   瀏覽器造訪：`http://localhost:3000`

3. **取得並設定 Gemini API Key**
   - 前往 [Google AI Studio](https://aistudio.google.com/apikey) 免費申請 API 金鑰。
   - 首次進入網站時，在設定視窗輸入金鑰（以 `AIzaSy...` 開頭）並儲存即可。

---

## 📂 專案結構

```plaintext
study-app/
├── index.html       # 應用程式主介面（包含響應式版面、模態視窗與 CDN 配置）
├── script.js        # 核心業務邏輯（PDF/圖片處理、Gemini API 串接、UI 事件）
├── style.css        # 自訂輔助樣式與排版規則
├── icon.png         # 應用程式高解析度圖示 (PWA / Favicon)
└── README.md        # 專案說明文件
```

---

## 🛠️ 技術棧

- **核心架構**：原生 HTML5 / Vanilla JavaScript (ES6+)
- **外觀樣式**：[Tailwind CSS (CDN)](https://tailwindcss.com/) + [FontAwesome 6.4](https://fontawesome.com/)
- **AI 模型**：[Google Gemini 3.8 Flash](https://ai.google.dev/) (`gemini-3.8-flash`)
- **文件解析**：[PDF.js](https://mozilla.github.io/pdf.js/)
- **內容排版**：[marked.js](https://marked.js.org/) (Markdown) + [KaTeX](https://katex.org/) (LaTeX 數學公式)

---

## ⚙️ 部署說明

本專案可快速部署於多種靜態托管平台：

- **Netlify / Vercel**：直接連結 GitHub Repository 即可一鍵部署。若有審核後端需求，可配合 `_redirects` 轉發至 Google Apps Script 門禁端點。
- **GitHub Pages**：至 GitHub Repository 的 `Settings > Pages`，將來源設定為 `main` 分支即可免費發布。

---

## 📄 授權條款

本專案採 [MIT License](LICENSE) 授權釋出，歡迎一起開發討論!
