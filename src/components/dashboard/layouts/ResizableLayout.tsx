//src/components/dashboard/layouts/ResizableLayout.tsx
"use client";

import { useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ResizableLayoutProps {
  table: React.ReactNode;
  panel: React.ReactNode;
  showPanel: boolean;
}

export function ResizableLayout({ table, panel, showPanel }: ResizableLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // ✅ FIX: prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ⛔️ DO NOT render responsive layout before mount
  if (!mounted) {
    return <div className="h-[80vh] w-full" />;
  }

  // MOBILE
  if (!isDesktop) {
    return (
      <Tabs defaultValue="table" value={showPanel ? undefined : "table"} className="w-full h-full flex flex-col">
        {showPanel && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">List</TabsTrigger>
            <TabsTrigger value="panel">Details</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="table" forceMount className={cn("flex-1 overflow-hidden", showPanel && "data-[state=inactive]:hidden")}>
          {table}
        </TabsContent>

        {showPanel && (
          <TabsContent value="panel" forceMount className="flex-1 overflow-hidden data-[state=inactive]:hidden">
            {panel}
          </TabsContent>
        )}
      </Tabs>
    );
  }

  // DESKTOP
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <ResizablePanel defaultSize={showPanel ? "65%" : "100%"} minSize={showPanel ? "40%" : "100%"} maxSize={showPanel ? "70%" : "100%"}>
        <div className="h-full overflow-hidden pr-2">{table}</div>
      </ResizablePanel>

      {showPanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={"35%"} minSize={"30%"} maxSize={"60%"}>
            <div className="h-full overflow-hidden">{panel}</div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
