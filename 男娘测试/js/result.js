import { STATE_STORAGE_KEY } from './config.js';
import { loadChartEngine } from './dependencies.js';
import { setQrCodeForCurrentUrl } from './export.js';
import { getMessage, t } from './messages.js';
import { buildResultScoreContext, requestScoreStatsForCurrentResult, resetPendingScoreStatsRequest } from './scores.js';
import { state } from './state.js';
import { saveCompletedResult } from './storage.js';
import { applyCreatorNoteState, setText, showPage, updateResultDockVisibility } from './ui.js';

export function getDimLevel(percent) {
    if (percent >= 85) return getMessage('dimensions.levels.over', { tag: '爆表', text: '特征极度凸显，属于一眼能看出来的主导倾向。' });
    if (percent >= 70) return getMessage('dimensions.levels.high', { tag: '偏高', text: '倾向已经比较明显，日常表现里会经常冒头。' });
    if (percent >= 50) return getMessage('dimensions.levels.medium', { tag: '中等', text: '存在一定波动，偶尔会被特定场景触发。' });
    if (percent >= 30) return getMessage('dimensions.levels.low', { tag: '偏低', text: '相关信号较弱，更多停留在轻微兴趣或偶发表现。' });
    return getMessage('dimensions.levels.none', { tag: '钢板', text: '几乎没有有效波形，系统暂时没捕捉到明显迹象。' });
}

export function getUnlockedTitle(score, tier, dominantName, isSpam = false) {
    if (isSpam) return t('titles.spam', {}, '异常样本拦截者');
    if (score >= 230) return t('titles.legend', {}, '天选级隐藏宝藏');
    if (score >= 205) return t('titles.dominant', { dominantName }, `${dominantName}满载体质`);
    if (score >= 160) return t('titles.deep', {}, '深度觉醒预备役');
    if (score >= 135) return t('titles.pink', {}, '浅度粉红觉醒');
    if (score >= 105) return t('titles.rookie', {}, '萌新潜质样本');
    return t('titles.guard', {}, '钢铁防线守门员');
}

export function buildShareText(score, tier, title, dominantName, rankText) {
    return t('share.resultText', {
        score,
        tier,
        title,
        dominantName,
        rankText: rankText || t('share.rankFallback', {}, '快来测测你的隐藏属性。')
    }, `我测出了「${title}」：${score}/250，${tier}，核心倾向是${dominantName}。${rankText || '快来测测你的隐藏属性。'}`);
}

export async function loadChartjsAndResult() {
    document.getElementById('loading-text').innerText = t('loading.chartEngine', {}, "加载制图引擎...");
    try {
        await loadChartEngine();
    } catch (error) {
        console.warn('Chart.js failed to load; rendering text result only.');
    }
    generateResult();
}

export function renderStabilityCard(info, isPunished = false) {
    const safeInfo = info || {
        score: 100,
        level: t('stability.defaultLevel', {}, "高"),
        desc: t('stability.defaultDesc', {}, "前后作答波形比较稳定，系统决定认真给你算一卦。")
    };
    const fill = document.getElementById('stability-fill');
    const level = document.getElementById('stability-level');
    const desc = document.getElementById('stability-desc');
    if (!fill || !level || !desc) return;

    fill.style.width = `${Math.max(0, Math.min(100, safeInfo.score))}%`;
    level.innerText = isPunished
        ? t('stability.punishedPrefix', { level: safeInfo.level || t('stability.abnormal', {}, '异常') }, `已拦截 · ${safeInfo.level || '异常'}`)
        : t('stability.levelWithScore', { level: safeInfo.level, score: Math.round(safeInfo.score) }, `${safeInfo.level} (${Math.round(safeInfo.score)}%)`);
    desc.innerText = isPunished
        ? `${safeInfo.desc || t('stability.punishedFallback', {}, '这份样本的灵魂波形太抽象，系统决定先把整活惩罚端上来。')}`
        : safeInfo.desc;
}

