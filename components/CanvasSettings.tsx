

import React from 'react';
import type { WheelAction } from '../types';

interface CanvasSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    canvasBackgroundColor: string;
    onCanvasBackgroundColorChange: (color: string) => void;
    language: 'en' | 'zho';
    setLanguage: (lang: 'en' | 'zho') => void;
    uiTheme: { color: string; opacity: number };
    setUiTheme: (theme: { color: string; opacity: number }) => void;
    buttonTheme: { color: string; opacity: number };
    setButtonTheme: (theme: { color: string; opacity: number }) => void;
    wheelAction: WheelAction;
    setWheelAction: (action: WheelAction) => void;
    t: (key: string) => string;
    apiKey: string;
    setApiKey: (key: string) => void;
    
}

export const CanvasSettings: React.FC<CanvasSettingsProps> = ({
    isOpen,
    onClose,
    canvasBackgroundColor,
    onCanvasBackgroundColorChange,
    language,
    setLanguage,
    uiTheme,
    setUiTheme,
    buttonTheme,
    setButtonTheme,
    wheelAction,
    setWheelAction,
    t,
    apiKey,
    setApiKey
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="relative pod-panel p-6 flex flex-col space-y-4 w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-lg" style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{t('settings.title')}</h3>
                    <button onClick={onClose} aria-label={t('settings.close')} className="pod-icon-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="-mx-6" style={{ borderTop: '1px solid var(--border-color)' }}></div>

                <div className="space-y-2">
                    <label className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.apiKey')}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t('settings.apiKeyPlaceholder')}
                            className="flex-1 p-2 rounded-md border bg-gray-50"
                        />
                        <button
                            onClick={onClose}
                            className="pod-primary-button"
                        >
                            {t('settings.apiKeySave')}
                        </button>
                    </div>
                </div>

                {/* Language Settings */}
                <div className="space-y-2">
                    <label className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.language')}</label>
                    <div className="flex items-center gap-2 p-1 rounded-md">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`flex-1 text-sm pod-chip ${language === 'en' ? 'active' : ''}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('zho')}
                            className={`flex-1 text-sm pod-chip ${language === 'zho' ? 'active' : ''}`}
                        >
                            中文
                        </button>
                    </div>
                </div>

                

                {/* UI Theme Settings */}
                <div className="space-y-3">
                    <h4 className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.uiTheme')}</h4>
                    <div className="flex items-center justify-between">
                        <label htmlFor="ui-color" className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('settings.color')}</label>
                        <input
                            id="ui-color"
                            type="color"
                            value={uiTheme.color}
                            onChange={(e) => setUiTheme({ ...uiTheme, color: e.target.value })}
                            className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-3">
                        <label htmlFor="ui-opacity" className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('settings.opacity')}</label>
                        <input
                            id="ui-opacity"
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={uiTheme.opacity}
                            onChange={(e) => setUiTheme({ ...uiTheme, opacity: parseFloat(e.target.value) })}
                            className="w-32"
                        />
                         <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{Math.round(uiTheme.opacity * 100)}%</span>
                    </div>
                </div>

                <div className="-mx-6" style={{ borderTop: '1px solid var(--border-color)' }}></div>

                {/* Button Theme Settings */}
                <div className="space-y-3">
                    <h4 className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.actionButtonsTheme')}</h4>
                    <div className="flex items-center justify-between">
                        <label htmlFor="button-color" className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('settings.color')}</label>
                        <input
                            id="button-color"
                            type="color"
                            value={buttonTheme.color}
                            onChange={(e) => setButtonTheme({ ...buttonTheme, color: e.target.value })}
                            className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-3">
                        <label htmlFor="button-opacity" className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('settings.opacity')}</label>
                        <input
                            id="button-opacity"
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={buttonTheme.opacity}
                            onChange={(e) => setButtonTheme({ ...buttonTheme, opacity: parseFloat(e.target.value) })}
                            className="w-32"
                        />
                         <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{Math.round(buttonTheme.opacity * 100)}%</span>
                    </div>
                </div>

                <div className="-mx-6" style={{ borderTop: '1px solid var(--border-color)' }}></div>
                
                {/* Mouse Wheel Settings */}
                <div className="space-y-2">
                    <label className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.mouseWheel')}</label>
                    <div className="flex items-center gap-2 p-1 rounded-md">
                        <button 
                            onClick={() => setWheelAction('zoom')}
                            className={`flex-1 text-sm pod-chip ${wheelAction === 'zoom' ? 'active' : ''}`}
                        >
                            {t('settings.zoom')}
                        </button>
                        <button 
                            onClick={() => setWheelAction('pan')}
                            className={`flex-1 text-sm pod-chip ${wheelAction === 'pan' ? 'active' : ''}`}
                        >
                            {t('settings.scroll')}
                        </button>
                    </div>
                </div>


                {/* Canvas Settings */}
                <div className="space-y-3">
                     <h4 className="text-sm" style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{t('settings.canvas')}</h4>
                    <div className="flex items-center justify-between">
                        <label htmlFor="bg-color" className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('settings.backgroundColor')}</label>
                        <input
                            id="bg-color"
                            type="color"
                            value={canvasBackgroundColor}
                            onChange={(e) => onCanvasBackgroundColorChange(e.target.value)}
                            className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
