import { FALLBACK_LANGUAGE_CONFIG } from './config.js';

// Shared session state. Modules import this explicitly; nothing is exposed on window.

export const state = {
    DEFAULT_LOCALE: FALLBACK_LANGUAGE_CONFIG.defaultLocale,
    SUPPORTED_LOCALES: {},
    activeLocale: FALLBACK_LANGUAGE_CONFIG.defaultLocale,
    activeMessages: {},
    fallbackMessages: {},
    questionBankReady: false,
    questionBankError: '',
    standardOptions: [
        { l: "完全符合", v: 5 }, { l: "比较符合", v: 4 }, { l: "中立/不确定", v: 3 },
        { l: "比较不符合", v: 2 }, { l: "完全不符合", v: 1 }
    ],
    shuffledQuestions: [],
    userAnswers: new Array(50).fill(null),
    currentQIdx: 0,
    isAnswering: false,
    radarChartInstance: null,
    totalAnsweringTimeMs: 0,
    lastQTime: 0,
    consistencyInfo: null,
    latestResultShareText: '我刚测了自己的男娘潜质，快来测测你的隐藏属性。',
    toastTimer: null,
    dockTicking: false,
    debugBypassSpam: false,
    debugScoreOverride: null,
    debugSession: false,
    suppressScoreUploadForCurrentResult: false,
    pendingScoreStatsRequest: null,
    dimNames: { A: "审美偏好", B: "行为习惯", C: "心理共情", D: "社交亚文化" },
    dimMeta: {
        A: { icon: "美", color: "#ff8fab", short: "审美雷达" },
        B: { icon: "行", color: "#a8e6cf", short: "行为本能" },
        C: { icon: "心", color: "#d8b4fe", short: "心理共情" },
        D: { icon: "圈", color: "#ffd166", short: "社交同化" }
    },
    dimMaxScores: { A: 0, B: 0, C: 0, D: 0 }
};
