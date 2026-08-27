/**
 * ToolSphere — 100% Client-Side SaaS Engine
 * Zero Server Uploads • Zero API Costs • Adsterra Ready
 */

// ==========================================================================
// 1. GLOBAL STATE & THEME MANAGEMENT
// ==========================================================================

// Dynamic Script Loader for Zero-Delay First Paint
const loadedScripts = new Set();
function loadScriptAsync(src) {
    if (loadedScripts.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// Preload remaining libraries during idle time (so UI and Ads get 100% bandwidth first)
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
        loadScriptAsync('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js');
    }, { timeout: 2000 });
} else {
    setTimeout(() => {
        loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    }, 1500);
}

const state = {
    activeTab: 'compressor',
    theme: localStorage.getItem('toolsphere_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    // Tool 1: Compressor
    compressor: {
        file: null,
        originalImg: null,
        compressedBlob: null,
        originalSize: 0,
        compressedSize: 0
    },
    // Tool 2: Converter
    converter: {
        files: [],
        targetFormat: 'image/webp'
    },
    // Tool 3: QR Code
    qrcode: {
        instance: null,
        type: 'url',
        darkColor: '#000000',
        lightColor: '#ffffff'
    }
};

// Initialize Theme
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    state.theme = theme;
    localStorage.setItem('toolsphere_theme', theme);
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', toggleMobileMenu);

function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
}

// Year in footer
document.getElementById('year-copy').textContent = new Date().getFullYear();

// ==========================================================================
// 2. TAB SWITCHING
// ==========================================================================

function switchTab(tabId) {
    state.activeTab = tabId;

    // Update Nav Tab UI
    document.querySelectorAll('.nav-tab').forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
            tab.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
            tab.classList.remove('active');
            tab.classList.add('text-slate-600', 'dark:text-slate-400');
        }
    });

    // Hide all tool cards, show active
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.add('hidden');
        card.classList.remove('active');
    });

    const activeCard = document.getElementById(`${tabId}-tool`);
    if (activeCard) {
        activeCard.classList.remove('hidden');
        activeCard.classList.add('active');
    }

    // Refresh icons
    if (window.lucide) lucide.createIcons();
}

