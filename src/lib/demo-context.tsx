"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";

export interface EstimateFormData {
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  moveDate: string;
  homeSize: string;
  specialItems: string;
}

export const FIELD_LABELS: Record<keyof EstimateFormData, string> = {
  name: "Full Name",
  email: "Email",
  phone: "Phone",
  origin: "Moving From",
  destination: "Moving To",
  moveDate: "Move Date",
  homeSize: "Home Size",
  specialItems: "Special Items",
};

interface DemoState {
  estimateForm: EstimateFormData;
  isEstimateSubmitted: boolean;
  navigationTarget: string | null;
}

type DemoAction =
  | { type: "UPDATE_ESTIMATE_FIELD"; field: keyof EstimateFormData; value: string; source: "agent" | "user" }
  | { type: "SUBMIT_ESTIMATE" }
  | { type: "RESET_ESTIMATE" }
  | { type: "NAVIGATE_TO"; page: string }
  | { type: "CLEAR_NAVIGATION" };

const initialState: DemoState = {
  estimateForm: {
    name: "",
    email: "",
    phone: "",
    origin: "",
    destination: "",
    moveDate: "",
    homeSize: "",
    specialItems: "",
  },
  isEstimateSubmitted: false,
  navigationTarget: null,
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "UPDATE_ESTIMATE_FIELD":
      return {
        ...state,
        estimateForm: { ...state.estimateForm, [action.field]: action.value },
      };
    case "SUBMIT_ESTIMATE":
      return { ...state, isEstimateSubmitted: true };
    case "RESET_ESTIMATE":
      return { ...state, estimateForm: initialState.estimateForm, isEstimateSubmitted: false };
    case "NAVIGATE_TO":
      return { ...state, navigationTarget: action.page };
    case "CLEAR_NAVIGATION":
      return { ...state, navigationTarget: null };
    default:
      return state;
  }
}

type SendContextualUpdateFn = ((text: string) => void) | null;

const DemoContext = createContext<{
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  registerContextualUpdate: (fn: SendContextualUpdateFn) => void;
  sendContextualUpdate: (text: string) => void;
} | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const contextualUpdateRef = useRef<SendContextualUpdateFn>(null);

  const registerContextualUpdate = useCallback((fn: SendContextualUpdateFn) => {
    contextualUpdateRef.current = fn;
  }, []);

  const sendContextualUpdate = useCallback((text: string) => {
    if (contextualUpdateRef.current) {
      contextualUpdateRef.current(text);
    }
  }, []);

  return (
    <DemoContext.Provider value={{ state, dispatch, registerContextualUpdate, sendContextualUpdate }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}

/**
 * Hook for form components to notify the agent of manual edits.
 * Debounces changes and sends a contextual update after the user stops typing.
 */
export function useFormFieldSync(
  field: keyof EstimateFormData,
  value: string,
  source: "agent" | "user",
) {
  const { sendContextualUpdate } = useDemo();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const prevValueRef = useRef(value);
  const sourceRef = useRef(source);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    // Only notify for user-initiated changes, and only when value actually changed
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    // Skip agent-originated updates
    if (sourceRef.current === "agent") {
      sourceRef.current = "user"; // Reset for next change
      return;
    }

    // Debounce user edits — wait 1.5s after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        sendContextualUpdate(
          `The user manually entered "${value}" for the ${FIELD_LABELS[field]} field. Acknowledge briefly and continue.`
        );
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, field, sendContextualUpdate]);
}
