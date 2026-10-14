import { QR_CACHE_PREFIX } from './config.js';
import { loadCaptureEngine } from './dependencies.js';
import { t } from './messages.js';
import { state } from './state.js';
import { hideCreatorNoteForShare, showToast, updateResultDockVisibility } from './ui.js';

export function copyResultText() {
    const text = state.latestResultShareText || t('share.defaultText', {}, '我刚测了自己的男娘潜质，快来测测你的隐藏属性。');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast(t('toast.copySuccess', {}, '结果文案已复制'))).catch(() => fallbackCopyText(text));
    } else {
        fallbackCopyText(text);
    }
}

export function fallbackCopyText(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.focus();
    area.select();
    try {
        document.execCommand('copy');
        showToast(t('toast.copySuccess', {}, '结果文案已复制'));
    } catch (error) {
        showToast(t('toast.copyFail', {}, '复制失败，请手动复制'));
    }
    area.remove();
}

export function getCleanTestUrl() {
    let testUrl = window.location.href.split('#')[0].split('?')[0];
    return testUrl.startsWith('http') ? testUrl : 'https://github.com/xmbhjQAQ/my-static-sites';
}

export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function setQrCodeForCurrentUrl() {
    const img = document.getElementById('qr-code');
    if (!img) return;
    const testUrl = getCleanTestUrl();
    const cacheKey = `${QR_CACHE_PREFIX}${testUrl}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        img.src = cached;
        return;
    }

    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(testUrl)}`;
    try {
        const response = await fetch(apiUrl, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`QR request failed: ${response.status}`);
        const dataUrl = await blobToDataUrl(await response.blob());
        localStorage.setItem(cacheKey, dataUrl);
        img.src = dataUrl;
    } catch (error) {
        console.warn('QR cache generation failed, falling back to remote image:', error);
        img.src = apiUrl;
    }
}

let isCapturingResult = false;

export async function downloadResult() {
    if (isCapturingResult) return;
    isCapturingResult = true;
    const btn = document.getElementById('btn-download');
    const oldText = btn.innerText;
    const exportButtons = Array.from(document.querySelectorAll('[onclick="downloadResult()"], [data-action="downloadResult"]'));
    const originalExportStates = exportButtons.map(button => ({ disabled: button.disabled, pointerEvents: button.style.pointerEvents }));
    let restoreCaptureState = () => {};
    let captureStarted = false;

    try {
        exportButtons.forEach(button => {
            button.disabled = true;
            button.style.pointerEvents = 'none';
        });
        btn.innerText = t('result.screenshotWorking', {}, '生成截图中...');
        await loadCaptureEngine();

        const originalButtons = document.querySelectorAll('#page-result .btn-main');
        const originalButtonDisplays = Array.from(originalButtons, button => button.style.display);
        const activePage = document.querySelector('.page.active');
        const oldAnimation = activePage.style.animation;
        const oldOpacity = activePage.style.opacity;
        const restoreCreatorNote = hideCreatorNoteForShare();
        restoreCaptureState = () => {
            originalButtons.forEach((button, index) => button.style.display = originalButtonDisplays[index]);
            restoreCreatorNote();
            activePage.style.animation = oldAnimation;
            activePage.style.opacity = oldOpacity;
            document.body.classList.remove('capture-mode');
            updateResultDockVisibility();
        };

        captureStarted = true;
        originalButtons.forEach(button => button.style.display = 'none');
        activePage.style.animation = 'none';
        activePage.style.opacity = '1';
        document.body.classList.add('capture-mode');
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const isDarkMode = document.body.classList.contains('dark-mode');
        const canvas = await html2canvas(document.querySelector('.container'), {
            scale: 2,
            useCORS: true,
            backgroundColor: isDarkMode ? '#1a1a2e' : '#ffc2d1',
            logging: false
        });
        const link = document.createElement('a');
        link.download = t('files.downloadName', {}, '男娘潜质鉴定报告.png');
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast(t('toast.imageSuccess', {}, '长图已生成'));
    } catch (error) {
        const message = t('toast.imageFail', {}, '截图生成失败，请稍后再试或换个浏览器保存。');
        if (captureStarted) {
            console.error('生成截图失败', error);
            alert(message);
        } else {
            showToast(message);
        }
    } finally {
        try {
            restoreCaptureState();
        } finally {
            exportButtons.forEach((button, index) => {
                button.disabled = originalExportStates[index].disabled;
                button.style.pointerEvents = originalExportStates[index].pointerEvents;
            });
            btn.innerText = oldText;
            isCapturingResult = false;
        }
    }
}


export function nativeShare() {
    const restoreCreatorNote = hideCreatorNoteForShare();
    if (navigator.share) {
        navigator.share({
            title: t('share.title', {}, '男娘潜质综合评估量表'),
            text: state.latestResultShareText || t('share.nativeDefault', {}, '我刚测了自己的男娘潜质，快来测测你离北朝还有多远？'),
            url: window.location.href
        }).catch(e => console.log('分享取消或失败', e)).finally(restoreCreatorNote);
    } else {
        copyResultText();
        showToast(t('toast.nativeFallback', {}, '浏览器不支持原生分享，已复制文案'));
        restoreCreatorNote();
    }
}
