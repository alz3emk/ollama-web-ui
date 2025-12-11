'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Server, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { getBaseUrl, setBaseUrl, checkConnection } from '../lib/ollama';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export function SettingsModal({ isOpen, onClose, onRefresh }: SettingsModalProps) {
    const [baseUrl, setBaseUrlState] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isOpen) {
            setBaseUrlState(getBaseUrl());
        }
    }, [isOpen]);

    const handleSave = () => {
        setBaseUrl(baseUrl);
        onRefresh();
        onClose();
    };

    const handleTest = async () => {
        setTestStatus('testing');
        setBaseUrl(baseUrl);
        const connected = await checkConnection();
        setTestStatus(connected ? 'success' : 'error');
        setTimeout(() => setTestStatus('idle'), 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/50">
                    <div>
                        <h2 className="text-xl font-bold">Settings</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Configure your Ollama connection</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-secondary rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Ollama Server URL */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <Server className="w-4 h-4 text-primary" />
                            Ollama Server URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrlState(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="flex-1 px-4 py-3.5 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            />
                            <button
                                onClick={handleTest}
                                disabled={testStatus === 'testing'}
                                className={`px-4 py-3.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${testStatus === 'success'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                        : testStatus === 'error'
                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                                            : 'bg-secondary hover:bg-secondary/80 border border-border'
                                    } disabled:opacity-50`}
                            >
                                {testStatus === 'testing' ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : testStatus === 'success' ? (
                                    <Check className="w-4 h-4" />
                                ) : testStatus === 'error' ? (
                                    <AlertCircle className="w-4 h-4" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Test
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter the URL where your Ollama server is running
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="p-5 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-2xl border border-primary/20">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="text-lg">🚀</span>
                            Quick Setup Guide
                        </h3>
                        <ol className="text-sm text-muted-foreground space-y-2.5">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">1.</span>
                                <span>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">ollama.ai <ExternalLink className="w-3 h-3" /></a></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">2.</span>
                                <span>Run <code className="px-2 py-1 bg-secondary rounded-md font-mono text-xs">ollama serve</code> in terminal</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">3.</span>
                                <span>Pull a model: <code className="px-2 py-1 bg-secondary rounded-md font-mono text-xs">ollama pull llama2</code></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-primary">4.</span>
                                <span>Start chatting!</span>
                            </li>
                        </ol>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-border bg-secondary/30">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
