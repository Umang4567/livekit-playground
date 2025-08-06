"use client";

import { useCloud } from "@/cloud/useCloud";
import React, { createContext, useState } from "react";
import { useCallback } from "react";
import { useConfig } from "./useConfig";
import { useToast } from "@/components/toast/ToasterProvider";

export type ConnectionMode = "cloud" | "manual" | "env";

type TokenGeneratorData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (mode: ConnectionMode) => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(
  undefined,
);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { generateToken, wsUrl: cloudWSUrl } = useCloud();
  const { setToastMessage } = useToast();
  const { config } = useConfig();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
  }>({ wsUrl: "", token: "", shouldConnect: false, mode: "manual" });

  const connect = useCallback(
    async (mode: ConnectionMode) => {
      let token = "";
      let url = "";
      if (mode === "cloud") {
        try {
          token = await generateToken();
        } catch (error) {
          setToastMessage({
            type: "error",
            message:
              "Failed to generate token, you may need to increase your role in this LiveKit Cloud project.",
          });
        }
        url = cloudWSUrl;
      } else if (mode === "env") {
        if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
          throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");
        }
        url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        const body: Record<string, any> = {};
        if (config.settings.room_name) {
          body.roomName = config.settings.room_name;
        }
        if (config.settings.participant_id) {
          body.participantId = config.settings.participant_id;
        }
        if (config.settings.participant_name) {
          body.participantName = config.settings.participant_name;
        }
        if (config.settings.agent_name) {
          body.agentName = config.settings.agent_name;
        }
        if (config.settings.metadata) {
          body.metadata = config.settings.metadata;
        }
        if (config.settings.prompt) {
          body.prompt = config.settings.prompt;
        }
        if (config.settings.firstMessage) {
          body.firstMessage = config.settings.firstMessage;
        }
        if (config.settings.sttApiKey) {
          body.sttApiKey = config.settings.sttApiKey;
        }
        if (config.settings.ttsApiKey) {
          body.ttsApiKey = config.settings.ttsApiKey;
        }
        const attributesArray = Array.isArray(config.settings.attributes)
          ? config.settings.attributes
          : [];
        // Ensure tts_model and stt_model are included if set
        const ttsAttr = attributesArray.find(a => a.key === "tts_model");
        const sttAttr = attributesArray.find(a => a.key === "stt_model");
        const attributes = attributesArray.reduce(
          (acc, attr) => {
            if (attr.key) {
              acc[attr.key] = attr.value;
            }
            return acc;
          },
          {} as Record<string, string>,
        );
        if (ttsAttr && ttsAttr.value) attributes["tts_model"] = ttsAttr.value;
        if (sttAttr && sttAttr.value) attributes["stt_model"] = sttAttr.value;
        if (Object.keys(attributes).length) {
          body.attributes = attributes;
        }
        
        try {
          const response = await fetch(`/api/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token API error: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          token = result.accessToken;
        } catch (error) {
          console.error("Token generation failed:", error);
          setToastMessage({
            type: "error",
            message: `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
          return;
        }
      } else {
        token = config.settings.token;
        url = config.settings.ws_url;
      }
      setConnectionDetails({ wsUrl: url, token, shouldConnect: true, mode });
    },
    [
      cloudWSUrl,
      config.settings.token,
      config.settings.ws_url,
      config.settings.room_name,
      config.settings.participant_name,
      config.settings.agent_name,
      config.settings.participant_id,
      config.settings.metadata,
      config.settings.attributes,
      config.settings.prompt,
      config.settings.firstMessage,
      config.settings.sttApiKey,
      config.settings.ttsApiKey,
      generateToken,
      setToastMessage,
    ],
  );

  const disconnect = useCallback(async () => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};