export function renderRadarSummary(scores, isPunished = false) {
    if (isPunished) {
        setText('radar-summary', t('result.radarPunished', {}, '异常作答导致雷达图被强制归零，系统无法给出有效最高/最低维度。'));
        return;
    }
    const percs = Object.keys(scores).map(k => ({
        key: k,
        percent: Math.round((scores[k] / state.dimMaxScores[k]) * 100)
    })).sort((a, b) => b.percent - a.percent);
    const top = percs[0];
    const low = percs[percs.length - 1];
    setText('radar-summary', t('result.radarSummary', {
        topName: state.dimNames[top.key],
        topPercent: top.percent,
        lowName: state.dimNames[low.key],
        lowPercent: low.percent,
        shortName: state.dimMeta[top.key].short
    }, `最高维度是「${state.dimNames[top.key]}」${top.percent}%，最低维度是「${state.dimNames[low.key]}」${low.percent}%。整体画像主要由${state.dimMeta[top.key].short}驱动。`));
}

export function updateResultSummary({ score, tier, title, dominantName, isSpam = false }) {
    setText('summary-title', title);
    setText('summary-score', `${score} / 250`);
    setText('summary-tier', tier.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, ''));
    setText('summary-dominant', dominantName);
    if (isSpam) setText('summary-rank', t('result.summaryValues.spam', {}, '异常样本'));
}

export function resetResultUi() {
    const punishNotice = document.getElementById('punish-notice');
    if (punishNotice) punishNotice.style.display = 'none';
    const punishRevealActions = document.getElementById('punish-reveal-actions');
    if (punishRevealActions) punishRevealActions.style.display = 'none';
    document.getElementById('page-result').classList.remove('spam-punish-effect');
    const stopBtn = document.getElementById('btn-stop-glitch');
    if (stopBtn) {
        stopBtn.style.display = 'none';
        stopBtn.dataset.enabled = 'false';
        const label = stopBtn.querySelector('span');
        if (label) {
            label.dataset.i18n = 'result.actions.enableGlitch';
            label.innerText = t('result.actions.enableGlitch', {}, '⚠ 开启强烈特效');
        }
    }
    setText('summary-rank', t('result.summaryValues.rank', {}, '同步中'));
    applyCreatorNoteState();
}

export function showNormalResultFromPunish() {
    if (!(window.spamStatus > 0)) return;
    window.spamStatus = 0;
    window.spamVal = undefined;
    state.suppressScoreUploadForCurrentResult = true;
    resetPendingScoreStatsRequest();
    generateResult();
}

