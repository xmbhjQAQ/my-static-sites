

export const LOCALE_STORAGE_KEY = 'nn_locale';

export const STATE_STORAGE_KEY = 'nnTestState_v1';

export const RESULT_STORAGE_KEY = 'nnTestResult_v1';

export const QR_CACHE_PREFIX = 'nn_qr_data_url:';

export const CREATOR_NOTE_COLLAPSED_KEY = 'nn_creator_note_collapsed';

export const FALLBACK_LANGUAGE_CONFIG = {
    defaultLocale: 'zh-CN',
    locales: {
        'zh-CN': { dict: 'locales/zh-cn.json', questions: 'questions/questions_zh_cn.js', label: '简体中文', enabled: true },
        'en-US': { dict: 'locales/en_us.json', questions: 'questions/questions_en_us.js', label: 'English', enabled: true },
        'ja': { dict: 'locales/ja.json', questions: 'questions/questions_ja.js', label: '日本語', enabled: true }
    }
};

export const SCORE_COLLECTION_ENDPOINT = '/api/score';

export const SCORE_ALGORITHM_VERSION = 'classic_250_v1';

export const QUESTION_BANK_VERSION = 'questions_2026_05_06_v1';
