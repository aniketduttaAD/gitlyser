"use client";

import { LuX, LuSparkles, LuEye, LuEyeOff } from "react-icons/lu";
import { useState, useEffect } from "react";

type AISettingsProps = {
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
};

export default function AISettings({ currentKey, onSave, onClose }: AISettingsProps) {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleSave = () => {
    onSave(key);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfdad7] bg-[#e9efee]">
              <LuSparkles className="h-5 w-5 text-[#4f6d6a]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2f2a24]">Smart Summary</h2>
              <p className="text-xs text-[#6f665b]">Enhanced Analysis Settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6f665b] transition hover:bg-[#e2d6c8]"
            aria-label="Close"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-[#5b5146] mb-2">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="openai-key"
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-[#e2d6c8] bg-[#fffdf8] px-4 py-2.5 text-sm text-[#2f2a24] outline-none transition focus:border-[#4f6d6a] focus:ring-2 focus:ring-[#d7e1e0]"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="flex items-center justify-center h-[42px] w-[42px] rounded-xl border border-[#e2d6c8] bg-[#fffdf8] text-[#6f665b] transition hover:border-[#b8c6c3] hover:bg-[#f3ede4] hover:text-[#4f6d6a] flex-shrink-0"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <LuEyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <LuEye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#7a7064] leading-relaxed">
              Enable intelligent repository summaries powered by advanced analysis. Your API key is
              stored securely in your browser&apos;s local storage and never sent to our servers.
              Get your key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[#4f6d6a] hover:text-[#3f5d5a] underline font-medium"
              >
                OpenAI Platform
              </a>
              .
            </p>
            <div className="mt-2 rounded-lg border border-[#cfdad7] bg-[#e9efee] p-2 text-xs text-[#4f6d6a]">
              <p className="font-medium mb-1">🔒 Security Note:</p>
              <p>
                Your API key is encrypted and stored locally in your browser. It&apos;s never
                transmitted to our servers except when making OpenAI API requests directly from your
                browser.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-[#4f6d6a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#425b59] shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