export function generateResult() {
    showPage('result');
    resetResultUi();
    const resultContext = buildResultScoreContext();

    if (window.spamStatus > 0) {
        document.getElementById('final-score').innerText = '0';
        renderScoreStats(null, 0, true);
        const punishNotice = document.getElementById('punish-notice');
        if (punishNotice) {
            punishNotice.style.display = 'block';
            punishNotice.innerText = t('result.punishNoticeWithEffectWarning', {}, '检测到异常作答，本次报告已切换为惩罚鉴定模式。强烈闪烁/抖动特效默认关闭；如需开启，请确认不存在光敏不适或光敏性癫痫风险。');
        }
        const punishRevealActions = document.getElementById('punish-reveal-actions');
        if (punishRevealActions) punishRevealActions.style.display = 'block';
        requestScoreStatsForCurrentResult(resultContext).then(summary => {
            if (window.spamStatus > 0) renderScoreStats(summary, 0, true);
        });

        const titleEl = document.getElementById('tier-title');
        titleEl.innerText = t('punish.tier', {}, '🤡 骗骗哥们就行了，别把自己骗了（');
        titleEl.style.color = '#fff';
        titleEl.style.background = '#ff4d4f';
        titleEl.style.border = 'none';
        titleEl.style.boxShadow = '0 4px 15px rgba(255, 77, 79, 0.4)';

        const descEl = document.getElementById('tier-desc');
        descEl.innerText = t(`punish.descs.${window.spamStatus}`, {
            seconds: (Number(window.spamVal) / 50).toFixed(2),
            value: window.spamStatus === 5 ? Math.round(window.spamVal) : window.spamVal
        }, t('punish.descs.fallback', {}, '你乱点的吧 · 异常样本'));
        descEl.style.color = '#ff4d4f';
        updateResultSummary({
            score: 0,
            tier: t('punish.tierName', {}, '异常作答拦截'),
            title: getUnlockedTitle(0, t('punish.tierName', {}, '异常作答拦截'), t('punish.invalidSample', {}, '无效样本'), true),
            dominantName: t('punish.invalidSample', {}, '无效样本'),
            isSpam: true
        });
        state.latestResultShareText = t('share.punishedText', {}, '我把男娘潜质测试答成了异常样本，系统已经把我拦截了。');

        document.getElementById('dom-trait-title').innerText = t('punish.traitTitle', {}, '🚫 潜质评估已强制终止');
        document.getElementById('trait-analysis').innerText = t(`punish.analysis.${window.spamStatus}`, { seconds: window.spamVal }, t('punish.analysis.fallback', {}, '检测到异常作答模式，系统拒绝继续认真解析。'));
        document.getElementById('trait-behavior').innerText = t('punish.behavior', {}, '你的行为特征表现为：急躁、机械、带有极强的敷衍性。');
        document.getElementById('trait-advice').innerText = t('punish.advice', {}, '清空杂念，卸下所有防备！退出去重新凭你的真实第一直觉填一遍！');

        document.getElementById('dim-breakdown').innerHTML = t('result.dimensionFallbackHtml', {}, '<div style="text-align:center;color:#ff4d4f;margin:30px 0;font-weight:bold;font-size:16px;">检测到极度异常数据<br>本局各大维度底层面板已自毁 🈲</div>');
        renderStabilityCard(state.consistencyInfo || { score: 0, level: t('stability.abnormal', {}, '异常'), desc: t('stability.punishedFallback', {}, '这份样本的灵魂波形太抽象，系统决定先把整活惩罚端上来。') }, true);

        let fakeScores = { A: 0, B: 0, C: 0, D: 0 };
        drawRadar(fakeScores);
        renderRadarSummary(fakeScores, true);

        const glitchBtn = document.getElementById('btn-stop-glitch');
        if (glitchBtn) {
            glitchBtn.style.display = 'block';
            glitchBtn.dataset.enabled = 'false';
        }
        if (!state.debugSession) localStorage.removeItem(STATE_STORAGE_KEY);

        setQrCodeForCurrentUrl();
        setTimeout(updateResultDockVisibility, 80);
        saveCompletedResult({ mode: 'punish' });

        return;
    }

    const { scores, totalPercent, rawDisplayScore, effectiveConsistencyDiscount, displayScore } = resultContext;
    renderStabilityCard(state.consistencyInfo);
    document.getElementById('national-rank').innerText = t('scoreStats.syncing', {}, '📊 正在同步真实样本均值...');
    document.getElementById('national-rank').style.color = 'var(--primary)';
    requestScoreStatsForCurrentResult(resultContext)
        .then(summary => renderScoreStats(summary, displayScore, false));

    setQrCodeForCurrentUrl();
    setTimeout(updateResultDockVisibility, 80);

    let curr = 0;
    let step = Math.ceil(displayScore / 40); // 调整帧数
    function updateScoreVisual() {
        curr += step;
        if (curr >= displayScore) curr = displayScore;
        document.getElementById('final-score').innerText = curr;
        if (curr < displayScore) {
            requestAnimationFrame(updateScoreVisual);
        } else {
            drawRadar(scores);
            if (!state.debugSession) localStorage.removeItem(STATE_STORAGE_KEY); // 答题完成后清理未完成进度。
        }
    }
    requestAnimationFrame(updateScoreVisual);

    // 标准化判定段位
    const tierConfig = getMessage('tiers', []).find(item => displayScore <= item.max) || { tier: "👑 究极天选男娘", desc: "传说级·纯度99.9%·已无药可救", color: "#ff1493" };
    let tier = tierConfig.tier;
    let tierDesc = tierConfig.desc;
    let tierColor = tierConfig.color;

    const titleEl = document.getElementById('tier-title');
    titleEl.innerText = tier;
    titleEl.style.color = tierColor;
    titleEl.style.background = "rgba(255, 255, 255, 0.9)";
    titleEl.style.border = `2px solid ${tierColor}66`;
    titleEl.style.boxShadow = `0 4px 12px ${tierColor}44`;

    const descEl = document.getElementById('tier-desc');
    if (descEl) {
        descEl.innerText = tierDesc;
        descEl.style.color = tierColor;
    }

    const dimPercList = Object.keys(scores).map(k => ({
        key: k,
        percent: Math.round((scores[k] / state.dimMaxScores[k]) * 100)
    })).sort((a, b) => b.percent - a.percent);
    const dominantKey = dimPercList[0].key;
    const dominantName = state.dimNames[dominantKey];
    const unlockedTitle = getUnlockedTitle(displayScore, tier, dominantName);
    updateResultSummary({
        score: displayScore,
        tier,
        title: unlockedTitle,
        dominantName: `${dominantName} ${dimPercList[0].percent}%`
    });
    renderRadarSummary(scores);
    state.latestResultShareText = buildShareText(displayScore, tier, unlockedTitle, dominantName, '');

    const breakdownDiv = document.getElementById('dim-breakdown');
    breakdownDiv.innerHTML = '';
    Object.keys(scores).forEach(k => {
        let percent = Math.round((scores[k] / state.dimMaxScores[k]) * 100);
        let meta = state.dimMeta[k];
        let level = getDimLevel(percent);

        breakdownDiv.innerHTML += `
        <div class="dim-item">
            <div class="dim-header">
                <span class="dim-name"><span class="dim-icon" style="background:${meta.color};">${meta.icon}</span>${state.dimNames[k]}<span class="dim-tag" style="color:${meta.color};">${level.tag}</span></span>
                <span class="dim-score" style="color:${meta.color};">${scores[k]}/${state.dimMaxScores[k]} (${percent}%)</span>
            </div>
            <div class="dim-bar-bg"><div class="dim-bar-fill" style="width:${percent}%; background:${meta.color};"></div></div>
            <div class="dim-desc">${level.text}</div>
        </div>
    `;
    });

    let sortedDims = dimPercList.map(item => item.key);
    let maxDim1 = sortedDims[0];
    let maxDim2 = sortedDims[1];

    const traits = getMessage('traits', {});
    const straightTrait = traits.straight || {
        title: t('traits.straight.title', {}, '🛡️ 核心特征：【纯正的钢铁】'),
        analysis: t('traits.straight.analysis', {}, '系统没有匹配到明显的潜质信号，你的回答整体更偏向稳定、低调和现实取向。'),
        behavior: t('traits.straight.behavior', {}, '你在日常生活里大概率更习惯保持原本的穿搭和社交方式，对夸张表达不太敏感。'),
        advice: t('traits.straight.advice', {}, '保持轻松就好，本测试只是娱乐整活，结果不用太当真。')
    };

    let conclusion;
    if (displayScore >= 230) {
        conclusion = traits.legend || traits[maxDim1];
    } else if (displayScore <= 105) {
        conclusion = straightTrait;
    } else {
        let mixSet = new Set([maxDim1, maxDim2]);
        if (mixSet.has('A') && mixSet.has('B')) {
            conclusion = traits.AB || traits[maxDim1];
        } else if (mixSet.has('C') && mixSet.has('D')) {
            conclusion = traits.CD || traits[maxDim1];
        } else {
            conclusion = traits[maxDim1];
        }
    }
    conclusion = { ...straightTrait, ...(conclusion || {}) };

    document.getElementById('dom-trait-title').innerText = conclusion.title;
    document.getElementById('trait-analysis').innerText = conclusion.analysis;
    document.getElementById('trait-behavior').innerText = conclusion.behavior;
    document.getElementById('trait-advice').innerText = conclusion.advice;
    saveCompletedResult({ mode: 'normal' });
}

