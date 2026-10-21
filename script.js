/* ==========================================================================
 * PDF.js 解析引擎 Worker 配置
 * ========================================================================== */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* ==========================================================================
 * 伺服器端轉發端點（透過 Netlify _redirects 隱藏真正的 Google 網址）
 * ========================================================================== */
const AUTH_SERVER_URL = "/api/auth";

let approvedEmail = localStorage.getItem("APPROVED_USER_EMAIL") || "";
let userApiKey = localStorage.getItem("GEMINI_KEY") || "";
let currentProblem = "";
let deferredPrompt = null;

window.onload = async () => {
  updateKeyUI();
  if (approvedEmail) {
    document.getElementById("gateModal").classList.add("hidden");
    if (!userApiKey) openKeyModal();
  } else {
    document.getElementById("gateModal").classList.remove("hidden");
  }
  setupDragAndDrop();
  setupClipboardPaste();
  setupPWAInstall();
};

/* ==========================================================================
 * PWA 安裝支援
 * ========================================================================== */
function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  } else {
    alert("【安裝為 App 方式】\n1. 電腦 Chrome：點擊網址列右側的「安裝」圖示，或選單『...』➔『投放、儲存及分享』➔『建立捷徑（勾選在視窗中開啟）』。\n2. 手機 Safari：點擊底部『分享』➔『加入主畫面』。");
  }
}

/* ==========================================================================
 * 金鑰狀態更新與管理
 * ========================================================================== */
function updateKeyUI() {
  const badge = document.getElementById("keyStatusBadge");
  if (userApiKey) {
    badge.className = "flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-mono font-medium";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>金鑰已配置 (${userApiKey.substring(0, 6)}...)</span>`;
    document.getElementById("keyCancelBtn").classList.remove("hidden");
  } else {
    badge.className = "flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-mono font-medium";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>未配置金鑰</span>`;
    document.getElementById("keyCancelBtn").classList.add("hidden");
  }
}

function openKeyModal() {
  document.getElementById("modalKeyInput").value = userApiKey;
  document.getElementById("keySetupModal").classList.remove("hidden");
}

function closeKeyModal() {
  if (userApiKey) document.getElementById("keySetupModal").classList.add("hidden");
}

function saveModalKey() {
  const val = document.getElementById("modalKeyInput").value.trim();
  if (!val) return alert("請輸入有效的 Gemini API Key！");
  userApiKey = val;
  localStorage.setItem("GEMINI_KEY", val);
  updateKeyUI();
  document.getElementById("keySetupModal").classList.add("hidden");
  alert("金鑰已成功永久儲存在此瀏覽器！");
}

/* ==========================================================================
 * 門禁系統邏輯
 * ========================================================================== */
async function submitAccessRequest() {
  const name = document.getElementById("reqName").value.trim();
  const email = document.getElementById("reqEmail").value.trim();
  const msg = document.getElementById("gateMsg");
  const btn = document.getElementById("sendReqBtn");

  if (!name || !email || !email.includes("@")) {
    alert("請填寫正確的姓名與 Email！");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> 寄送申請信給管理員中...`;

  try {
    const url = `${AUTH_SERVER_URL}?action=request&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
    await fetch(url, { mode: 'no-cors' });

    msg.className = "mt-3 text-xs p-3 bg-indigo-50 text-indigo-700 rounded-xl leading-relaxed text-left block";
    msg.innerHTML = `✅ <b>申請已成功寄至管理員 Gmail！</b><br>請聯繫管理員批准信件，核准後點擊下方按鈕即可開通。`;
    localStorage.setItem("PENDING_USER_EMAIL", email);
  } catch (err) {
    msg.className = "mt-3 text-xs text-rose-500 block";
    msg.textContent = "發送申請失敗，請檢查網路連線。";
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane text-xs"></i> <span>發送授權申請至管理員 Gmail</span>`;
  }
}

