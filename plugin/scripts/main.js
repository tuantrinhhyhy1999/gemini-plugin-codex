const { app, core } = require("photoshop");
const { localFileSystem, formats } = require("uxp").storage;
const batchPlay = require("photoshop").action.batchPlay;
const clipboard = require("clipboard");

const MAX_REFERENCES = 3;
const STORAGE_KEYS = {
  references: "gemini.references",
  prompt: "gemini.prompt",
  apiKey: "gemini.apiKey",
  locale: "gemini.locale",
};

const STRINGS = {
  vi: {
    title: "Gemini Image Studio",
    localeLabel: "Ngôn ngữ",
    apiKeyLabel: "Gemini API Key",
    saveKey: "Lưu",
    usage: (value) => `Sử dụng: ${value}`,
    dropZone: "Kéo thả ảnh vào đây",
    exportDocument: "Toàn bộ Canvas",
    exportLayer: "Layer hiện tại",
    quickLayer: "Quick Layer",
    promptLabel: "Prompt",
    imageCount: "Số lượng ảnh",
    generate: "Generate",
    quickPresets: "Quick Presets",
    remove: "Xoá",
    copy: "Copy",
    place: "Chèn vào PS",
    save: "Lưu tệp",
    usageError: "Không thể tải hạn mức",
    loading: "Đang tạo...",
    successCopy: "Đã copy ảnh vào clipboard",
    successPrompt: "Đã áp dụng preset",
    errorGeneral: "Có lỗi xảy ra. Vui lòng thử lại",
  },
  en: {
    title: "Gemini Image Studio",
    localeLabel: "Language",
    apiKeyLabel: "Gemini API Key",
    saveKey: "Save",
    usage: (value) => `Usage: ${value}`,
    dropZone: "Drop images here",
    exportDocument: "Whole Canvas",
    exportLayer: "Active Layer",
    quickLayer: "Quick Layer",
    promptLabel: "Prompt",
    imageCount: "Image count",
    generate: "Generate",
    quickPresets: "Quick Presets",
    remove: "Remove",
    copy: "Copy",
    place: "Place in PS",
    save: "Save file",
    usageError: "Unable to fetch usage",
    loading: "Generating...",
    successCopy: "Image copied to clipboard",
    successPrompt: "Preset applied",
    errorGeneral: "Something went wrong. Please retry",
  },
  zh: {
    title: "Gemini 图像工作室",
    localeLabel: "语言",
    apiKeyLabel: "Gemini API 密钥",
    saveKey: "保存",
    usage: (value) => `使用量: ${value}`,
    dropZone: "拖放图片到此处",
    exportDocument: "整个画布",
    exportLayer: "当前图层",
    quickLayer: "快速图层",
    promptLabel: "提示词",
    imageCount: "生成数量",
    generate: "生成",
    quickPresets: "快速预设",
    remove: "删除",
    copy: "复制",
    place: "导入到 PS",
    save: "保存文件",
    usageError: "无法读取用量",
    loading: "生成中...",
    successCopy: "已复制到剪贴板",
    successPrompt: "已应用预设",
    errorGeneral: "发生错误，请重试",
  },
};