// ==========================================================================
// 3. TOAST NOTIFICATION SYSTEM
// ==========================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColors = {
        success: 'bg-emerald-600 text-white',
        info: 'bg-indigo-600 text-white',
        error: 'bg-rose-600 text-white'
    };

    toast.className = `toast-enter flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg ${bgColors[type] || bgColors.info} pointer-events-auto transition-all`;
    toast.innerHTML = `
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 260);
    }, 2800);
}

// Share ToolSphere
function shareToolSphere() {
    if (navigator.share) {
        navigator.share({
            title: 'ToolSphere — 100% Free Client-Side Web Utilities',
            text: 'Fast & private image compressor, converter, QR generator & text tools!',
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
    }
}

// ==========================================================================
// 4. ADSTERRA MONETIZATION HOOKS & HELPERS
// ==========================================================================

/**
 * Direct Link / Popunder Trigger Helper
 * Calls your action callback and optionally fires a direct link / monetization action.
 */
function triggerDirectAdAction(callback) {
    // Optional Adsterra Direct Link trigger with 10-minute session cooldown
    const lastPopTime = localStorage.getItem('toolsphere_last_pop');
    const now = Date.now();
    const cooldownMs = 10 * 60 * 1000; // 10 minutes

    /* 
    // UNCOMMENT AND ADD YOUR ADSTERRA DIRECT LINK HERE TO MONETIZE CLICKS:
    if (!lastPopTime || (now - parseInt(lastPopTime)) > cooldownMs) {
        localStorage.setItem('toolsphere_last_pop', now.toString());
        // window.open('https://your-adsterra-direct-link-url.com', '_blank');
    }
    */

    if (typeof callback === 'function') {
        callback();
    }
}

function dismissStickyAd() {
    const footer = document.getElementById('adsterra-sticky-footer');
    if (footer) {
        footer.style.transform = 'translateY(100%)';
        setTimeout(() => footer.style.display = 'none', 300);
    }
}

// ==========================================================================
// 5. TOOL 1: SMART IMAGE COMPRESSOR & RESIZER
// ==========================================================================

const compDropzone = document.getElementById('compressor-dropzone');
const compFileInput = document.getElementById('compressor-file-input');
const compWorkspace = document.getElementById('compressor-workspace');
const compQuality = document.getElementById('compress-quality');
const qualityVal = document.getElementById('quality-val');
const compResize = document.getElementById('compress-resize');
const compOriginalPreview = document.getElementById('comp-preview-original');
const compCompressedPreview = document.getElementById('comp-preview-compressed');
const compOrigSizeEl = document.getElementById('comp-original-size');
const compNewSizeEl = document.getElementById('comp-new-size');
const compSavingsEl = document.getElementById('comp-savings');

// Setup Drag & Drop
compDropzone.addEventListener('click', () => compFileInput.click());
compDropzone.addEventListener('dragover', (e) => { e.preventDefault(); compDropzone.classList.add('dragover'); });
compDropzone.addEventListener('dragleave', () => compDropzone.classList.remove('dragover'));
compDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    compDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleCompressorFile(e.dataTransfer.files[0]);
});
compFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleCompressorFile(e.target.files[0]);
});

compQuality.addEventListener('input', (e) => {
    qualityVal.textContent = `${e.target.value}%`;
    processImageCompression();
});

compResize.addEventListener('change', () => {
    processImageCompression();
});

function handleCompressorFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
        return;
    }

    state.compressor.file = file;
    state.compressor.originalSize = file.size;
    compOrigSizeEl.textContent = formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            state.compressor.originalImg = img;
            compOriginalPreview.src = event.target.result;
            compWorkspace.classList.remove('hidden');
            processImageCompression();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function processImageCompression() {
    if (!state.compressor.originalImg) return;

    const img = state.compressor.originalImg;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const resizeVal = parseFloat(compResize.value);
    let targetWidth = img.naturalWidth;
    let targetHeight = img.naturalHeight;

    if (resizeVal <= 1) {
        // Percentage scale
        targetWidth = Math.round(img.naturalWidth * resizeVal);
        targetHeight = Math.round(img.naturalHeight * resizeVal);
    } else {
        // Max Dimension constraint
        const maxDim = resizeVal;
        if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
                targetWidth = maxDim;
            } else {
                targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
                targetHeight = maxDim;
            }
        }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw with high quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const quality = parseInt(compQuality.value, 10) / 100;
    
    // Choose output format (Default to WEBP or JPEG for compression efficiency)
    let outputMime = state.compressor.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    if (state.compressor.file.type === 'image/webp') outputMime = 'image/webp';

    // Canvas to Blob
    canvas.toBlob((blob) => {
        if (!blob) return;
        state.compressor.compressedBlob = blob;
        state.compressor.compressedSize = blob.size;

        compNewSizeEl.textContent = formatBytes(blob.size);
        
        // Calculate savings percentage
        const savings = ((state.compressor.originalSize - blob.size) / state.compressor.originalSize) * 100;
        if (savings > 0) {
            compSavingsEl.textContent = `-${Math.round(savings)}%`;
            compSavingsEl.className = 'text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono';
        } else {
            compSavingsEl.textContent = `+${Math.abs(Math.round(savings))}%`;
            compSavingsEl.className = 'text-sm sm:text-base font-extrabold text-amber-600 font-mono';
        }

        compCompressedPreview.src = URL.createObjectURL(blob);
    }, outputMime, quality);
}

function downloadCompressedImage() {
    if (!state.compressor.compressedBlob) return;

    const originalName = state.compressor.file.name;
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const ext = state.compressor.file.type === 'image/png' ? 'png' : 'jpg';
    
    const filename = `${baseName}-compressed.${ext}`;
    const url = URL.createObjectURL(state.compressor.compressedBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Confetti celebration
    if (window.confetti) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    showToast('Compressed image downloaded!');
}

function resetCompressor() {
    state.compressor = { file: null, originalImg: null, compressedBlob: null, originalSize: 0, compressedSize: 0 };
    compFileInput.value = '';
    compWorkspace.classList.add('hidden');
    compOriginalPreview.src = '';
    compCompressedPreview.src = '';
}

// ==========================================================================
// 6. TOOL 2: MULTI-FORMAT IMAGE CONVERTER
// ==========================================================================

const convDropzone = document.getElementById('converter-dropzone');
const convFileInput = document.getElementById('converter-file-input');
const convWorkspace = document.getElementById('converter-workspace');
const convList = document.getElementById('converter-items-list');

convDropzone.addEventListener('click', () => convFileInput.click());
convDropzone.addEventListener('dragover', (e) => { e.preventDefault(); convDropzone.classList.add('dragover'); });
convDropzone.addEventListener('dragleave', () => convDropzone.classList.remove('dragover'));
convDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    convDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleConverterFiles(Array.from(e.dataTransfer.files));
});
convFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleConverterFiles(Array.from(e.target.files));
});

function setTargetFormat(format, btn) {
    state.converter.targetFormat = format;
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active', 'bg-purple-600', 'text-white'));
    btn.classList.add('active', 'bg-purple-600', 'text-white');
}

function handleConverterFiles(files) {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
        showToast('Please select valid image files.', 'error');
        return;
    }

    state.converter.files = validImages;
    convWorkspace.classList.remove('hidden');
    renderConverterList();
}

function renderConverterList() {
    convList.innerHTML = '';
    state.converter.files.forEach((file, idx) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs';
        item.innerHTML = `
            <div class="flex items-center gap-2.5 truncate max-w-[60%]">
                <i data-lucide="file-image" class="w-4 h-4 text-purple-600 flex-shrink-0"></i>
                <span class="font-medium truncate text-slate-800 dark:text-slate-200">${file.name}</span>
                <span class="text-[10px] text-slate-400 font-mono">(${formatBytes(file.size)})</span>
            </div>
            <button onclick="convertAndDownloadSingle(${idx})" class="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 font-semibold transition">
                Convert
            </button>
        `;
        convList.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function convertImageToFormat(file, targetMime) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Conversion failed'));
                }, targetMime, 0.92);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function convertAndDownloadSingle(index) {
    const file = state.converter.files[index];
    if (!file) return;

    try {
        const mime = state.converter.targetFormat;
        const ext = getExtensionFromMime(mime);
        const blob = await convertImageToFormat(file, mime);

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const filename = `${baseName}.${ext}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        showToast(`Converted to ${ext.toUpperCase()} successfully!`);
    } catch (err) {
        showToast('Error converting image.', 'error');
    }
}

