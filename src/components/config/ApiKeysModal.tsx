"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/button/Button";
import { TTS_PROVIDERS, STT_PROVIDERS, LLM_PROVIDERS } from "./AttributesInspector";

interface ModelApiKeys {
  [key: string]: string;
}

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
  currentTtsModel?: string;
  currentSttModel?: string;
  modalType?: 'tts' | 'stt' | 'llm';
  apiKeys: {
    llmApiKey?: string;
    sttApiKey?: string;
    ttsApiKey?: string;
    // Model-specific keys
    llmKeys?: ModelApiKeys;
    sttKeys?: ModelApiKeys;
    ttsKeys?: ModelApiKeys;
  };
  onSave: (keys: {
    llmApiKey?: string;
    sttApiKey?: string;
    ttsApiKey?: string;
    llmKeys?: ModelApiKeys;
    sttKeys?: ModelApiKeys;
    ttsKeys?: ModelApiKeys;
  }) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  themeColor,
  currentTtsModel,
  currentSttModel,
  modalType,
  apiKeys,
  onSave,
}) => {
  const [localKeys, setLocalKeys] = useState({
    llmApiKey: apiKeys.llmApiKey || "",
    sttApiKey: apiKeys.sttApiKey || "",
    ttsApiKey: apiKeys.ttsApiKey || "",
    llmKeys: apiKeys.llmKeys || {},
    sttKeys: apiKeys.sttKeys || {},
    ttsKeys: apiKeys.ttsKeys || {},
  });

  useEffect(() => {
    setLocalKeys({
      llmApiKey: apiKeys.llmApiKey || "",
      sttApiKey: apiKeys.sttApiKey || "",
      ttsApiKey: apiKeys.ttsApiKey || "",
      llmKeys: apiKeys.llmKeys || {},
      sttKeys: apiKeys.sttKeys || {},
      ttsKeys: apiKeys.ttsKeys || {},
    });
  }, [apiKeys]);

  const handleSave = () => {
    onSave(localKeys);
    onClose();
  };

  const handleClose = () => {
    setLocalKeys({
      llmApiKey: apiKeys.llmApiKey || "",
      sttApiKey: apiKeys.sttApiKey || "",
      ttsApiKey: apiKeys.ttsApiKey || "",
      llmKeys: apiKeys.llmKeys || {},
      sttKeys: apiKeys.sttKeys || {},
      ttsKeys: apiKeys.ttsKeys || {},
    });
    onClose();
  };

  if (!isOpen) return null;

  const getProviderLabel = (providers: typeof TTS_PROVIDERS, value?: string) => {
    const provider = providers.find(p => p.value === value);
    return provider ? provider.label : "Not selected";
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'tts': return `TTS API Key${currentTtsModel ? ` - ${getProviderLabel(TTS_PROVIDERS, currentTtsModel)}` : ''}`;
      case 'stt': return `STT API Key${currentSttModel ? ` - ${getProviderLabel(STT_PROVIDERS, currentSttModel)}` : ''}`;
      case 'llm': return 'LLM API Key';
      default: return 'API Keys Configuration';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">{getModalTitle()}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* LLM API Key */}
          {(!modalType || modalType === 'llm') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LLM API Key
              </label>
              <input
                type="password"
                className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter your LLM API key..."
                value={localKeys.llmApiKey}
                onChange={(e) => setLocalKeys(prev => ({ ...prev, llmApiKey: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                For language models (OpenAI, Anthropic, Google, etc.)
              </p>
            </div>
          )}

          {/* TTS API Key */}
          {(!modalType || modalType === 'tts') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                TTS API Key
                {currentTtsModel && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({getProviderLabel(TTS_PROVIDERS, currentTtsModel)})
                  </span>
                )}
              </label>
              <input
                type="password"
                className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder={currentTtsModel ? `Enter ${currentTtsModel} TTS API key...` : "Enter your TTS API key..."}
                value={currentTtsModel ? (localKeys.ttsKeys[currentTtsModel] || "") : localKeys.ttsApiKey}
                onChange={(e) => {
                  if (currentTtsModel) {
                    setLocalKeys(prev => ({
                      ...prev,
                      ttsKeys: { ...prev.ttsKeys, [currentTtsModel]: e.target.value }
                    }));
                  } else {
                    setLocalKeys(prev => ({ ...prev, ttsApiKey: e.target.value }));
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                {currentTtsModel ? `API key for ${currentTtsModel} TTS service` : "For text-to-speech services (OpenAI, Deepgram, Sarvam, etc.)"}
              </p>
            </div>
          )}

          {/* STT API Key */}
          {(!modalType || modalType === 'stt') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                STT API Key
                {currentSttModel && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({getProviderLabel(STT_PROVIDERS, currentSttModel)})
                  </span>
                )}
              </label>
              <input
                type="password"
                className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder={currentSttModel ? `Enter ${currentSttModel} STT API key...` : "Enter your STT API key..."}
                value={currentSttModel ? (localKeys.sttKeys[currentSttModel] || "") : localKeys.sttApiKey}
                onChange={(e) => {
                  if (currentSttModel) {
                    setLocalKeys(prev => ({
                      ...prev,
                      sttKeys: { ...prev.sttKeys, [currentSttModel]: e.target.value }
                    }));
                  } else {
                    setLocalKeys(prev => ({ ...prev, sttApiKey: e.target.value }));
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                {currentSttModel ? `API key for ${currentSttModel} STT service` : "For speech-to-text services (OpenAI, Deepgram, Sarvam, etc.)"}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            accentColor={themeColor}
            onClick={handleSave}
            className="flex-1"
          >
            Save Key{modalType ? '' : 's'}
          </Button>
          <Button
            accentColor="gray"
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded">
          <p className="text-xs text-yellow-200">
            <strong>Security Note:</strong> API keys are stored locally in your browser and sent to the agent for processing. 
            Never share your keys or use them in untrusted environments.
          </p>
        </div>
      </div>
    </div>
  );
};