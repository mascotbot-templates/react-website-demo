"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo-context";

export function NavigationHandler() {
  const router = useRouter();
  const { state, dispatch } = useDemo();

  useEffect(() => {
    if (state.navigationTarget) {
      router.push(state.navigationTarget);
      dispatch({ type: "CLEAR_NAVIGATION" });
    }
  }, [state.navigationTarget, router, dispatch]);

  return null;
}
