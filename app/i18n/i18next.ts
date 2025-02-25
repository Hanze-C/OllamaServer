import i18next, { ModuleType } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from "react-native-localize";

export const lngKey =  '@lng';

/**
 * 获取当前系统语言
 * @returns
 */
export const getSystemLanguage = (): string => {
    const locales = RNLocalize.getLocales();
    return locales[0].languageCode;
};

const languageDetector = {
    type: 'languageDetector' as ModuleType,
    async: true,
    detect: function (callback: (arg0: string) => void) {
        callback(getSystemLanguage());
        // // 获取上次选择的语言
        // storage.get(lngKey, 'locale').then(lng => {
        //     // 如果是跟随本地，则获取系统语言
        //     if (lng === 'locale') {
        //         callback(getSystemLanguage());
        //     } else {
        //         callback(lng);
        //     }
        // });
    },
};

// 初始化i18next配置
i18next
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en', // 切换语言失败时的使用的语言
        debug: __DEV__, // 开发环境开启调试
        // 资源文件
        resources: {
            en: {
                translation: require('./location/en-US/en-US.json'),
            },
            zh: {
                translation: require('./location/zh-CN/zh-CN.json'),
            },
        },
        react: {
            useSuspense: false,
        },
    });

/**
 * 切换语言
 * @param lng
 */
export const changeLanguage = async (lng?: 'en' | 'zh' | 'locale') => {
    // 切换语言
    await i18next.changeLanguage(lng === 'locale' ? getSystemLanguage() : lng);
    // 持久化当前选择
    // await storage.set(lngKey, lng);
};

export default i18next;
