//src/components/dashboard/requests/MeessageInput.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { MessageToolbar } from "./MessageToolbar";
import { AttachmentPreview } from "./AttachmentPreview";
import { content } from "@/lib/content";
import { createClient } from "@/lib/client";

interface MessageInputProps {
  requestId: string;
  onSend: (content: string, attachmentUrls: string[]) => Promise<void>; // <- now expects URLs
  disabled?: boolean;
}

export function MessageInput({ requestId, onSend, disabled = false }: MessageInputProps) {
  const ct = content.pages.requestDetail.chat.input;

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileRef = useRef<HTMLInputElement>(null);
  const confirmFileRef = useRef<HTMLInputElement>(null);

  // Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmFile, setConfirmFile] = useState<File | null>(null);

  const supabase = createClient();

  // ---------- FILES ----------
  const handleAttach = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles = Array.from(selected);

    setFiles((prev) => {
      const merged = [...prev, ...newFiles];
      if (merged.length > 10) {
        toast.error("Maximum 10 files allowed");
        return merged.slice(0, 10);
      }
      return merged;
    });

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------- UPLOAD HELPERS ----------
  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileName = `${folder}/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      upsert: true,
    });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  // ---------- INVOICE UPLOAD ----------
  const handleUploadInvoice = async () => {
    if (!invoiceFile || !invoiceNumber.trim()) return;
    setUploading(true);
    try {
      const url = await uploadFile(invoiceFile, "chat-attachments", "invoices");
      const res = await fetch(`/api/requests/${requestId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_number: invoiceNumber, invoice_url: url }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create invoice");
      }
      toast.success(ct.invoiceUploaded);
      setInvoiceDialogOpen(false);
      setInvoiceNumber("");
      setInvoiceFile(null);

      // Post a system message about the invoice
      setText("");
      setFiles([]);
      await onSend(`Invoice ${invoiceNumber} sent.`, [url]); // ← URL string
    } catch (err: any) {
      toast.error(err.message || ct.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  // ---------- CONFIRMATION UPLOAD ----------
  const handleUploadConfirmation = async () => {
    if (!confirmFile) return;
    setUploading(true);
    try {
      const url = await uploadFile(confirmFile, "chat-attachments", "confirmations");
      const res = await fetch(`/api/requests/${requestId}/invoice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation_document_url: url }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to upload confirmation");
      }
      toast.success(ct.confirmationUploaded);
      setConfirmDialogOpen(false);
      setConfirmFile(null);

      // Post a system message
      setText("");
      setFiles([]);
      await onSend("Confirmation document sent.", [url]); // ← URL string
    } catch (err: any) {
      toast.error(err.message || ct.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  // ---------- SEND TEXT + ATTACHMENTS ----------
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    setSending(true);

    try {
      const attachmentUrls: string[] = [];
      for (const file of files) {
        try {
          const url = await uploadFile(file, "chat-attachments", "attachments");
          attachmentUrls.push(url);
        } catch (uploadErr: any) {
          throw new Error(`Upload failed: ${uploadErr.message || "Unknown error"}`);
        }
      }

      await onSend(trimmed, attachmentUrls);

      toast.success(ct.send || "Message sent");
      setText("");
      setFiles([]);
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };
  const isBusy = sending || uploading || disabled;

  return (
    <div className="border-t bg-background">
      {/* ✅ ROW 1: TOOLBAR + FILES + SEND */}
      <div className="flex items-center gap-1 py-1 px-2 border-b">
        {/* LEFT */}
        <div className="shrink-0">
          <MessageToolbar
            onAttach={handleAttach}
            onInvoice={() => setInvoiceDialogOpen(true)}
            onConfirmation={() => setConfirmDialogOpen(true)}
            disabled={isBusy}
          />
        </div>

        {/* CENTER (SCROLL AREA) */}
        <div className="flex-1 min-w-0">
          <AttachmentPreview files={files} onRemove={removeFile} disabled={isBusy} />
        </div>

        {/* RIGHT */}
        <div className="shrink-0">
          <Button size="icon" onClick={handleSend} disabled={isBusy || (!text.trim() && files.length === 0)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ✅ ROW 2: TEXT INPUT */}
      <div className="p-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ct.placeholder}
          disabled={disabled}
          className="min-h-[100px] max-h-[200px] overflow-y-auto text-sm resize-none shadow-none"
        />
      </div>

      {/* hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      {/* ---------- Invoice Dialog ---------- */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ct.uploadInvoice}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>{ct.invoiceNumber}</FieldLabel>
              <FieldContent>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder={ct.invoiceNumberPlaceholder} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>File</FieldLabel>
              <FieldContent>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  ref={invoiceFileRef}
                />
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadInvoice} disabled={!invoiceFile || !invoiceNumber.trim() || uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {ct.uploadInvoice}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Confirmation Dialog ---------- */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ct.uploadConfirmation}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>File</FieldLabel>
              <FieldContent>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => setConfirmFile(e.target.files?.[0] || null)}
                  ref={confirmFileRef}
                />
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadConfirmation} disabled={!confirmFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {ct.uploadConfirmation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
