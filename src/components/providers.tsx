"use client";

import dynamic from "next/dynamic";
import { DemoProvider } from "@/lib/demo-context";
import { NavigationHandler } from "@/components/navigation-handler";

const PersistentWidget = dynamic(
  () => import("@/components/widget").then((m) => ({ default: m.PersistentWidget })),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <NavigationHandler />
      {children}
      <PersistentWidget />
    </DemoProvider>
  );
}