async function checkMyApprovalStatus() {
  const email = document.getElementById("reqEmail").value.trim() || localStorage.getItem("PENDING_USER_EMAIL");
  const msg = document.getElementById("gateMsg");

  if (!email) {
    alert("請在上方輸入您申請時填寫的 Email！");
    return;
  }

  msg.className = "mt-3 text-xs text-slate-500 block";
  msg.textContent = "正在向 Google 試算表確認授權狀態...";

  try {
    const url = `${AUTH_SERVER_URL}?action=check&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.approved) {
      localStorage.setItem("APPROVED_USER_EMAIL", email);
      document.getElementById("gateModal").classList.add("hidden");
      alert("🎉 恭喜！管理員已批准授權，現在請輸入您的 Gemini API Key 開始使用。");
      if (!userApiKey) openKeyModal();
    } else {
      msg.className = "mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl block";
      msg.textContent = "⚠️ 管理員尚未在 Gmail 點擊批准，請稍後再試！";
    }
  } catch (err) {
    alert("檢查狀態失敗：" + err.message);
  }
}

/* ==========================================================================
 * 檔案讀取核心
 * ========================================================================== */
function setFileStatus(show, text = "") {
  const el = document.getElementById("fileStatus");
  const t = document.getElementById("fileStatusText");
  if (show) { t.textContent = text; el.classList.remove("hidden"); }
  else el.classList.add("hidden");
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

async function processFile(file) {
  setFileStatus(true, `正在解析檔案：${file.name}...`);
  try {
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += `--- Page ${i} ---\n` + textContent.items.map(item => item.str).join(" ") + "\n\n";
      }
      document.getElementById("rawInput").value = fullText.trim();
      setFileStatus(false);
      processContent();
    } else if (file.type.startsWith("image/")) {
      setFileStatus(true, "AI 正在辨識圖片中的文字與內容...");
      const base64 = await fileToBase64(file);
      const recognizedText = await callGeminiWithImage("請精確讀取並提取這張圖片中的所有文字、題目與算式，不要翻譯或解答，直接輸出識別出的原始文字內容：", base64, file.type);
      document.getElementById("rawInput").value = recognizedText.trim();
      setFileStatus(false);
      processContent();
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("rawInput").value = event.target.result;
        setFileStatus(false);
        processContent();
      };
      reader.readAsText(file);
    }
  } catch (err) {
    alert("讀取檔案失敗：" + err.message);
    setFileStatus(false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function setupDragAndDrop() {
  const dropZone = document.getElementById("dropZone");
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add("border-indigo-600", "bg-indigo-100/50"); }, false);
  });
  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove("border-indigo-600", "bg-indigo-100/50"); }, false);
  });
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) processFile(file);
  }, false);
}

function setupClipboardPaste() {
  window.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        processFile(item.getAsFile());
        break;
      }
    }
  });
}

/* ==========================================================================
 * Gemini 3.8 Flash 調用核心（官方標準指定，含 503 自動重試）
 * ========================================================================== */
async function callGemini(promptText, systemPrompt = "", retryCount = 0) {
  if (!userApiKey) { openKeyModal(); throw new Error("請先設定 Gemini API Key"); }
  
  const model = "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 503 && retryCount < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return callGemini(promptText, systemPrompt, retryCount + 1);
    }
    throw new Error(errData.error?.message || "API 回應異常");
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callGeminiWithImage(promptText, base64Data, mimeType, retryCount = 0) {
  if (!userApiKey) { openKeyModal(); throw new Error("請先設定 Gemini API Key"); }
  
  const model = "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }]
    })
  });

  if (!res.ok) {
    if (res.status === 503 && retryCount < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return callGeminiWithImage(promptText, base64Data, mimeType, retryCount + 1);
    }
    throw new Error("圖片辨識失敗");
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

/* ==========================================================================
 * 中英雙語對照核心（強制繁體中文、嚴禁簡體）
 * ========================================================================== */
async function processContent() {
  const text = document.getElementById("rawInput").value.trim();
  if (!text) return;
  currentProblem = text;
  const btn = document.getElementById("processBtn");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> 解析中...`;

  const prompt = `請將以下文字依照語意邏輯拆解成合適句段，嚴格翻譯成台灣常用、流暢道地的正體繁體中文（絕對不可出現簡體字或中國大陸用語）。請只回傳合法 JSON 陣列格式，不要額外包裹 markdown，格式範例：[{"en":"Sentence here","zh":"繁體中文翻譯"}]\n內容如下：\n${text}`;

  try {
    const rawRes = await callGemini(prompt, "你是一位專業雙語翻譯助手，請全程嚴格使用台灣正體繁體中文回傳，嚴格禁止輸出任何簡體字與大陸用語，並以合法 JSON 格式回傳。");
    const cleanJson = rawRes.replace(/```json/g, "").replace(/```/g, "").trim();
    renderPairs(JSON.parse(cleanJson));
  } catch (e) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const fbData = await res.json();
    renderPairs(fbData[0].map(item => ({ en: item[1] || "", zh: item[0] || "" })));
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left"></i> <span>生成雙語句段對照</span>`;
  }
}