const PRESET_CATEGORIES = [
  {
    id: "portrait",
    icon: "🧑",
    name: {
      vi: "Chân dung",
      en: "Portrait",
      zh: "人像",
    },
    items: [
      {
        id: "portrait-natural",
        prompt: "Ultra-realistic portrait, soft natural light, 85mm lens, shallow depth of field",
        count: 2,
      },
      {
        id: "portrait-studio",
        prompt: "Studio portrait with dramatic lighting, high contrast, Rembrandt lighting",
        count: 1,
      },
    ],
  },
  {
    id: "landscape",
    icon: "🏞️",
    name: {
      vi: "Phong cảnh",
      en: "Landscape",
      zh: "风景",
    },
    items: [
      {
        id: "landscape-golden",
        prompt: "Golden hour landscape, wide angle, vivid colors, atmospheric perspective",
        count: 2,
      },
      {
        id: "landscape-night",
        prompt: "Night sky over mountains, long exposure, Milky Way, crisp stars",
        count: 1,
      },
    ],
  },
  {
    id: "product",
    icon: "📦",
    name: {
      vi: "Sản phẩm",
      en: "Product",
      zh: "产品",
    },
    items: [
      {
        id: "product-hero",
        prompt: "Product hero shot on reflective surface, cinematic lighting, high contrast",
        count: 4,
      },
      {
        id: "product-minimal",
        prompt: "Minimal product photo, soft diffused light, monochrome background",
        count: 2,
      },
    ],
  },
  {
    id: "art",
    icon: "🎨",
    name: {
      vi: "Nghệ thuật",
      en: "Art",
      zh: "艺术",
    },
    items: [
      {
        id: "art-watercolor",
        prompt: "Watercolor painting style, loose brush strokes, pastel palette",
        count: 3,
      },
      {
        id: "art-neon",
        prompt: "Cyberpunk neon illustration, high contrast, dynamic lighting",
        count: 2,
      },
    ],
  },
  {
    id: "architecture",
    icon: "🏙️",
    name: {
      vi: "Kiến trúc",
      en: "Architecture",
      zh: "建筑",
    },
    items: [
      {
        id: "architecture-modern",
        prompt: "Modern architecture exterior, wide shot, clean lines, evening light",
        count: 2,
      },
      {
        id: "architecture-interior",
        prompt: "Interior architecture, natural light, warm tones, wide dynamic range",
        count: 1,
      },
    ],
  },
];

const QUICK_PRESETS = [
  {
    id: "portrait-beauty",
    name: {
      vi: "Chân dung beauty",
      en: "Beauty portrait",
      zh: "美妆人像",
    },
    prompt: "Beauty portrait close-up, clean retouch, glossy skin, beauty dish lighting",
    count: 2,
  },
  {
    id: "landscape-sunset",
    name: {
      vi: "Hoàng hôn",
      en: "Sunset vista",
      zh: "日落景观",
    },
    prompt: "Panoramic sunset landscape, rich gradient sky, foreground silhouettes",
    count: 1,
  },
  {
    id: "product-soft",
    name: {
      vi: "Sản phẩm nhẹ",
      en: "Soft light product",
      zh: "柔光产品",
    },
    prompt: "Product shot with soft gradient background, volumetric lighting, 3d render",
    count: 3,
  },
  {
    id: "art-impression",
    name: {
      vi: "Tranh ấn tượng",
      en: "Impressionist painting",
      zh: "印象派",
    },
    prompt: "Impressionist oil painting, thick brush strokes, vibrant colors",
    count: 2,
  },
];

let currentLocale = STRINGS[localStorage.getItem(STORAGE_KEYS.locale)] ? localStorage.getItem(STORAGE_KEYS.locale) : "vi";
let references = [];
let results = [];

function t(key, ...args) {
  const entry = STRINGS[currentLocale][key];
  if (typeof entry === "function") {
    return entry(...args);
  }
  if (entry === undefined) {
    const fallback = STRINGS.en[key];
    return typeof fallback === "function" ? fallback(...args) : fallback ?? key;
  }
  return entry;
}

function $(selector) {
  return document.querySelector(selector);
}

function initLocale() {
  const localeSelect = $("#localeSelect");
  localeSelect.value = currentLocale;
  localeSelect.addEventListener("change", () => {
    currentLocale = localeSelect.value;
    localStorage.setItem(STORAGE_KEYS.locale, currentLocale);
    applyLocale();
    notify(t("successPrompt"));
  });
}

function applyLocale() {
  $("#title").textContent = t("title");
  $("#localeLabel").textContent = t("localeLabel");
  $("#api-key-label").textContent = t("apiKeyLabel");
  $("#saveKey").textContent = t("saveKey");
  $("#dropZoneLabel").textContent = t("dropZone");
  $("#exportDocument").textContent = t("exportDocument");
  $("#exportLayer").textContent = t("exportLayer");
  $("#quickLayer").textContent = t("quickLayer");
  $("#promptLabel").textContent = t("promptLabel");
  $("#imageCountLabel").textContent = t("imageCount");
  $("#generate").textContent = t("generate");
  $("#quickPresetTitle").textContent = t("quickPresets");
  $("#tab-input").textContent = t("dropZone");
  $("#tab-prompt").textContent = t("promptLabel");
  $("#tab-presets").textContent = t("quickPresets");
  $("#tab-results").textContent = "Kết quả";
  renderPresetCategories();
  renderQuickPresets();
  renderReferences();
  renderResults();
}

