
"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Palette,
  Sun,
  Moon,
  Check,
  Settings
} from 'lucide-react';

const themeColors = [
  { name: 'رمادي', value: 'gray' as const, bgClass: 'bg-slate-500' },
  { name: 'أزرق', value: 'blue' as const, bgClass: 'bg-blue-500' },
  { name: 'أخضر', value: 'green' as const, bgClass: 'bg-green-500' },
  { name: 'تيل', value: 'teal' as const, bgClass: 'bg-teal-500' },
];

export default function ThemeChanger() {
  const { theme, themeColor, toggleTheme, setThemeColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-xl theme-card shadow-lg border-theme hover:shadow-xl transition-all duration-300"
        title="إعدادات الثيم"
      >
        <Settings className="h-5 w-5 text-theme-secondary" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100000]"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Panel */}
          <div className="fixed left-1/2 top-1/2 z-[100001] -translate-x-1/2 -translate-y-1/2 w-80 theme-card rounded-2xl shadow-2xl border-theme p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <Palette className="h-6 w-6 text-theme-primary" />
                <h3 className="gulf-text-lg font-bold theme-text">
                  إعدادات الثيم
                </h3>
              </div>

              {/* Dark/Light Mode Toggle */}
              <div className="space-y-3">
                <h4 className="gulf-text-base font-semibold text-theme-secondary">
                  وضع العرض
                </h4>
                <div className="action-buttons">
                  <button
                    onClick={toggleTheme}
                    className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                      theme === 'light'
                        ? 'border-theme-primary bg-theme-primary-light text-theme-primary'
                        : 'border-theme hover:border-theme-primary'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="gulf-text-sm font-medium">فاتح</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-theme-primary bg-theme-primary-light text-theme-primary'
                        : 'border-theme hover:border-theme-primary'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="gulf-text-sm font-medium">داكن</span>
                  </button>
                </div>
              </div>

              {/* Color Theme Selection */}
              <div className="space-y-3">
                <h4 className="gulf-text-base font-semibold text-theme-secondary">
                  لون الثيم
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setThemeColor(color.value)}
                      className={`relative flex flex-col items-center space-y-2 p-3 rounded-xl border-2 transition-all duration-300 ${
                        themeColor === color.value
                          ? 'border-theme-primary theme-secondary'
                          : 'border-theme hover:border-theme-primary'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bgClass} relative`}>
                        {themeColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="gulf-text-xs font-medium text-theme-secondary">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <h4 className="gulf-text-base font-semibold text-theme-secondary">
                  معاينة
                </h4>
                <div className="p-4 theme-secondary rounded-xl">
                  <div className="flex items-center space-x-3 space-x-reverse mb-3">
                    <div className="w-8 h-8 bg-theme-primary rounded-lg"></div>
                    <div>
                      <div className="gulf-text-sm font-semibold theme-text">
                        عنوان تجريبي
                      </div>
                      <div className="gulf-text-xs text-theme-muted">
                        نص فرعي تجريبي
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 px-4 btn-primary rounded-lg gulf-text-sm font-medium transition-colors">
                    زر تجريبي
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
