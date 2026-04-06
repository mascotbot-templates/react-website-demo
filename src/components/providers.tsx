"use client";

import { MascotProvider } from "@mascotbot-sdk/react";
import { DemoProvider } from "@/lib/demo-context";
import { NavigationHandler } from "@/components/navigation-handler";
import { PersistentWidget } from "@/components/widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MascotProvider>
      <DemoProvider>
        <NavigationHandler />
        {children}
        <PersistentWidget />
      </DemoProvider>
    </MascotProvider>
  );
}
