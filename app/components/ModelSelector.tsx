'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { OllamaModel } from '../lib/ollama';

interface ModelSelectorProps {
    models: OllamaModel[];
    selectedModels: string[];
    onToggleModel: (modelName: string) => void;
    isConnected: boolean;
}

export function ModelSelector({
    models,
    selectedModels,
    onToggleModel,
    isConnected,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleModelClick = (modelName: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Model clicked:', modelName);
        onToggleModel(modelName);
    };

    return (
        <div className="relative flex-1" ref={dropdownRef}>
            <button
                onClick={() => {
                    console.log('Dropdown button clicked, currently open:', isOpen);
                    setIsOpen(!isOpen);
                }}
                disabled={!isConnected || models.length === 0}
                className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 cursor-pointer hover:bg-secondary transition-colors text-left flex items-center justify-between"
            >
                <span className="truncate">
                    {selectedModels.length === 0
                        ? 'No models selected'
                        : selectedModels.length === 1
                            ? selectedModels[0]
                            : `${selectedModels.length} models selected`}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    {models.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            No models available
                        </div>
                    ) : (
                        models.map((model) => (
                            <div
                                key={model.name}
                                onClick={(e) => handleModelClick(model.name, e)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-3 border-b border-border/50 last:border-b-0 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedModels.includes(model.name)}
                                    onChange={() => { }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded cursor-pointer"
                                />
                                <span className="flex-1 truncate">{model.name}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}