async function processBatchConversion() {
    if (state.converter.files.length === 0) return;

    if (state.converter.files.length === 1) {
        convertAndDownloadSingle(0);
        return;
    }

    if (!window.JSZip) {
        showToast('Loading batch ZIP module...', 'info');
        await loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    const zip = new JSZip();
    const mime = state.converter.targetFormat;
    const ext = getExtensionFromMime(mime);

    showToast('Processing batch conversion...', 'info');

    for (let i = 0; i < state.converter.files.length; i++) {
        const file = state.converter.files[i];
        const blob = await convertImageToFormat(file, mime);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        zip.file(`${baseName}.${ext}`, blob);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipContent);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolsphere-converted-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.confetti) confetti({ particleCount: 50, spread: 70 });
    showToast('Batch ZIP downloaded!');
}

function getExtensionFromMime(mime) {
    switch (mime) {
        case 'image/png': return 'png';
        case 'image/jpeg': return 'jpg';
        case 'image/webp': return 'webp';
        case 'image/bmp': return 'bmp';
        default: return 'png';
    }
}

// ==========================================================================
// 7. TOOL 3: CUSTOM QR CODE STUDIO
// ==========================================================================

const qrContent = document.getElementById('qr-content');
const qrColorDark = document.getElementById('qr-color-dark');
const qrColorLight = document.getElementById('qr-color-light');
const qrDarkVal = document.getElementById('qr-color-dark-val');
const qrLightVal = document.getElementById('qr-color-light-val');
const qrBox = document.getElementById('qrcode-box');

