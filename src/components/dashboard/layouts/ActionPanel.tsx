// src/components/dashboard/layouts/ActionPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActionPanelProps {
  title: string;
  children: React.ReactNode;
  onCancel?: () => void;
}

export function ActionPanel({ title, children, onCancel }: ActionPanelProps) {
  return (
    <Card className="flex flex-col h-[85vh] lg:h-[90vh]">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <CardTitle>{title}</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      {/* SCROLL AREA */}
      <CardContent className="flex-1 overflow-y-auto">{children}</CardContent>
    </Card>
  );
}
