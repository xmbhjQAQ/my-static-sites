

// Keep core report dependencies on the same origin as the site.
const scriptRequests = new Map();

export function loadScriptOnce(src, timeoutMs = 10000) {
    if (scriptRequests.has(src)) return scriptRequests.get(src);
    const request = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const finish = error => {
            clearTimeout(timer);
            script.onload = script.onerror = null;
            if (error) {
                script.remove();
                reject(error);
            } else {
                resolve();
            }
        };
        const timer = setTimeout(() => finish(new Error(`Timed out loading ${src}`)), timeoutMs);
        script.src = src;
        script.onload = () => finish();
        script.onerror = () => finish(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    }).catch(error => {
        scriptRequests.delete(src);
        throw error;
    });
    scriptRequests.set(src, request);
    return request;
}

export async function loadChartEngine() {
    if (typeof window.Chart === 'function') return;
    const src = 'vendor/chart.umd-4.4.1.js';
    await loadScriptOnce(src);
    if (typeof window.Chart !== 'function') {
        scriptRequests.delete(src);
        throw new Error('Chart.js did not initialize.');
    }
}

export async function loadCaptureEngine() {
    if (typeof window.html2canvas === 'function') return;
    const src = 'vendor/html2canvas-1.4.1.min.js';
    await loadScriptOnce(src);
    if (typeof window.html2canvas !== 'function') {
        scriptRequests.delete(src);
        throw new Error('html2canvas did not initialize.');
    }
}