function setQrType(type, btn) {
    state.qrcode.type = type;
    document.querySelectorAll('.qr-type-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const label = document.getElementById('qr-label');
    const wifiFields = document.getElementById('wifi-fields');

    if (type === 'wifi') {
        label.textContent = 'Wi-Fi Details';
        qrContent.classList.add('hidden');
        wifiFields.classList.remove('hidden');
    } else {
        qrContent.classList.remove('hidden');
        wifiFields.classList.add('hidden');
        if (type === 'url') label.textContent = 'Website URL';
        if (type === 'text') label.textContent = 'Plain Text';
        if (type === 'email') label.textContent = 'Email Address';
    }
    updateQRCode();
}

async function updateQRCode() {
    let payload = qrContent.value.trim();

    if (state.qrcode.type === 'wifi') {
        const ssid = document.getElementById('wifi-ssid').value.trim();
        const pass = document.getElementById('wifi-pass').value.trim();
        const type = document.getElementById('wifi-type').value;
        payload = `WIFI:S:${ssid};T:${type};P:${pass};;`;
    } else if (state.qrcode.type === 'email') {
        payload = `mailto:${payload}`;
    }

    if (!payload) payload = 'https://toolsphere.app';

    qrBox.innerHTML = '';
    
    if (!window.QRCode) {
        await loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    }

    if (window.QRCode) {
        state.qrcode.instance = new QRCode(qrBox, {
            text: payload,
            width: 200,
            height: 200,
            colorDark: state.qrcode.darkColor,
            colorLight: state.qrcode.lightColor,
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

qrContent.addEventListener('input', updateQRCode);
document.getElementById('wifi-ssid').addEventListener('input', updateQRCode);
document.getElementById('wifi-pass').addEventListener('input', updateQRCode);
document.getElementById('wifi-type').addEventListener('change', updateQRCode);

qrColorDark.addEventListener('input', (e) => {
    state.qrcode.darkColor = e.target.value;
    qrDarkVal.textContent = e.target.value.toUpperCase();
    updateQRCode();
});

qrColorLight.addEventListener('input', (e) => {
    state.qrcode.lightColor = e.target.value;
    qrLightVal.textContent = e.target.value.toUpperCase();
    updateQRCode();
});

function downloadQRCodePNG() {
    const img = qrBox.querySelector('img') || qrBox.querySelector('canvas');
    if (!img) return;

    const a = document.createElement('a');
    a.href = img.src || img.toDataURL('image/png');
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
    showToast('QR Code saved as PNG!');
}

// Safe Initial QR Render
function initQRCodeSafe() {
    if (window.QRCode) {
        updateQRCode();
    } else {
        setTimeout(initQRCodeSafe, 100);
    }
}
initQRCodeSafe();

// ==========================================================================
// 8. TOOL 4: TEXT & CASE UTILITIES
// ==========================================================================

const textInput = document.getElementById('text-input');
const textWordCount = document.getElementById('text-word-count');
const textCharCount = document.getElementById('text-char-count');
const textSentenceCount = document.getElementById('text-sentence-count');
const textReadingTime = document.getElementById('text-reading-time');

textInput.addEventListener('input', updateTextStats);

function updateTextStats() {
    const text = textInput.value;
    
    // Character count
    textCharCount.textContent = text.length;

    // Words count
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    textWordCount.textContent = words.length;

    // Sentence count
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    textSentenceCount.textContent = sentences.length;

    // Reading time (avg 200 words per minute)
    const seconds = Math.ceil((words.length / 200) * 60);
    textReadingTime.textContent = seconds < 60 ? `${seconds}s` : `${Math.ceil(seconds / 60)}m`;
}

function transformText(action) {
    const text = textInput.value;
    if (!text) return;

    let result = text;

    switch (action) {
        case 'uppercase':
            result = text.toUpperCase();
            break;
        case 'lowercase':
            result = text.toLowerCase();
            break;
        case 'titlecase':
            result = text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
            break;
        case 'sentencecase':
            result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
            break;
        case 'camelcase':
            result = text
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .split(' ')
                .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join('');
            break;
        case 'kebabcase':
            result = text
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            break;
        case 'snakecase':
            result = text
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            break;
        case 'slugify':
            result = text
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            break;
        case 'removespaces':
            result = text.replace(/\s+/g, ' ').trim();
            break;
    }

    textInput.value = result;
    updateTextStats();
    showToast('Text formatted!');
}

function copyTextToClipboard() {
    if (!textInput.value) {
        showToast('Text box is empty.', 'info');
        return;
    }
    navigator.clipboard.writeText(textInput.value);
    showToast('Copied to clipboard!');
}

function clearText() {
    textInput.value = '';
    updateTextStats();
}

// ==========================================================================
// 9. TOOL 5: COLOR PALETTE STUDIO
// ==========================================================================

const palDropzone = document.getElementById('palette-dropzone');
const palFileInput = document.getElementById('palette-file-input');
const palWorkspace = document.getElementById('palette-workspace');
const palSwatches = document.getElementById('palette-swatches');
const palCssCode = document.getElementById('palette-css-code');

let currentPaletteHexList = [];

palDropzone.addEventListener('click', () => palFileInput.click());
palDropzone.addEventListener('dragover', (e) => { e.preventDefault(); palDropzone.classList.add('dragover'); });
palDropzone.addEventListener('dragleave', () => palDropzone.classList.remove('dragover'));
palDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    palDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) extractColorsFromImage(e.dataTransfer.files[0]);
});
palFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) extractColorsFromImage(e.target.files[0]);
});