function notify(message) {
  if (!message) {
    return;
  }
  document.body.dispatchEvent(
    new CustomEvent("uxp-toast", {
      detail: {
        message,
        variant: "info",
      },
      bubbles: true,
    })
  );
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function addReference(base64, source) {
  if (!base64) return;
  if (references.length >= MAX_REFERENCES) {
    references.shift();
  }
  references.push({ id: Date.now().toString(), data: base64, source });
  localStorage.setItem(STORAGE_KEYS.references, JSON.stringify(references));
  renderReferences();
}

function loadPersistedReferences() {
  const stored = localStorage.getItem(STORAGE_KEYS.references);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        references = parsed;
      }
    } catch (error) {
      console.error("Failed to parse references", error);
    }
  }
}

function renderReferences() {
  const container = $("#referenceList");
  container.innerHTML = "";
  references.forEach((ref) => {
    const card = document.createElement("div");
    card.className = "reference-card";
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${ref.data}`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.title = t("remove");
    removeBtn.addEventListener("click", () => {
      references = references.filter((item) => item.id !== ref.id);
      localStorage.setItem(STORAGE_KEYS.references, JSON.stringify(references));
      renderReferences();
    });
    card.appendChild(img);
    card.appendChild(removeBtn);
    container.appendChild(card);
  });
}

function renderPresetCategories() {
  const container = $("#presetCategories");
  container.innerHTML = "";
  PRESET_CATEGORIES.forEach((category) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preset-category";
    const title = document.createElement("h4");
    title.textContent = `${category.icon} ${category.name[currentLocale]}`;
    wrapper.appendChild(title);
    category.items.forEach((item) => {
      const preset = document.createElement("div");
      preset.className = "preset-item";
      preset.innerHTML = `<strong>${item.count}×</strong> ${item.prompt}`;
      preset.addEventListener("click", () => applyPreset(item));
      wrapper.appendChild(preset);
    });
    container.appendChild(wrapper);
  });
}

function renderQuickPresets() {
  const container = $("#quickPresets");
  container.innerHTML = "";
  QUICK_PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.className = "quick-preset-button";
    button.textContent = `${preset.name[currentLocale]}`;
    button.addEventListener("click", () => applyPreset(preset));
    container.appendChild(button);
  });
}

function applyPreset(preset) {
  $("#promptInput").value = preset.prompt;
  $("#imageCount").value = preset.count;
  localStorage.setItem(STORAGE_KEYS.prompt, preset.prompt);
  notify(t("successPrompt"));
}

async function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  $("#dropZone").classList.remove("active");
  const items = event.dataTransfer.items;
  if (!items) {
    return;
  }
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        await addReference(base64, "drop");
      }
    }
  }
}

function setupDropZone() {
  const dropZone = $("#dropZone");
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("active");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
  });
  dropZone.addEventListener("drop", handleDrop);
}

async function exportActiveDocumentBase64() {
  if (!app.activeDocument) {
    return null;
  }
  return core.executeAsModal(async () => {
    const tempFile = await localFileSystem.createTemporaryFile("gemini-canvas.png", { overwrite: true });
    await app.activeDocument.createRenditions([
      {
        path: tempFile,
        type: "png",
        scale: 1,
      },
    ]);
    const buffer = await tempFile.read({ format: formats.binary });
    await tempFile.delete();
    return arrayBufferToBase64(buffer);
  }, { commandName: "Export Canvas" });
}

async function exportActiveLayerBase64() {
  const doc = app.activeDocument;
  if (!doc || !doc.activeLayers || !doc.activeLayers.length) {
    return null;
  }
  const layer = doc.activeLayers[0];
  return core.executeAsModal(async () => {
    const tempFile = await localFileSystem.createTemporaryFile(`gemini-layer-${layer.id}.png`, { overwrite: true });
    await doc.createRenditions([
      {
        path: tempFile,
        type: "png",
        scale: 1,
        layerID: layer._id ?? layer.id,
      },
    ]);
    const buffer = await tempFile.read({ format: formats.binary });
    await tempFile.delete();
    return arrayBufferToBase64(buffer);
  }, { commandName: "Export Layer" });
}

async function quickLayerToClipboard() {
  const base64 = await exportActiveLayerBase64();
  if (!base64) {
    return;
  }
  await clipboard.copyText(base64);
  notify(t("successCopy"));
}

async function saveBase64ToFile(base64) {
  const folder = await localFileSystem.getFolder();
  if (!folder) {
    return;
  }
  const file = await folder.createFile(`gemini-result-${Date.now()}.png`, { overwrite: true });
  await file.write(base64, { format: formats.base64 });
}

async function placeBase64InDocument(base64) {
  const doc = app.activeDocument;
  if (!doc) {
    return;
  }
  await core.executeAsModal(async () => {
    const tempFile = await localFileSystem.createTemporaryFile(`gemini-place-${Date.now()}.png`, { overwrite: true });
    await tempFile.write(base64, { format: formats.base64 });
    await batchPlay(
      [
        {
          _obj: "placeEvent",
          null: {
            _path: tempFile.nativePath,
            _kind: "local",
          },
          freeTransformCenterState: {
            _enum: "quadCenterState",
            _value: "QCSAverage",
          },
          offset: {
            _obj: "offset",
            horizontal: {
              _unit: "pixelsUnit",
              _value: 0,
            },
            vertical: {
              _unit: "pixelsUnit",
              _value: 0,
            },
          },
        },
      ],
      {
        commandName: "Place Gemini Result",
        modalBehavior: "execute",
      }
    );
    await tempFile.delete();
  });
}

async function fetchGeminiUsage(apiKey) {
  if (!apiKey) {
    return;
  }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/usage?key=${apiKey}`);
    if (!response.ok) {
      throw new Error("Usage request failed");
    }
    const data = await response.json();
    const usageLabel = $("#usageLabel");
    if (data && data.totalUsage) {
      usageLabel.textContent = t("usage", `${data.totalUsage.used} / ${data.totalUsage.limit}`);
    } else {
      usageLabel.textContent = t("usage", JSON.stringify(data));
    }
  } catch (error) {
    console.error(error);
    $("#usageLabel").textContent = t("usageError");
  }
}

