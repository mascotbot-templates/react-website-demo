"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import {
  Alignment,
  Fit,
  MascotClient,
  MascotRive,
  useMascot,
  useMascotElevenlabs,
} from "@mascotbot-sdk/react";
import { EventType, RiveEventType } from "@rive-app/react-webgl2";
import { useDemo, type EstimateFormData } from "@/lib/demo-context";

const WIDGET_CUSTOMIZATION = {
  gender: 1,
  outline: 10,
  colourful: true,
  flip: false,
  crop: false,
  bg_color: 0,
  shirt_color: 2,
  eyes_type: 2,
  hair_style: 3,
  accessories_hue: 0,
  accessories_saturation: 0,
  accessories_brightness: 100,
};

function WidgetContent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const urlRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTime = useRef<number | null>(null);
  const isUserInitiatedEnd = useRef(false);
  const { dispatch, registerContextualUpdate } = useDemo();

  const [lipSyncConfig] = useState({
    minVisemeInterval: 40,
    mergeWindow: 60,
    keyVisemePreference: 0.6,
    preserveSilence: true,
    similarityThreshold: 0.4,
    preserveCriticalVisemes: true,
    criticalVisemeMinDuration: 80,
  });

  // @ts-ignore
  const { rive, customInputs } = useMascot();

  const conversation = useConversation({
    clientTools: {
      navigateTo: (params: { page: string }) => {
        console.log("[Widget] navigateTo:", params.page);
        dispatch({ type: "NAVIGATE_TO", page: params.page });
      },
      updateEstimateField: (params: { field: string; value: string }) => {
        console.log("[Widget] updateEstimateField:", params.field, "=", params.value);
        const validFields: (keyof EstimateFormData)[] = [
          "name", "email", "phone", "origin", "destination", "moveDate", "homeSize", "specialItems"
        ];
        if (validFields.includes(params.field as keyof EstimateFormData)) {
          dispatch({
            type: "UPDATE_ESTIMATE_FIELD",
            field: params.field as keyof EstimateFormData,
            value: params.value,
            source: "agent",
          });
        }
      },
      submitEstimate: async () => {
        console.log("[Widget] submitEstimate");
        dispatch({ type: "SUBMIT_ESTIMATE" });
        return "Estimate submitted successfully! The user can see a confirmation on their screen.";
      },
    },
    onConnect: () => {
      console.log("[Widget] Connected");
      setIsConnecting(false);
      if (customInputs?.is_connected) customInputs.is_connected.value = true;
      if (customInputs?.is_connecting) customInputs.is_connecting.value = false;
      if (connectionStartTime.current) {
        console.log(`[Widget] Connected in ${Date.now() - connectionStartTime.current}ms`);
        connectionStartTime.current = null;
      }
    },
    onDisconnect: () => {
      console.log("[Widget] Disconnected");
      setIsConnecting(false);
      if (customInputs?.is_connected) customInputs.is_connected.value = false;
      if (customInputs?.is_connecting) customInputs.is_connecting.value = false;
      if (!isUserInitiatedEnd.current && customInputs?.hit) customInputs.hit.fire();
      isUserInitiatedEnd.current = false;
    },
    onError: (error: any) => {
      console.error("[Widget] Error:", error);
      setIsConnecting(false);
      if (customInputs?.is_connected) customInputs.is_connected.value = false;
      if (customInputs?.is_connecting) customInputs.is_connecting.value = false;
    },
    onMessage: () => {},
    onDebug: () => {},
  });

  // Register sendContextualUpdate so form components can notify the agent
  useEffect(() => {
    registerContextualUpdate((text: string) => {
      if (conversation.status === "connected") {
        console.log("[Widget] Sending contextual update:", text);
        conversation.sendContextualUpdate(text);
      }
    });
    return () => registerContextualUpdate(null);
  }, [conversation, registerContextualUpdate]);

  useMascotElevenlabs({
    conversation,
    debug: false,
    gesture: true,
    naturalLipSync: true,
    naturalLipSyncConfig: lipSyncConfig,
  });

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch("/api/get-signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({ dynamicVariables: {} }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed to get signed url: ${response.statusText}`);
    const data = await response.json();
    return data.signedUrl;
  };

  const fetchAndCacheUrl = useCallback(async () => {
    try {
      const url = await getSignedUrl();
      setCachedUrl(url);
    } catch (error) {
      console.error("[Widget] Failed to fetch signed URL:", error);
      setCachedUrl(null);
    }
  }, []);

  useEffect(() => {
    fetchAndCacheUrl();
    urlRefreshInterval.current = setInterval(() => fetchAndCacheUrl(), 9 * 60 * 1000);
    return () => {
      if (urlRefreshInterval.current) clearInterval(urlRefreshInterval.current);
    };
  }, [fetchAndCacheUrl]);

  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      connectionStartTime.current = Date.now();
      if (customInputs?.is_connecting) customInputs.is_connecting.value = true;
      await navigator.mediaDevices.getUserMedia({ audio: true });
      let signedUrl = cachedUrl;
      if (!signedUrl) signedUrl = await getSignedUrl();
      if (!signedUrl) throw new Error("Missing signed URL");
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error("[Widget] Failed to start:", error);
      setIsConnecting(false);
      connectionStartTime.current = null;
      if (customInputs?.is_connecting) customInputs.is_connecting.value = false;
    }
  }, [conversation, cachedUrl, customInputs]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Apply widget customization
  useEffect(() => {
    if (!customInputs) return;
    Object.entries(WIDGET_CUSTOMIZATION).forEach(([key, value]) => {
      if (customInputs[key]) customInputs[key].value = value;
    });
    if (customInputs.character) customInputs.character.value = WIDGET_CUSTOMIZATION.gender;
  }, [customInputs]);

  // Fire reveal trigger
  useEffect(() => {
    if (!rive || !customInputs) return;
    const timer = setTimeout(() => {
      if (customInputs?.reveal) customInputs.reveal.fire();
    }, 1000);
    return () => clearTimeout(timer);
  }, [rive, customInputs]);

  // Rive event listeners (startCall/endCall)
  useEffect(() => {
    if (!rive) return;
    const onRiveEvent = (riveEvent: any) => {
      const eventData = riveEvent.data;
      if (eventData.type === RiveEventType.General) {
        if (eventData.name === "startCall" && conversation.status !== "connected" && !isConnecting) {
          startConversation();
        } else if (eventData.name === "endCall" && conversation.status === "connected") {
          isUserInitiatedEnd.current = true;
          stopConversation();
        }
      }
    };
    rive.on(EventType.RiveEvent, onRiveEvent);
    return () => { rive.off(EventType.RiveEvent, onRiveEvent); };
  }, [rive, conversation.status, isConnecting, startConversation, stopConversation]);

  return null;
}

export function PersistentWidget() {
  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none" style={{ width: 300, height: 380 }}>
      <div className="w-full h-full pointer-events-auto">
        <MascotClient
          src="/mascot_widget.riv"
          artboard="Widget"
          shouldDisableRiveListeners={false}
          inputs={[
            "gesture", "is_speaking", "is_connected", "is_connecting", "reveal", "hit",
            "gender", "character", "outline", "colourful", "flip", "crop", "bg_color",
            "shirt_color", "eyes_type", "hair_style",
            "accessories_hue", "accessories_saturation", "accessories_brightness",
          ]}
          layout={{ fit: Fit.Contain, alignment: Alignment.BottomRight }}
        >
          <WidgetContent />
          <MascotRive showLoadingSpinner={false} />
        </MascotClient>
      </div>
    </div>
  );
}
