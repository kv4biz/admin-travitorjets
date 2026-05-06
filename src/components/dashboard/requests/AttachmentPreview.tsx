// src/components/dashboard/requests/AttachmentPreview.tsx
"use client";

import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, File as FileIcon } from "lucide-react";

interface AttachmentPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function AttachmentPreview({ files, onRemove, disabled = false }: AttachmentPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center gap-1 lg:gap-2 overflow-x-auto no-scrollbar">
      {files.map((file, idx) => {
        const isImage = file.type.startsWith("image/");

        return (
          <div key={`${file.name}-${idx}`} className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 text-xs shrink-0">
            {isImage ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileIcon className="h-4 w-4 text-muted-foreground" />}

            <span className="truncate max-w-[120px]">{file.name}</span>

            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => onRemove(idx)} disabled={disabled}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
