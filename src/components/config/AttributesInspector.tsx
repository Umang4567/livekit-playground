import React, { useState, useCallback, useEffect, useRef } from "react";
import { ConnectionState } from "livekit-client";
import { AttributeItem } from "@/lib/types";
import { Button } from "@/components/button/Button";
import { useLocalParticipant } from "@livekit/components-react";
import { AttributeRow } from "./AttributeRow";
import { ApiKeysModal } from "./ApiKeysModal";

interface AttributesInspectorProps {
  attributes: AttributeItem[];
  onAttributesChange: (attributes: AttributeItem[]) => void;
  themeColor: string;
  disabled?: boolean;
  connectionState?: ConnectionState;
  metadata?: string;
  onMetadataChange?: (metadata: string) => void;
  apiKeys?: {
    llmApiKey?: string;
    sttApiKey?: string;
    ttsApiKey?: string;
    llmKeys?: { [key: string]: string };
    sttKeys?: { [key: string]: string };
    ttsKeys?: { [key: string]: string };
  };
  onApiKeysSave?: (keys: {
    llmApiKey?: string;
    sttApiKey?: string;
    ttsApiKey?: string;
    llmKeys?: { [key: string]: string };
    sttKeys?: { [key: string]: string };
    ttsKeys?: { [key: string]: string };
  }) => void;
}

export const LLM_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
];

export const STT_PROVIDERS = [
  { label: "AssemblyAI", value: "assemblyai" },
  { label: "Cartesia", value: "cartesia" },
  { label: "Deepgram", value: "deepgram" },
  { label: "Fal", value: "fal" },
  { label: "Groq", value: "groq" },
  { label: "OpenAI", value: "openai" },
  { label: "Sarvam", value: "sarvam" },
];

export const TTS_PROVIDERS = [
  { label: "Cartesia", value: "cartesia" },
  { label: "Deepgram", value: "deepgram" },
  { label: "ElevenLabs", value: "elevenlabs" },
  { label: "Groq", value: "groq" },
  { label: "OpenAI", value: "openai" },
  { label: "PlayHT", value: "playht" },
  { label: "Sarvam", value: "sarvam" },
];

// Model ID constants removed - users can now input any model name manually

