/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/requests/page.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnassignedList } from "@/components/dashboard/requests/UnassignedList";
import { AssignedPanel } from "@/components/dashboard/requests/AssignedPanel";
import { content } from "@/lib/content";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("unassigned");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClaim = (id: string) => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          {/* Tabs Header */}
          <div className="border-b">
            <TabsList className="w-full">
              <TabsTrigger value="unassigned" className="flex-1">
                {content.pages?.requests?.unassigned?.title ?? "Unassigned"}
              </TabsTrigger>
              <TabsTrigger value="assigned" className="flex-1">
                {content.pages?.requests?.assigned?.title ?? "Assigned"}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tabs Content */}
          <div className="flex-1 min-h-0">
            <TabsContent value="unassigned" className="h-full m-0">
              <UnassignedList refreshKey={refreshKey} onClaim={handleClaim} />
            </TabsContent>

            <TabsContent value="assigned" className="h-full m-0">
              <AssignedPanel
                content={{
                  active: content.pages?.requests?.assigned?.active ?? "Active",
                  archived: content.pages?.requests?.assigned?.archived ?? "Archived",
                  empty: content.pages?.requests?.assigned?.empty ?? "No assigned requests",
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden lg:grid flex-1 grid-cols-5 min-h-0">
        {/* Left panel – Unassigned */}
        <div className="col-span-2 border-r flex flex-col min-h-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{content.pages?.requests?.unassigned?.title ?? "Unassigned Requests"}</h2>
          </div>

          <div className="flex-1 min-h-0">
            <UnassignedList refreshKey={refreshKey} onClaim={handleClaim} />
          </div>
        </div>

        {/* Right panel – Assigned */}
        <div className="col-span-3 flex flex-col min-h-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{content.pages?.requests?.assigned?.title ?? "Assigned to Me"}</h2>
          </div>

          <div className="flex-1 min-h-0">
            <AssignedPanel
              content={{
                active: content.pages?.requests?.assigned?.active ?? "Active",
                archived: content.pages?.requests?.assigned?.archived ?? "Archived",
                empty: content.pages?.requests?.assigned?.empty ?? "No assigned requests",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
