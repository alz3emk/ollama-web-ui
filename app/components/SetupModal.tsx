'use client';

import { useState } from 'react';
import { Server, Check, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { setBaseUrl } from '../lib/ollama';
import { useLanguage } from '../hooks/useLanguage';

interface SetupModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function SetupModal({ isOpen, onComplete }: SetupModalProps) {
    const [url, setUrl] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useLanguage();

    const handleTest = async () => {
        if (!url.trim()) {
            setErrorMessage('Please enter a URL');
            return;
        }

        setTestStatus('testing');
        setErrorMessage('');

        try {
            // Test the connection through the backend proxy
            // This validates that the backend can reach the Ollama server
            const response = await fetch('/api/ollama/tags');
            
            if (!response.ok) {
                const data = await response.json();
                setTestStatus('error');
                setErrorMessage(data.error || 'Failed to connect through proxy. Make sure the URL is configured on the backend.');
                return;
            }

            const data = await response.json();
            
            if (data.error) {
                setTestStatus('error');
                setErrorMessage(data.error);
                return;
            }

            setTestStatus('success');
        } catch (error: any) {
            setTestStatus('error');
            setErrorMessage('Connection test failed. Make sure the backend can reach the Ollama server.');
        }
    };

    const handleSave = async () => {
        if (testStatus !== 'success') {
            await handleTest();
            return;
        }
        // Store the URL for display only
        setBaseUrl(url.trim().replace(/\/$/, ''));
        onComplete();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-xl glow">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{t('setup.welcome')}</h1>
                    <p className="text-muted-foreground">
                        {t('setup.subtitle')}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <Server className="w-4 h-4 text-primary" />
                            {t('setup.urlLabel')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setTestStatus('idle');
                                    setErrorMessage('');
                                }}
                                placeholder={t('setup.placeholder')}
                                className="flex-1 px-4 py-3.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                            />
                            <button
                                onClick={handleTest}
                                disabled={testStatus === 'testing' || !url.trim()}
                                className={`px-4 py-3.5 rounded-xl transition-all font-medium flex items-center gap-2 ${testStatus === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : testStatus === 'error'
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                                        : 'bg-secondary hover:bg-secondary/80 border border-border'
                                    } disabled:opacity-50`}
                            >
                                {testStatus === 'testing' ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : testStatus === 'success' ? (
                                    <Check className="w-5 h-5" />
                                ) : testStatus === 'error' ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : (
                                    <RefreshCw className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
                        )}

                        {testStatus === 'success' && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                {t('setup.connected')}
                            </p>
                        )}
                    </div>

                    {/* Help Box */}
                    <div className="p-5 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-2xl border border-primary/20">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="text-lg">🚀</span>
                            {t('setup.guide')}
                        </h3>
                        <ol className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">1.</span>
                                <span>{t('setup.install')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">2.</span>
                                <span>{t('setup.run')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">3.</span>
                                <span>{t('setup.enterUrl')}</span>
                            </li>
                        </ol>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0">
                    <button
                        onClick={handleSave}
                        disabled={testStatus === 'testing'}
                        className="w-full py-4 text-base font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {testStatus === 'success' ? t('setup.startButton') : t('setup.testButton')}
                    </button>
                </div>
            </div>
        </div>
    );
}
