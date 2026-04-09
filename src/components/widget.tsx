"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import {
  Alignment,
  Fit,
  MascotClient,
  MascotProvider,
  MascotRive,
  useMascot,
  useMascotElevenlabs,
} from "@mascotbot-sdk/react";
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

const LIP_SYNC_CONFIG = {
  minVisemeInterval: 40,
  mergeWindow: 60,
  keyVisemePreference: 0.6,
  preserveSilence: true,
  similarityThreshold: 0.4,
  preserveCriticalVisemes: true,
  criticalVisemeMinDuration: 80,
};

// Delay before button appears after reveal fires (ms)
const BUTTON_APPEAR_AFTER_REVEAL = 4100;
// Bounce animation duration (ms)
const BUTTON_BOUNCE_DURATION = 450;

type CallState = "idle" | "connecting" | "connected";

interface WidgetActions {
  start: () => void;
  end: () => void;
}

// Hoisted static SVG elements — avoids re-creation on every render
const phoneIconJsx = (
  <svg width="11" height="11" viewBox="0 0 11.1 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M2.91 8.1C1.3 6.5 0 4.4 0 2.63 0 1.86.25 1.14.83.56 1.2.2 1.6 0 1.97 0c.32 0 .62.14.85.47L3.05 2.23c.14.2.23.4.23.62 0 .25-.12.53-.4.85l-.44.5c-.07.06-.09.13-.09.2 0 .06.02.12.05.19.15.35.64 1.03 1.3 1.7.68.67 1.37 1.14 1.7 1.31.07.03.15.06.21.06.09 0 .17-.03.23-.09l.47-.45c.3-.28.58-.4.84-.4.21 0 .42.09.61.22l1.88 1.31c.31.22.42.48.42.74 0 .42-.3.86-.59 1.14-.58.59-1.27.87-2.1.87-1.78 0-3.87-1.31-5.46-2.9Z" fill="white"/>
  </svg>
);

const loaderIconJsx = (
  <svg width="17.5" height="17.5" viewBox="0 0 17.5 17.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ animation: "spin 2.5s linear infinite" }}>
    <path d="M7.93 15.29v-2.18c0-.44.36-.8.8-.8s.8.36.8.8v2.18c0 .44-.36.8-.8.8s-.8-.36-.8-.8Zm-2.86-4.02a.8.8 0 0 1 1.13 0 .8.8 0 0 1 0 1.13l-1.56 1.56a.8.8 0 0 1-1.13 0 .8.8 0 0 1 0-1.13l1.56-1.56Zm6.18 0a.8.8 0 0 1 1.13 0l1.57 1.56a.8.8 0 0 1-1.13 1.13l-1.57-1.56a.8.8 0 0 1 0-1.13ZM4.37 7.94a.8.8 0 0 1-.8.8H1.38a.8.8 0 0 1 0-1.6h2.18a.8.8 0 0 1 .8.8Zm10.91 0a.8.8 0 0 1-.8.8h-2.18a.8.8 0 0 1 0-1.6h2.18a.8.8 0 0 1 .8.8ZM3.51 3.52a.8.8 0 0 1 1.13 0l1.57 1.56a.8.8 0 0 1-1.13 1.13L3.51 4.65a.8.8 0 0 1 0-1.13Zm9.31 0a.8.8 0 0 1 1.13 0 .8.8 0 0 1 0 1.13l-1.56 1.56a.8.8 0 0 1-1.13-1.13l1.56-1.56ZM7.93 4.37V2.19a.8.8 0 0 1 1.6 0v2.18a.8.8 0 0 1-1.6 0Z" fill="white"/>
  </svg>
);

