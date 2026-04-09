"use client";

import { useRef, useCallback, useEffect } from "react";
import { useDemo, FIELD_LABELS, type EstimateFormData } from "@/lib/demo-context";

const formFields: { key: keyof EstimateFormData; label: string; placeholder: string }[] = [
  { key: "name", label: "Full Name", placeholder: "John Doe" },
  { key: "email", label: "Email", placeholder: "john@example.com" },
  { key: "phone", label: "Phone", placeholder: "(555) 123-4567" },
  { key: "origin", label: "Moving From", placeholder: "123 Main St, City, State" },
  { key: "destination", label: "Moving To", placeholder: "456 Oak Ave, City, State" },
  { key: "moveDate", label: "Preferred Move Date", placeholder: "MM/DD/YYYY" },
  { key: "homeSize", label: "Home Size", placeholder: "e.g., 2 bedroom apartment" },
  { key: "specialItems", label: "Special Items", placeholder: "Piano, pool table, etc." },
];

function EstimateField({
  field,
  label,
  placeholder,
  value,
  onChange,
  onUserFinishedEditing,
}: {
  field: keyof EstimateFormData;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onUserFinishedEditing: (field: keyof EstimateFormData, value: string) => void;
}) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = useRef(false);
  const lastAgentValueRef = useRef(value);

  // Track when the value changes from agent (not user typing)
  useEffect(() => {
    if (!isUserTypingRef.current) {
      lastAgentValueRef.current = value;
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    isUserTypingRef.current = true;
    onChange(newValue);

    // Debounce: notify agent 1.5s after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      isUserTypingRef.current = false;
      if (newValue.trim() && newValue !== lastAgentValueRef.current) {
        onUserFinishedEditing(field, newValue);
        lastAgentValueRef.current = newValue;
      }
    }, 1500);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={field} className="text-sm font-medium leading-none">
        {label}
      </label>
      <input
        id={field}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-300"
      />
    </div>
  );
}

export default function EstimatePage() {
  const { state, dispatch, sendContextualUpdate } = useDemo();
  const { estimateForm, isEstimateSubmitted } = state;

  const filledCount = Object.values(estimateForm).filter(Boolean).length;

  const handleUserFinishedEditing = useCallback(
    (field: keyof EstimateFormData, value: string) => {
      sendContextualUpdate(
        `User manually typed "${value}" in the ${FIELD_LABELS[field]} field. Acknowledge briefly and move on to the next empty field.`
      );
    },
    [sendContextualUpdate]
  );

  if (isEstimateSubmitted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Estimate Submitted!</h2>
          <p className="mt-2 text-muted-foreground">
            We&apos;ve received your request. Here&apos;s a summary:
          </p>
          <div className="mt-6 space-y-2 text-left">
            {formFields.map(({ key, label }) => {
              const value = estimateForm[key];
              if (!value) return null;
              return (
                <div key={key} className="flex justify-between border-b py-2 text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => dispatch({ type: "RESET_ESTIMATE" })}
            className="mt-8 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            Submit Another Estimate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Get a Free Moving Estimate</h1>
        <p className="mt-2 text-muted-foreground">
          Tell our assistant about your move, and watch the form fill in
          automatically. Or fill it in manually — it&apos;s up to you.
        </p>
        {filledCount > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(filledCount / formFields.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filledCount}/{formFields.length} fields
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {formFields.map(({ key, label, placeholder }) => (
          <EstimateField
            key={key}
            field={key}
            label={label}
            placeholder={placeholder}
            value={estimateForm[key]}
            onChange={(value) =>
              dispatch({
                type: "UPDATE_ESTIMATE_FIELD",
                field: key,
                value,
                source: "user",
              })
            }
            onUserFinishedEditing={handleUserFinishedEditing}
          />
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => dispatch({ type: "SUBMIT_ESTIMATE" })}
          disabled={filledCount < 3}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          Submit Estimate
        </button>
        <button
          onClick={() => dispatch({ type: "RESET_ESTIMATE" })}
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Clear Form
        </button>
      </div>
    </div>
  );
}
