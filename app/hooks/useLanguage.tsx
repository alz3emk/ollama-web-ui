'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
    en: {
        'app.title': 'Ollama UI',
        'app.description': 'Chat with Local AI Models',
        'nav.newChat': 'New Chat',
        'nav.recentChats': 'Recent Chats',
        'nav.settings': 'Settings',
        'nav.clearAll': 'Clear all conversations',
        'nav.connected': 'Connected to Ollama',
        'nav.disconnected': 'Disconnected',
        'header.model': 'Model',
        'header.online': 'Online',
        'header.offline': 'Offline',
        'chat.placeholder': 'Message Ollama... (Shift+Enter for new line)',
        'chat.placeholderWithImage': 'Add a message or send to analyze image...',
        'chat.noConnection': 'Connect to Ollama to start chatting...',
        'chat.welcome': 'How can I help you today?',
        'chat.description': 'Start a conversation with your Ollama models. Ask questions, generate code, or explore ideas.',
        'chat.visionDetected': 'Vision model detected - you can upload images for analysis',
        'chat.powered': 'Powered by Ollama • Responses are generated locally on your machine',
        'chat.visionPowered': 'Vision model - drag & drop or click 📎 to upload images',
        'image.dropHere': 'Drop images here',
        'image.label': 'Image',
        'setup.welcome': 'Welcome to Ollama UI',
        'setup.subtitle': 'Connect to your Ollama server to get started',
        'setup.urlLabel': 'Ollama Server URL',
        'setup.placeholder': 'http://localhost:11434',
        'setup.testButton': 'Test & Connect',
        'setup.startButton': 'Get Started',
        'setup.connected': '✓ Connected successfully!',
        'setup.error': 'Could not connect to Ollama server. Make sure the URL is correct and the server is running.',
        'setup.emptyError': 'Please enter a URL',
        'setup.guide': 'Quick Setup',
        'setup.install': 'Install Ollama from ollama.ai',
        'setup.run': 'Run ollama serve in terminal',
        'setup.enterUrl': 'Enter URL above (default: http://localhost:11434)',
        'settings.title': 'Settings',
        'settings.subtitle': 'Configure your Ollama connection',
        'settings.urlLabel': 'Ollama Server URL',
        'settings.testButton': 'Test',
        'settings.saveButton': 'Save Changes',
        'settings.cancelButton': 'Cancel',
        'settings.guide': 'Quick Setup Guide',
        'sidebar.aiChat': 'AI Chat Interface',
        'sidebar.noConversations': 'No conversations yet',
        'sidebar.noConversationsDesc': 'Start a new chat to begin',
        'language': 'Language',
        'theme': 'Theme',
        'light': 'Light',
        'dark': 'Dark',
        'system': 'System',
    },
    ar: {
        'app.title': 'واجهة أولاما',
        'app.description': 'التحدث مع نماذج الذكاء الاصطناعي المحلية',
        'nav.newChat': 'محادثة جديدة',
        'nav.recentChats': 'المحادثات الأخيرة',
        'nav.settings': 'الإعدادات',
        'nav.clearAll': 'مسح جميع المحادثات',
        'nav.connected': 'متصل بـ Ollama',
        'nav.disconnected': 'غير متصل',
        'header.model': 'النموذج',
        'header.online': 'متصل',
        'header.offline': 'غير متصل',
        'chat.placeholder': 'رسالة إلى أولاما... (Shift+Enter للسطر الجديد)',
        'chat.placeholderWithImage': 'أضف رسالة أو أرسل لتحليل الصورة...',
        'chat.noConnection': 'قم بالاتصال بـ Ollama لبدء المحادثة...',
        'chat.welcome': 'كيف يمكنني مساعدتك اليوم؟',
        'chat.description': 'ابدأ محادثة مع نماذج Ollama الخاصة بك. اطرح أسئلة أو اكتب أكواد أو استكشف أفكار.',
        'chat.visionDetected': 'تم اكتشاف نموذج الرؤية - يمكنك تحميل الصور للتحليل',
        'chat.powered': 'مدعوم بـ Ollama • يتم إنشاء الردود محليًا على جهازك',
        'chat.visionPowered': 'نموذج الرؤية - اسحب وأفلت أو انقر 📎 لتحميل الصور',
        'image.dropHere': 'أفلت الصور هنا',
        'image.label': 'صورة',
        'setup.welcome': 'مرحبا بك في واجهة أولاما',
        'setup.subtitle': 'تواصل مع خادم Ollama الخاص بك للبدء',
        'setup.urlLabel': 'عنوان URL لخادم Ollama',
        'setup.placeholder': 'http://localhost:11434',
        'setup.testButton': 'اختبار والاتصال',
        'setup.startButton': 'ابدأ',
        'setup.connected': '✓ متصل بنجاح!',
        'setup.error': 'لم يتمكن من الاتصال بخادم Ollama. تأكد من صحة العنوان وأن الخادم يعمل.',
        'setup.emptyError': 'يرجى إدخال عنوان URL',
        'setup.guide': 'دليل البدء السريع',
        'setup.install': 'قم بتثبيت Ollama من ollama.ai',
        'setup.run': 'قم بتشغيل ollama serve في الطرفية',
        'setup.enterUrl': 'أدخل عنوان URL أعلاه (افتراضي: http://localhost:11434)',
        'settings.title': 'الإعدادات',
        'settings.subtitle': 'قم بتكوين اتصال Ollama الخاص بك',
        'settings.urlLabel': 'عنوان URL لخادم Ollama',
        'settings.testButton': 'اختبار',
        'settings.saveButton': 'حفظ التغييرات',
        'settings.cancelButton': 'إلغاء',
        'settings.guide': 'دليل البدء السريع',
        'sidebar.aiChat': 'واجهة الدردشة بالذكاء الاصطناعي',
        'sidebar.noConversations': 'لا توجد محادثات حتى الآن',
        'sidebar.noConversationsDesc': 'ابدأ محادثة جديدة للبدء',
        'language': 'اللغة',
        'theme': 'المظهر',
        'light': 'فاتح',
        'dark': 'داكن',
        'system': 'النظام',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [direction, setDirection] = useState<Direction>('ltr');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedLanguage = (localStorage.getItem('language') || 'en') as Language;
        setLanguageState(savedLanguage);
        updateDirection(savedLanguage);
    }, []);

    const updateDirection = (lang: Language) => {
        const newDirection: Direction = lang === 'ar' ? 'rtl' : 'ltr';
        setDirection(newDirection);

        if (typeof window !== 'undefined') {
            document.documentElement.dir = newDirection;
            document.documentElement.lang = lang;
        }
    };

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        updateDirection(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    };

    if (!isClient) {
        return <>{children}</>;
    }

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