function buildGeminiRequest(prompt, imageBase64) {
  const parts = [];
  if (prompt) {
    parts.push({ text: prompt });
  }
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: imageBase64,
      },
    });
  }
  return {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
  };
}

async function callGemini(apiKey, payload) {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  return response.json();
}

function parseGeminiImages(data) {
  if (!data || !data.candidates) {
    return [];
  }
  const images = [];
  data.candidates.forEach((candidate) => {
    if (!candidate.content || !candidate.content.parts) return;
    candidate.content.parts.forEach((part) => {
      if (part.inline_data && part.inline_data.data) {
        images.push(part.inline_data.data);
      }
    });
  });
  return images;
}

function renderResults() {
  const container = $("#resultGrid");
  container.innerHTML = "";
  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "result-card";
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${result.data}`;
    const actions = document.createElement("div");
    actions.className = "result-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "spectrum-button spectrum-button--quiet";
    copyBtn.textContent = t("copy");
    copyBtn.addEventListener("click", async () => {
      await clipboard.copyText(result.data);
      notify(t("successCopy"));
    });

    const placeBtn = document.createElement("button");
    placeBtn.className = "spectrum-button spectrum-button--quiet";
    placeBtn.textContent = t("place");
    placeBtn.addEventListener("click", () => placeBase64InDocument(result.data));

    const saveBtn = document.createElement("button");
    saveBtn.className = "spectrum-button spectrum-button--quiet";
    saveBtn.textContent = t("save");
    saveBtn.addEventListener("click", () => saveBase64ToFile(result.data));

    actions.appendChild(copyBtn);
    actions.appendChild(placeBtn);
    actions.appendChild(saveBtn);

    card.appendChild(img);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function setGeneratingState(isGenerating) {
  const generateBtn = $("#generate");
  if (isGenerating) {
    generateBtn.disabled = true;
    generateBtn.textContent = t("loading");
  } else {
    generateBtn.disabled = false;
    generateBtn.textContent = t("generate");
  }
}

async function generateImages() {
  const apiKey = $("#apiKey").value || localStorage.getItem(STORAGE_KEYS.apiKey);
  if (!apiKey) {
    notify("Missing API key");
    return;
  }
  const prompt = $("#promptInput").value.trim();
  const imageCount = Math.min(4, Math.max(1, Number($("#imageCount").value || 1)));
  if (!prompt && references.length === 0) {
    notify("Prompt required");
    return;
  }
  setGeneratingState(true);
  try {
    const basePayloads = references.length
      ? references.map((ref) => buildGeminiRequest(prompt, ref.data))
      : [buildGeminiRequest(prompt, null)];
    const aggregatedResults = [];
    for (let i = 0; i < imageCount; i += 1) {
      const payload = basePayloads[i % basePayloads.length];
      const response = await callGemini(apiKey, payload);
      const images = parseGeminiImages(response);
      aggregatedResults.push(...images);
    }
    results = aggregatedResults.map((data, index) => ({ id: `${Date.now()}-${index}`, data }));
    renderResults();
  } catch (error) {
    console.error(error);
    notify(t("errorGeneral"));
  } finally {
    setGeneratingState(false);
  }
}

function restoreState() {
  const storedPrompt = localStorage.getItem(STORAGE_KEYS.prompt);
  if (storedPrompt) {
    $("#promptInput").value = storedPrompt;
  }
  const storedKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  if (storedKey) {
    $("#apiKey").value = storedKey;
  }
}

function attachHandlers() {
  $("#exportDocument").addEventListener("click", async () => {
    const base64 = await exportActiveDocumentBase64();
    if (base64) {
      await addReference(base64, "document");
    }
  });
  $("#exportLayer").addEventListener("click", async () => {
    const base64 = await exportActiveLayerBase64();
    if (base64) {
      await addReference(base64, "layer");
    }
  });
  $("#quickLayer").addEventListener("click", quickLayerToClipboard);
  $("#generate").addEventListener("click", generateImages);
  $("#promptInput").addEventListener("input", (event) => {
    localStorage.setItem(STORAGE_KEYS.prompt, event.target.value);
  });
  $("#saveKey").addEventListener("click", () => {
    const apiKey = $("#apiKey").value.trim();
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
    fetchGeminiUsage(apiKey);
  });
  $("#refreshUsage").addEventListener("click", () => {
    const apiKey = $("#apiKey").value.trim() || localStorage.getItem(STORAGE_KEYS.apiKey);
    fetchGeminiUsage(apiKey);
  });
}

function setupTabs() {
  const tabs = document.querySelector("sp-tabs");
  const panels = document.querySelector("sp-tab-panels");
  tabs.addEventListener("change", (event) => {
    panels.selected = event.target.value;
  });
}

function handleTheme() {
  const updateTheme = () => {
    const hostTheme = document.body.hostEnvironment?.appSkinInfo?.appBarBackgroundColor ?? "dark";
    if (hostTheme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  };
  document.addEventListener("uxp-themechange", updateTheme);
  updateTheme();
}

document.addEventListener("DOMContentLoaded", () => {
  handleTheme();
  initLocale();
  loadPersistedReferences();
  restoreState();
  applyLocale();
  setupDropZone();
  attachHandlers();
  setupTabs();
  const apiKey = $("#apiKey").value.trim() || localStorage.getItem(STORAGE_KEYS.apiKey);
  if (apiKey) {
    fetchGeminiUsage(apiKey);
  }
});