function extractColorsFromImage(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);

            const imageData = ctx.getImageData(0, 0, 100, 100).data;
            const colorCounts = {};

            // Sample pixels with quantizing
            for (let i = 0; i < imageData.length; i += 16) {
                const r = Math.round(imageData[i] / 24) * 24;
                const g = Math.round(imageData[i + 1] / 24) * 24;
                const b = Math.round(imageData[i + 2] / 24) * 24;
                const hex = rgbToHex(r, g, b);
                colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            }

            const sortedColors = Object.keys(colorCounts)
                .sort((a, b) => colorCounts[b] - colorCounts[a])
                .slice(0, 6);

            currentPaletteHexList = sortedColors;
            renderPaletteSwatches(sortedColors);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderPaletteSwatches(colors) {
    palWorkspace.classList.remove('hidden');
    palSwatches.innerHTML = '';

    let cssVars = ':root {\n';

    colors.forEach((hex, idx) => {
        cssVars += `  --color-brand-${(idx + 1) * 100}: ${hex};\n`;

        const swatch = document.createElement('div');
        swatch.className = 'flex flex-col rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer group';
        swatch.onclick = () => {
            navigator.clipboard.writeText(hex);
            showToast(`Copied ${hex}!`);
        };

        swatch.innerHTML = `
            <div class="h-20 w-full group-hover:scale-105 transition-transform" style="background-color: ${hex}"></div>
            <div class="p-2 bg-white dark:bg-slate-800 text-center">
                <span class="text-[11px] font-bold font-mono text-slate-800 dark:text-slate-200 block">${hex}</span>
                <span class="text-[9px] text-slate-400">Click to copy</span>
            </div>
        `;
        palSwatches.appendChild(swatch);
    });

    cssVars += '}';
    palCssCode.textContent = cssVars;
}

function copyCssPalette() {
    navigator.clipboard.writeText(palCssCode.textContent);
    showToast('CSS Variables copied!');
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.min(255, Math.max(0, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

// ==========================================================================
// 10. FAQ ACCORDION LOGIC
// ==========================================================================

document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('i');
        const isHidden = content.classList.contains('hidden');

        // Close others
        document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.faq-btn i').forEach(i => i.style.transform = 'rotate(0deg)');

        if (isHidden) {
            content.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        }
    });
});

// ==========================================================================
// 11. UTILITY HELPERS
// ==========================================================================

function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Initialize Lucide Icons and Theme on start
function initAppBootstrap() {
    if (window.lucide) lucide.createIcons();
    else setTimeout(initAppBootstrap, 100);

    // Register Service Worker for Instant 0.00s Loading on Repeat Visits
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppBootstrap);
} else {
    initAppBootstrap();
}
