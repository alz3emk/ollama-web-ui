'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { fileToBase64, isVisionModel } from '../lib/ollama';
import { useLanguage } from '../hooks/useLanguage';

interface UploadedFile {
    file: File;
    preview: string;
    base64: string;
}

interface ChatInputProps {
    onSend: (message: string, images?: string[]) => void;
    isLoading: boolean;
    isConnected: boolean;
    selectedModel: string;
}

export function ChatInput({
    onSend,
    isLoading,
    isConnected,
    selectedModel,
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, direction } = useLanguage();

    const isVision = isVisionModel(selectedModel);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadedFile[] = [];

        for (const file of Array.from(files)) {
            // Only accept images
            if (!file.type.startsWith('image/')) {
                continue;
            }

            try {
                const base64 = await fileToBase64(file);
                const preview = URL.createObjectURL(file);
                newFiles.push({ file, preview, base64 });
            } catch (error) {
                console.error('Error processing file:', error);
            }
        }

        setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 4)); // Max 4 images
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if ((input.trim() || uploadedFiles.length > 0) && !isLoading && isConnected) {
            const images = uploadedFiles.map(f => f.base64);
            onSend(input || 'What is in this image?', images.length > 0 ? images : undefined);
            setInput('');
            // Clean up previews
            uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
            setUploadedFiles([]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    return (
        <div className="border-t border-border bg-background/80 backdrop-blur-xl p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="relative group rounded-xl overflow-hidden border border-border bg-card"
                            >
                                <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="w-20 h-20 object-cover"
                                />
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                                    <p className="text-[10px] text-white truncate">{file.file.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Vision Model Indicator */}
                {isVision && (
                    <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg">
                        <ImageIcon className="w-4 h-4" />
                        <span>{t('chat.visionDetected')}</span>
                    </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSubmit}>
                    <div
                        className={`relative flex items-end bg-card rounded-2xl border transition-all shadow-sm hover:shadow-md ${isDragging
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                            } ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* File Upload Button */}
                        <div className="p-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!isConnected || isLoading}
                                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Upload image"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                !isConnected
                                    ? t('chat.noConnection')
                                    : uploadedFiles.length > 0
                                        ? t('chat.placeholderWithImage')
                                        : t('chat.placeholder')
                            }
                            disabled={!isConnected || isLoading}
                            rows={1}
                            className={`flex-1 py-4 bg-transparent resize-none focus:outline-none disabled:opacity-50 text-base placeholder:text-muted-foreground ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                            style={{ minHeight: '56px', maxHeight: '200px' }}
                            dir={direction}
                        />
                        <div className="p-2">
                            <button
                                type="submit"
                                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || !isConnected}
                                className="p-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-md disabled:bg-gradient-to-r disabled:from-zinc-400 disabled:via-zinc-500 disabled:to-zinc-400 dark:disabled:from-zinc-600 dark:disabled:via-zinc-700 dark:disabled:to-zinc-600"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Drag & Drop Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary pointer-events-none">
                            <div className="text-center">
                                <ImageIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                                <p className="font-medium text-primary">{t('image.dropHere')}</p>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer text */}
                <p className={`text-xs !text-center text-muted-foreground ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                    Developed with ❤️ by   <a className='font-bold' href='https://habsi.net/' target='_blank' rel='noopener noreferrer'>Habsi</a>
                </p>
            </div>
        </div>
    );
}