export function drawRadar(scores) {
    if (typeof Chart === 'undefined') {
        setText('radar-summary', t('result.radarUnavailable', {}, '制图引擎加载失败，已保留文字维度分析。'));
        return;
    }
    if (state.radarChartInstance) { state.radarChartInstance.destroy(); }

    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = window.spamStatus > 0 ? 'rgba(255, 0, 0, 0.5)' : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)');
    const labelColor = window.spamStatus > 0 ? '#ff0000' : (isDark ? '#eee' : '#666');

    const ctx = document.getElementById('radarChart').getContext('2d');
    state.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: getRadarLabels(),
            datasets: [{
                label: t('chart.dataset', {}, '能力值'),
                data: [
                    (scores.A / state.dimMaxScores.A) * 100,
                    (scores.B / state.dimMaxScores.B) * 100,
                    (scores.C / state.dimMaxScores.C) * 100,
                    (scores.D / state.dimMaxScores.D) * 100
                ],
                backgroundColor: window.spamStatus > 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 92, 138, 0.3)',
                borderColor: window.spamStatus > 0 ? '#ff0000' : '#ff5c8a',
                borderWidth: 2,
                pointBackgroundColor: window.spamStatus > 0 ? ['#ff0000', '#000', '#ff0000', '#000'] : ['#ff8fab', '#a8e6cf', '#d8b4fe', '#ffd700'],
                pointBorderColor: window.spamStatus > 0 ? '#ff0000' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { display: false },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 14, weight: 'bold' } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

