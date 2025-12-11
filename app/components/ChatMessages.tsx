'use client';

import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChatMessage } from '../lib/ollama';
import { useLanguage } from '../hooks/useLanguage';

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSuggestionClick?: (suggestion: string) => void;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
    const [copied, setCopied] = useState(false);
    const language = className?.replace('language-', '') || 'text';
    const { t } = useLanguage();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
                <span className="text-xs text-muted-foreground font-mono font-medium">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-background"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={atomOneDark}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                }}
                showLineNumbers={children.split('\n').length > 10}
                wrapLines
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const { direction } = useLanguage();
    const isUser = message.role === 'user';
    const hasImages = message.images && message.images.length > 0;

    return (
        <div className={`flex gap-4 ${isUser ? (direction === 'rtl' ? 'flex-row' : 'flex-row-reverse') : ''}`}>
            <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${isUser
                    ? 'bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500'
                    : 'bg-linear-to-br from-zinc-600 to-zinc-800 dark:from-zinc-700 dark:to-zinc-900'
                    }`}
            >
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : (
                    <Bot className="w-5 h-5 text-white" />
                )}
            </div>

            <div className={`flex-1 max-w-[85%] ${isUser ? (direction === 'rtl' ? 'flex flex-col items-start' : 'flex flex-col items-end') : ''}`}>
                {/* Display images if present */}
                {hasImages && (
                    <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? (direction === 'rtl' ? 'justify-start' : 'justify-end') : 'justify-start'}`}>
                        {message.images!.map((base64, index) => (
                            <div
                                key={index}
                                className="relative rounded-xl overflow-hidden border border-border shadow-sm"
                            >
                                <img
                                    src={`data:image/jpeg;base64,${base64}`}
                                    alt={`Uploaded image ${index + 1}`}
                                    className="max-w-[200px] max-h-[200px] object-cover"
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3 text-white" />
                                    <span className="text-[10px] text-white font-medium">Image</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    className={`inline-block px-5 py-3.5 rounded-2xl shadow-sm ${isUser
                        ? 'bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-tr-md'
                        : 'bg-card border border-border text-card-foreground rounded-tl-md'
                        }`}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                        <div className={`prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-relaxed prose-headings:font-semibold ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, className, children, ...props }) {
                                        const isInline = !className;
                                        if (isInline) {
                                            return (
                                                <code className="px-1.5 py-0.5 bg-secondary text-primary rounded font-mono text-sm" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return (
                                            <CodeBlock className={className}>
                                                {String(children).replace(/\n$/, '')}
                                            </CodeBlock>
                                        );
                                    },
                                    pre({ children }) {
                                        return <>{children}</>;
                                    },
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ChatMessages({ messages, isLoading, onSuggestionClick }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t, direction } = useLanguage();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const suggestions = [
        { text: t('chat.welcome'), icon: '🤖' },
        { text: 'Write a Python function', icon: '🐍' },
        { text: 'Help me debug my code', icon: '🐛' },
        { text: 'Create a React component', icon: '⚛️' },
    ];

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl glow">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-linear-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                </div>

                <h2 className={`text-3xl font-bold mb-3 ${direction === 'rtl' ? 'gradient-text-rtl' : 'gradient-text'}`}>
                    {t('chat.welcome')}
                </h2>
                <p className={`text-muted-foreground max-w-md text-lg ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {t('chat.description')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-xl w-full">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.text}
                            onClick={() => onSuggestionClick?.(suggestion.text)}
                            className="group flex items-center gap-3 px-5 py-4 text-left bg-card hover:bg-secondary rounded-2xl transition-all border border-border hover:border-primary/30 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="text-2xl">{suggestion.icon}</span>
                            <span className="font-medium text-sm">{suggestion.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-zinc-600 to-zinc-800 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-card border border-border rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }} />
                                <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