function CallButton({
  callState,
  onStart,
  onEnd,
  revealedAt,
}: {
  callState: CallState;
  onStart: () => void;
  onEnd: () => void;
  revealedAt: number | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!revealedAt) return;
    const elapsed = Date.now() - revealedAt;
    const remaining = Math.max(0, BUTTON_APPEAR_AFTER_REVEAL - elapsed);
    const timer = setTimeout(() => setVisible(true), remaining);
    return () => clearTimeout(timer);
  }, [revealedAt]);

  if (!visible) return null;

  const isEndCall = callState === "connected";
  const isConnecting = callState === "connecting";

  return (
    <button
      onClick={isEndCall ? onEnd : onStart}
      disabled={isConnecting}
      className="flex items-center justify-center overflow-clip rounded-[43.902px] text-[14px] font-medium uppercase text-white transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-60 select-none"
      style={{
        backgroundColor: isEndCall ? "#d03318" : "#1f1d22",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.14px",
        lineHeight: "19.105px",
        gap: isEndCall ? "5.268px" : "2px",
        padding: "8px 11px",
        pointerEvents: "auto",
        animation: `bounceIn ${BUTTON_BOUNCE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
      }}
    >
      {isConnecting ? loaderIconJsx : phoneIconJsx}
      <span>
        {isEndCall ? "End Call" : isConnecting ? "Connecting" : "Voice Chat"}
      </span>
    </button>
  );
}

function WidgetContent({
  onCallStateChange,
  actionsRef,
  onReveal,
}: {
  onCallStateChange: (state: CallState) => void;
  actionsRef: React.MutableRefObject<WidgetActions>;
  onReveal: () => void;
}) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const urlRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTime = useRef<number | null>(null);
  const { dispatch, registerContextualUpdate } = useDemo();

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
      onCallStateChange("connected");
      if (customInputs?.inCall) customInputs.inCall.value = true;
      if (connectionStartTime.current) {
        console.log(`[Widget] Connected in ${Date.now() - connectionStartTime.current}ms`);
        connectionStartTime.current = null;
      }
    },
    onDisconnect: () => {
      console.log("[Widget] Disconnected");
      onCallStateChange("idle");
      if (customInputs?.inCall) customInputs.inCall.value = false;
    },
    onError: (error: any) => {
      console.error("[Widget] Error:", error);
      onCallStateChange("idle");
      if (customInputs?.inCall) customInputs.inCall.value = false;
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
    naturalLipSyncConfig: LIP_SYNC_CONFIG,
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
      onCallStateChange("connecting");
      connectionStartTime.current = Date.now();
      // Parallelize mic permission + URL fetch
      const [, signedUrl] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        cachedUrl ? Promise.resolve(cachedUrl) : getSignedUrl(),
      ]);
      if (!signedUrl) throw new Error("Missing signed URL");
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error("[Widget] Failed to start:", error);
      onCallStateChange("idle");
      connectionStartTime.current = null;
    }
  }, [conversation, cachedUrl, onCallStateChange]);

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

  // Fire reveal trigger — once only
  const revealFired = useRef(false);
  useEffect(() => {
    if (!rive || !customInputs || revealFired.current) return;
    const timer = setTimeout(() => {
      if (revealFired.current) return;
      revealFired.current = true;
      customInputs?.reveal?.fire();
      onReveal();
    }, 1000);
    return () => clearTimeout(timer);
  }, [rive, customInputs]);

  // Expose start/stop to parent via ref
  useEffect(() => {
    actionsRef.current = { start: startConversation, end: stopConversation };
  }, [startConversation, stopConversation, actionsRef]);

  return null;
}

export function PersistentWidget() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [revealedAt, setRevealedAt] = useState<number | null>(null);
  const actionsRef = useRef<WidgetActions>({ start: () => {}, end: () => {} });

  const handleStart = useCallback(() => {
    actionsRef.current.start();
  }, []);

  const handleEnd = useCallback(() => {
    actionsRef.current.end();
  }, []);

  return (
    <MascotProvider>
      {/* Bounce-in keyframes */}
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.12); }
          75% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Widget container — pointer-events: none so clicks pass through to page */}
      <div
        className="fixed bottom-0 right-0"
        style={{
          width: 300,
          height: 380,
          pointerEvents: "none",
          zIndex: 2147483646,
        }}
      >
        {/* Rive canvas */}
        <div className="w-full h-full">
          <MascotClient
            src="/mascot_widget.riv"
            artboard="Widget"
            shouldDisableRiveListeners={true}
            inputs={[
              "gesture", "is_speaking", "inCall", "reveal",
              "gender", "character", "outline", "colourful", "flip", "crop", "bg_color",
              "shirt_color", "eyes_type", "hair_style",
              "accessories_hue", "accessories_saturation", "accessories_brightness",
            ]}
            layout={{ fit: Fit.Contain, alignment: Alignment.BottomRight }}
          >
            <WidgetContent onCallStateChange={setCallState} actionsRef={actionsRef} onReveal={() => setRevealedAt(Date.now())} />
            <MascotRive showLoadingSpinner={false} />
          </MascotClient>
        </div>

        {/* Call button — positioned at bottom-center of widget, pointer-events: auto */}
        <div
          className="absolute bottom-[15px] left-0 right-[-135px] flex justify-center"
          style={{ pointerEvents: "none" }}
        >
          <CallButton
            callState={callState}
            onStart={handleStart}
            onEnd={handleEnd}
            revealedAt={revealedAt}
          />
        </div>
      </div>
    </MascotProvider>
  );
}