export const AttributesInspector: React.FC<AttributesInspectorProps> = ({
  attributes,
  onAttributesChange,
  themeColor,
  disabled = false,
  connectionState,
  metadata,
  onMetadataChange,
  apiKeys,
  onApiKeysSave,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [apiKeyModalType, setApiKeyModalType] = useState<"tts" | "stt" | "llm">(
    "tts"
  );
  const [localAttributes, setLocalAttributes] =
    useState<AttributeItem[]>(attributes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSyncFlash, setShowSyncFlash] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const syncFlashTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local attributes when props change
  useEffect(() => {
    setLocalAttributes(attributes);
  }, [attributes]);

  const syncAttributesWithRoom = useCallback(() => {
    if (!localParticipant || connectionState !== ConnectionState.Connected)
      return;

    const attributesMap = localAttributes.reduce(
      (acc, attr) => {
        if (attr.key && attr.key.trim() !== "") {
          acc[attr.key] = attr.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    localParticipant.setAttributes(attributesMap);
    setHasUnsavedChanges(false);
    setShowSyncFlash(true);
    if (syncFlashTimeoutRef.current) {
      clearTimeout(syncFlashTimeoutRef.current);
    }
    syncFlashTimeoutRef.current = setTimeout(
      () => setShowSyncFlash(false),
      1000
    );
  }, [localAttributes, localParticipant, connectionState]);

  // Handle debounced sync
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (connectionState === ConnectionState.Connected && localParticipant) {
        syncAttributesWithRoom();
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    hasUnsavedChanges,
    syncAttributesWithRoom,
    connectionState,
    localParticipant,
  ]);

  const handleKeyChange = (id: string, newKey: string) => {
    const updatedAttributes = localAttributes.map((attr) =>
      attr.id === id ? { ...attr, key: newKey } : attr
    );
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected && newKey.trim() !== "") {
      setHasUnsavedChanges(true);
    }
  };

  const handleValueChange = (id: string, newValue: string) => {
    const updatedAttributes = localAttributes.map((attr) =>
      attr.id === id ? { ...attr, value: newValue } : attr
    );
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveAttribute = (id: string) => {
    const updatedAttributes = localAttributes.filter((attr) => attr.id !== id);
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleAddAttribute = () => {
    const newId = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedAttributes = [
      ...localAttributes,
      { id: newId, key: "", value: "" },
    ];
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  // Find current provider and model IDs from attributes
  const ttsProvider =
    localAttributes.find((a) => a.key === "tts_provider")?.value || "";
  const ttsModelId =
    localAttributes.find((a) => a.key === "tts_model_id")?.value || "";
  const sttProvider =
    localAttributes.find((a) => a.key === "stt_provider")?.value || "";
  const sttModelId =
    localAttributes.find((a) => a.key === "stt_model_id")?.value || "";
  const llmProvider =
    localAttributes.find((a) => a.key === "llm_provider")?.value || "";
  const llmModelId =
    localAttributes.find((a) => a.key === "llm_model_id")?.value || "";

  const handleTTSProviderChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "tts_provider" && attr.key !== "tts_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `tts_provider_${Date.now()}`,
        key: "tts_provider",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleTTSModelIdChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "tts_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `tts_model_id_${Date.now()}`,
        key: "tts_model_id",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };
  const handleSTTProviderChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "stt_provider" && attr.key !== "stt_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `stt_provider_${Date.now()}`,
        key: "stt_provider",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleSTTModelIdChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "stt_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `stt_model_id_${Date.now()}`,
        key: "stt_model_id",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleLLMProviderChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "llm_provider" && attr.key !== "llm_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `llm_provider_${Date.now()}`,
        key: "llm_provider",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleLLMModelIdChange = (value: string) => {
    let updatedAttributes = localAttributes.filter(
      (attr) => attr.key !== "llm_model_id"
    );
    if (value) {
      updatedAttributes.push({
        id: `llm_model_id_${Date.now()}`,
        key: "llm_model_id",
        value,
      });
    }
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-sm text-gray-500">Attributes</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isExpanded && (
        <div className="border border-gray-800 rounded-sm bg-gray-900/30 p-3 mb-2">
          {/* LLM Provider and Model ID */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">LLM Provider</label>
              {onApiKeysSave && llmProvider && (
                <button
                  onClick={() => {
                    setApiKeyModalType("llm");
                    setShowApiKeysModal(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z"
                    />
                  </svg>
                  API Key
                </button>
              )}
            </div>
            <select
              className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1 mb-2"
              value={llmProvider}
              onChange={(e) => handleLLMProviderChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select LLM Provider</option>
              {LLM_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {llmProvider && (
              <input
                type="text"
                className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1"
                placeholder={`Enter ${llmProvider} model name (e.g., ${llmProvider === "openai" ? "gpt-4o, gpt-4-turbo" : llmProvider === "groq" ? "llama-3.1-70b-versatile, mixtral-8x7b" : "model-name"})`}
                value={llmModelId}
                onChange={(e) => handleLLMModelIdChange(e.target.value)}
                disabled={disabled}
              />
            )}
          </div>
          {/* TTS Provider and Model ID */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">TTS Provider</label>
              {onApiKeysSave && ttsProvider && (
                <button
                  onClick={() => {
                    setApiKeyModalType("tts");
                    setShowApiKeysModal(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z"
                    />
                  </svg>
                  API Key
                </button>
              )}
            </div>
            <select
              className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1 mb-2"
              value={ttsProvider}
              onChange={(e) => handleTTSProviderChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select TTS Provider</option>
              {TTS_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {ttsProvider && (
              <input
                type="text"
                className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1"
                placeholder={`Enter ${ttsProvider} model name (e.g., ${ttsProvider === "openai" ? "tts-1, tts-1-hd" : ttsProvider === "elevenlabs" ? "eleven_multilingual_v2" : ttsProvider === "cartesia" ? "sonic-english" : ttsProvider === "deepgram" ? "aura-asteria-en" : ttsProvider === "playht" ? "PlayHT2.0-turbo" : ttsProvider === "sarvam" ? "bulbul" : "model-name"})`}
                value={ttsModelId}
                onChange={(e) => handleTTSModelIdChange(e.target.value)}
                disabled={disabled}
              />
            )}
          </div>
          {/* STT Provider and Model ID */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">STT Provider</label>
              {onApiKeysSave && sttProvider && (
                <button
                  onClick={() => {
                    setApiKeyModalType("stt");
                    setShowApiKeysModal(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z"
                    />
                  </svg>
                  API Key
                </button>
              )}
            </div>
            <select
              className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1 mb-2"
              value={sttProvider}
              onChange={(e) => handleSTTProviderChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select STT Provider</option>
              {STT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {sttProvider && (
              <input
                type="text"
                className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-1"
                placeholder={`Enter ${sttProvider} model name (e.g., ${sttProvider === "openai" ? "whisper-1" : sttProvider === "deepgram" ? "nova-2" : sttProvider === "assemblyai" ? "best" : sttProvider === "groq" ? "whisper-large-v3" : sttProvider === "fal" ? "whisper" : sttProvider === "cartesia" ? "raman" : sttProvider === "sarvam" ? "saarika:v1" : "model-name"})`}
                value={sttModelId}
                onChange={(e) => handleSTTModelIdChange(e.target.value)}
                disabled={disabled}
              />
            )}
          </div>
          {disabled &&
            (localAttributes.filter(
              (attr) =>
                ![
                  "tts_provider",
                  "tts_model_id",
                  "stt_provider",
                  "stt_model_id",
                  "llm_provider",
                  "llm_model_id",
                ].includes(attr.key)
            ).length === 0 ? (
              <div className="text-sm text-gray-400 font-sans">
                No custom attributes set
              </div>
            ) : (
              localAttributes
                .filter(
                  (attr) =>
                    ![
                      "tts_provider",
                      "tts_model_id",
                      "stt_provider",
                      "stt_model_id",
                      "llm_provider",
                      "llm_model_id",
                    ].includes(attr.key)
                )
                .map((attribute) => (
                  <AttributeRow
                    key={attribute.id}
                    attribute={attribute}
                    onKeyChange={handleKeyChange}
                    onValueChange={handleValueChange}
                    disabled={true}
                  />
                ))
            ))}
        </div>
      )}
      <>
        <div
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
        >
          <div className="text-sm text-gray-500">Metadata</div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-500 transition-transform ${isMetadataExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {isMetadataExpanded &&
          (disabled || connectionState === ConnectionState.Connected ? (
            <div className="border border-gray-800 rounded-sm bg-gray-900/30 px-3 py-2 mb-4 min-h-[40px] flex items-center">
              {metadata ? (
                <pre className="w-full text-gray-400 text-xs bg-transparent font-mono whitespace-pre-wrap break-words m-0 p-0 border-0">
                  {metadata}
                </pre>
              ) : (
                <div className="text-sm text-gray-400 font-sans w-full text-left">
                  No metadata set
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={metadata}
              onChange={(e) => onMetadataChange?.(e.target.value)}
              className="w-full text-gray-400 text-sm bg-transparent border border-gray-800 rounded-sm px-3 py-2 font-mono mb-4"
              placeholder="Enter metadata..."
              rows={3}
            />
          ))}
      </>

      {/* API Keys Modal */}
      {showApiKeysModal && onApiKeysSave && (
        <ApiKeysModal
          isOpen={showApiKeysModal}
          onClose={() => setShowApiKeysModal(false)}
          themeColor={themeColor}
          currentTtsModel={apiKeyModalType === "tts" ? ttsProvider : undefined}
          currentSttModel={apiKeyModalType === "stt" ? sttProvider : undefined}
          modalType={apiKeyModalType}
          apiKeys={apiKeys || {}}
          onSave={(keys) => {
            onApiKeysSave(keys);
            setShowApiKeysModal(false);
          }}
        />
      )}
    </div>
  );
};
