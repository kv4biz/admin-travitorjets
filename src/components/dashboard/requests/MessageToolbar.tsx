// src/components/dashboard/requests/MessageToolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Paperclip, Plus } from "lucide-react";
import { content } from "@/lib/content";

interface MessageToolbarProps {
  onAttach: () => void;
  onInvoice: () => void;
  onConfirmation: () => void;
  disabled?: boolean;
}

export function MessageToolbar({ onAttach, onInvoice, onConfirmation, disabled = false }: MessageToolbarProps) {
  const ct = content.pages.requestDetail.chat.input;

  return (
    <div className="flex items-center">
      {/* Attach */}
      <Button variant="ghost" size="icon" onClick={onAttach} disabled={disabled} title={ct.attachFile}>
        <Paperclip className="h-3 w-3" />
      </Button>

      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={disabled}>
            <Plus className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onInvoice}>{ct.uploadInvoice}</DropdownMenuItem>

          <DropdownMenuItem onClick={onConfirmation}>{ct.uploadConfirmation}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