function renderPairs(pairs) {
  const container = document.getElementById("pairsContainer");
  container.innerHTML = "";
  document.getElementById("pairBadge").textContent = `${pairs.length} 個句段`;

  pairs.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "p-3.5 bg-slate-50 border border-slate-200 rounded-xl";
    div.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="pr-2 border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0">
          <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">原文 #${idx + 1}</span>
          <p class="text-xs text-slate-800 font-medium mt-1 leading-relaxed">${escapeHtml(p.en)}</p>
        </div>
        <div class="pl-0 md:pl-2">
          <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">中文對照</span>
          <p class="text-xs text-slate-700 mt-1 leading-relaxed">${escapeHtml(p.zh)}</p>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

/* ==========================================================================
 * 全能 AI 助理對話核心（純繁體中文、通用問答）
 * ========================================================================== */
const SYSTEM_PROMPT = "你是一位博學、條理分明、親切的全能 AI 智慧助理。請全程嚴格使用台灣正體繁體中文回答，嚴禁出現任何簡體字與中國大陸慣用語。若內容涉及數學或科學公式，請使用 LaTeX 格式（行內使用 $...$，獨立公式使用 $$...$$）；若涉及程式碼請使用 Markdown 代碼塊。";

async function askAssistant(mode) {
  const content = currentProblem || document.getElementById("rawInput").value.trim();
  if (!content) return alert("請先在左側輸入或上傳內容，再點擊快速分析按鈕！若想直接發問，可直接在下方輸入框提問。");

  const prompt = mode === 'detail' 
    ? `參考內容如下：\n"""${content}"""\n\n請對以上內容進行詳細分析、解讀與解答，條理清晰地提供深入說明與結論。`
    : `參考內容如下：\n"""${content}"""\n\n請提取上述內容的核心重點、架構提綱與關鍵觀念摘要。`;

  appendMessage("user", mode === 'detail' ? "請對左側內容進行詳細分析解答。" : "請幫我整理左側內容的核心重點摘要。");
  const loadId = appendLoading();

  try {
    const answer = await callGemini(prompt, SYSTEM_PROMPT);
    removeLoading(loadId);
    appendMessage("ai", answer);
  } catch (err) {
    removeLoading(loadId);
    appendMessage("ai", "發生錯誤：" + err.message);
  }
}

async function sendFollowUp() {
  const input = document.getElementById("followUpInput");
  const q = input.value.trim();
  if (!q) return;
  const content = currentProblem || document.getElementById("rawInput").value.trim();
  input.value = "";
  appendMessage("user", q);
  const loadId = appendLoading();

  const prompt = content 
    ? `【參考背景資料】：\n"""${content}"""\n\n【使用者提問】：\n${q}`
    : q;

  try {
    const answer = await callGemini(prompt, SYSTEM_PROMPT);
    removeLoading(loadId);
    appendMessage("ai", answer);
  } catch (err) {
    removeLoading(loadId);
    appendMessage("ai", "回覆失敗：" + err.message);
  }
}

function appendMessage(sender, text) {
  const container = document.getElementById("tutorMessages");
  const div = document.createElement("div");
  if (sender === "user") {
    div.className = "flex justify-end";
    div.innerHTML = `<div class="bg-indigo-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-none text-xs max-w-[85%]">${escapeHtml(text)}</div>`;
  } else {
    div.className = "p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs leading-relaxed";
    div.innerHTML = `<div class="font-bold text-indigo-700 mb-1.5"><i class="fa-solid fa-robot"></i> AI 回覆</div><div class="prose max-w-none">${marked.parse(text)}</div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  if (window.renderMathInElement) {
    renderMathInElement(div, {
      delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
      throwOnError: false
    });
  }
}

function appendLoading() {
  const container = document.getElementById("tutorMessages");
  const id = "load-" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.className = "p-3 bg-indigo-50 text-indigo-600 text-xs rounded-xl flex items-center gap-2";
  div.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> AI 正在思考回覆中...`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }

function clearLeft() {
  document.getElementById("rawInput").value = "";
  document.getElementById("pairsContainer").innerHTML = `<div class="text-center py-16 text-slate-400 text-sm">上傳檔案或貼入內容後，雙語對照將呈現在此</div>`;
  document.getElementById("pairBadge").textContent = "0 個句段";
  currentProblem = "";
}

function escapeHtml(s) { return s.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t)); }