export function getRadarLabels() {
    return [
        t('chart.A', {}, state.dimNames.A),
        t('chart.B', {}, state.dimNames.B),
        t('chart.C', {}, state.dimNames.C),
        t('chart.D', {}, state.dimNames.D)
    ];
}

export function setPunishEffectEnabled(enabled) {
    const resultPage = document.getElementById('page-result');
    const btn = document.getElementById('btn-stop-glitch');
    const label = btn ? btn.querySelector('span') : null;
    if (!resultPage || !btn) return;

    resultPage.classList.toggle('spam-punish-effect', enabled);
    btn.dataset.enabled = enabled ? 'true' : 'false';
    if (label) {
        label.dataset.i18n = enabled ? 'result.actions.disableGlitch' : 'result.actions.enableGlitch';
        label.innerText = enabled
            ? t('result.actions.disableGlitch', {}, '✖ 关闭强烈特效')
            : t('result.actions.enableGlitch', {}, '⚠ 开启强烈特效');
    }
    updateResultDockVisibility();
}

export function togglePunishEffect() {
    const btn = document.getElementById('btn-stop-glitch');
    const enabled = btn && btn.dataset.enabled === 'true';
    if (enabled) {
        setPunishEffectEnabled(false);
        return;
    }

    const warning = t('result.actions.glitchRiskConfirm', {}, '该特效包含快速闪烁、抖动和高对比颜色变化，可能诱发光敏不适或光敏性癫痫。确认开启吗？');
    if (window.confirm(warning)) setPunishEffectEnabled(true);
}

export function stopGlitch() {
    setPunishEffectEnabled(false);
}

export function renderScoreStats(summary, currentScore, isSpam) {
    const rankEl = document.getElementById('national-rank');
    if (!rankEl) return;

    if (isSpam) {
        rankEl.innerText = t('scoreStats.spamRank', {}, '📊 异常样本已记录，不计入公开均值');
        setText('summary-rank', t('result.summaryValues.spam', {}, '异常样本'));
        rankEl.style.color = '#ff4d4f';
        return;
    }

    if (!summary || !summary.stats || !summary.stats.count) {
        rankEl.innerText = t('scoreStats.unavailable', {}, '📊 样本均值暂时不可用，稍后刷新可查看');
        setText('summary-rank', t('result.summaryValues.waiting', {}, '等待样本'));
        rankEl.style.color = 'var(--primary)';
        return;
    }

    const average = Number(summary.stats.averageScore);
    const count = Number(summary.stats.count);
    const delta = Math.round(currentScore - average);
    let compareText = t('scoreStats.compareEqual', {}, '贴近当前均值');
    if (delta > 0) compareText = t('scoreStats.compareHigh', { delta }, `高于均值 ${delta} 分`);
    if (delta < 0) compareText = t('scoreStats.compareLow', { delta: Math.abs(delta) }, `低于均值 ${Math.abs(delta)} 分`);

    rankEl.innerText = t('scoreStats.average', { average: average.toFixed(1), count, compareText }, `📊 当前有效样本均分 ${average.toFixed(1)} / 250 · 已收录 ${count} 份 · 你${compareText}`);
    setText('summary-rank', t('scoreStats.summaryCompare', { compareText }, `你${compareText}`));
    rankEl.style.color = 'var(--primary)';
}
