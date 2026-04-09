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
  <svg width="11.063" height="11.001" viewBox="0 0 11.0634 11.0013" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M2.9101 8.09741C1.29683 6.49654 0 4.39928 0 2.63088C0 1.85527 0.254401 1.1417 0.831458 0.564647C1.19755 0.198557 1.60087 0 1.97316 0C2.28961 0 2.58745 0.142713 2.81703 0.471573L4.05181 2.23377C4.19452 2.43233 4.28139 2.63709 4.28139 2.85426C4.28139 3.10866 4.1635 3.38788 3.88428 3.70433L3.44373 4.20693C3.37547 4.26898 3.35065 4.33723 3.35065 4.41169C3.35065 4.46133 3.36927 4.52959 3.40029 4.59784C3.54921 4.95152 4.0394 5.62786 4.70332 6.29178C5.37966 6.96812 6.0684 7.43969 6.40347 7.60722C6.47172 7.63825 6.54618 7.66307 6.61444 7.66307C6.70131 7.66307 6.78197 7.63204 6.84402 7.56999L7.30939 7.12324C7.61343 6.83781 7.89265 6.71992 8.14705 6.71992C8.36422 6.71992 8.56898 6.80679 8.76134 6.9433L10.6414 8.25253C10.9517 8.4697 11.0634 8.73031 11.0634 8.99092C11.0634 9.41285 10.7593 9.8472 10.4739 10.1264C9.89063 10.7159 9.20189 11.0013 8.37043 11.0013C6.59582 11.0013 4.50477 9.69207 2.9101 8.09741Z" fill="white"/>
  </svg>
);

const loaderIconJsx = (
  <svg width="17.461" height="17.461" viewBox="0 0 17.4609 17.4609" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ animation: "spin 2.5s linear infinite" }}>
    <path d="M7.93066 15.2861V13.1035C7.93066 12.6617 8.28864 12.3037 8.73047 12.3037C9.1723 12.3037 9.53027 12.6617 9.53027 13.1035V15.2861C9.53027 15.728 9.1723 16.0859 8.73047 16.0859C8.28864 16.0859 7.93066 15.728 7.93066 15.2861ZM5.07227 11.2646C5.38469 10.9522 5.89168 10.9522 6.2041 11.2646C6.51652 11.5771 6.51652 12.0841 6.2041 12.3965L4.63965 13.96C4.32723 14.2724 3.82121 14.2724 3.50879 13.96C3.19637 13.6475 3.19637 13.1415 3.50879 12.8291L5.07227 11.2646ZM11.2568 11.2646C11.5693 10.9522 12.0763 10.9522 12.3887 11.2646L13.9521 12.8291C14.2646 13.1415 14.2646 13.6475 13.9521 13.96C13.6397 14.2724 13.1337 14.2724 12.8213 13.96L11.2568 12.3965C10.9444 12.0841 10.9444 11.5771 11.2568 11.2646ZM4.36523 7.93848C4.80706 7.93848 5.16504 8.29645 5.16504 8.73828C5.16504 9.18011 4.80706 9.53809 4.36523 9.53809H2.18262C1.74079 9.53809 1.38281 9.18011 1.38281 8.73828C1.38281 8.29645 1.74079 7.93848 2.18262 7.93848H4.36523ZM15.2783 7.93848C15.7201 7.93848 16.0781 8.29645 16.0781 8.73828C16.0781 9.18011 15.7201 9.53809 15.2783 9.53809H13.0957C12.6539 9.53809 12.2959 9.18011 12.2959 8.73828C12.2959 8.29645 12.6539 7.93848 13.0957 7.93848H15.2783ZM3.50879 3.5166C3.82121 3.20418 4.32723 3.20418 4.63965 3.5166L6.2041 5.08008C6.51652 5.3925 6.51652 5.89949 6.2041 6.21191C5.89168 6.52433 5.38469 6.52433 5.07227 6.21191L3.50879 4.64746C3.19637 4.33504 3.19637 3.82902 3.50879 3.5166ZM12.8213 3.5166C13.1337 3.20418 13.6397 3.20418 13.9521 3.5166C14.2646 3.82902 14.2646 4.33504 13.9521 4.64746L12.3887 6.21191C12.0763 6.52433 11.5693 6.52433 11.2568 6.21191C10.9444 5.89949 10.9444 5.3925 11.2568 5.08008L12.8213 3.5166ZM7.93066 4.37305V2.19043C7.93066 1.7486 8.28864 1.39062 8.73047 1.39062C9.1723 1.39062 9.53027 1.7486 9.53027 2.19043V4.37305C9.53027 4.81487 9.1723 5.17285 8.73047 5.17285C8.28864 5.17285 7.93066 4.81487 7.93066 4.37305Z" fill="white"/>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
          className="absolute bottom-[20px] left-0 right-[-135px] flex justify-center"
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
