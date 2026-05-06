//src/components/dashboard/forms/FileDropzone.tsx
"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2, File } from "lucide-react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/client";
import { uploadToTempBucket, getPathFromUrl, deleteFromBucket } from "@/lib/supabase/storage";

/* -------------------------------- */
/* TYPES */
/* -------------------------------- */

export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "image" | "document" | "airport" | "select";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  bucket?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  maxFiles?: number;
}

interface FileDropzoneProps {
  field: FormFieldConfig;
  form: UseFormReturn<Record<string, unknown>>;
  uploading: Record<string, boolean>;
  setUploading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  disabled?: boolean;
  openCarousel?: (urls: string[], index: number) => void;
  onFileStaged?: (fieldName: string, stagedFile: { url: string; tempPath: string }) => void;
  onStagedFileRemoved?: (fieldName: string, url: string) => void;
  onExistingFileMarkedForRemoval?: (fieldName: string, url: string) => void;
  stagedFiles?: Record<string, { url: string; tempPath: string }[]>;
}

/* -------------------------------- */
/* COMPONENT */
/* -------------------------------- */
export function FileDropzone({
  field,
  form,
  uploading,
  setUploading,
  disabled = false,
  openCarousel,
  onFileStaged,
  onStagedFileRemoved,
  onExistingFileMarkedForRemoval,
  stagedFiles = {},
}: FileDropzoneProps) {
  const supabase = createClient();

  const getFiles = useCallback((): string[] => {
    const value = form.watch(field.name);
    if (field.multiple) {
      return (value as string[]) || [];
    }
    return value ? [value as string] : [];
  }, [form, field.name, field.multiple]);

  /* -------------------------------- */
  /* UPLOAD HANDLERS */
  /* -------------------------------- */

  const handleSingleUpload = useCallback(
    async (file: File) => {
      setUploading((prev) => ({ ...prev, [field.name]: true }));
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("Not authenticated");
          return;
        }

        const { url, tempPath } = await uploadToTempBucket({
          file,
          bucket: field.bucket || "uploads",
          userId: userData.user.id,
          field: field.name,
        });

        onFileStaged?.(field.name, { url, tempPath });
        form.setValue(field.name, url, { shouldDirty: true });
      } catch (err) {
        console.error(err);
        toast.error("Upload failed");
      } finally {
        setUploading((prev) => ({ ...prev, [field.name]: false }));
      }
    },
    [field.bucket, field.name, form, setUploading, supabase.auth, onFileStaged],
  );

  const handleMultiUpload = useCallback(
    async (files: File[]) => {
      const current = getFiles();
      const maxFiles = field.maxFiles || 10;

      if (current.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      setUploading((prev) => ({ ...prev, [field.name]: true }));

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("Not authenticated");
          return;
        }

        const newUrls: string[] = [];

        for (const file of files) {
          const { url, tempPath } = await uploadToTempBucket({
            file,
            bucket: field.bucket || "uploads",
            userId: userData.user.id,
            field: field.name,
          });

          newUrls.push(url);
          onFileStaged?.(field.name, { url, tempPath });
        }

        form.setValue(field.name, [...current, ...newUrls], { shouldDirty: true });
      } catch (err) {
        console.error(err);
        toast.error("Upload failed");
      } finally {
        setUploading((prev) => ({ ...prev, [field.name]: false }));
      }
    },
    [field.bucket, field.maxFiles, field.name, form, getFiles, setUploading, supabase.auth, onFileStaged],
  );

  /* -------------------------------- */
  /* DELETE FILE (either staged or existing) */
  /* -------------------------------- */
  const removeFile = async (index: number) => {
    const current = getFiles();
    const url = current[index];

    const fieldStaged = stagedFiles[field.name] || [];
    const isStaged = fieldStaged.some((sf) => sf.url === url);

    if (isStaged) {
      // Delete immediately from temp bucket and unstage
      try {
        const path = getPathFromUrl(url, field.bucket || "uploads");
        await deleteFromBucket({ bucket: field.bucket || "uploads", paths: [path] });
        onStagedFileRemoved?.(field.name, url);
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete file");
        return;
      }
    } else {
      // Mark existing file for removal on final submit
      onExistingFileMarkedForRemoval?.(field.name, url);
    }

    const updated = [...current];
    updated.splice(index, 1);

    if (field.multiple) {
      form.setValue(field.name, updated, { shouldDirty: true });
    } else {
      form.setValue(field.name, "", { shouldDirty: true });
    }
    toast.success("File removed");
  };

  /* -------------------------------- */
  /* DROPZONE */
  /* -------------------------------- */
  const onDrop = useCallback(
    (files: File[]) => {
      if (field.multiple) handleMultiUpload(files);
      else handleSingleUpload(files[0]);
    },
    [field.multiple, handleMultiUpload, handleSingleUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: field.type === "image" ? { "image/*": [] } : undefined,
    disabled: disabled || uploading[field.name],
    multiple: field.multiple,
  });

  const fileUrls = getFiles();

  return (
    <div className="space-y-2">
      {/* DROPZONE */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={cn(
            "mt-2 flex justify-center rounded-md border border-dashed p-4 transition-all",
            isDragActive ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border",
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground/70" />
            <div className="mt-2 flex justify-center text-sm text-muted-foreground">
              <p>Drag & drop or</p>
              <span className="pl-1 font-medium text-primary">click to upload</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{field.multiple ? `Up to ${field.maxFiles || 10} files` : "Single file"}</p>
          </div>
        </div>
      )}

      {/* UPLOADING INDICATOR */}
      {uploading[field.name] && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Uploading...
        </div>
      )}

      {/* FILE LIST */}
      {fileUrls.length > 0 && (
        <div className="space-y-2">
          {fileUrls.map((url, idx) => {
            const fileName = url.split("/").pop() || "file";
            const isImage = field.type === "image";

            return (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3 bg-background hover:bg-muted/40 transition">
                <div
                  className={cn("flex items-center gap-3 min-w-0", isImage && "cursor-pointer")}
                  onClick={() => {
                    if (isImage) openCarousel?.(fileUrls, idx);
                  }}
                >
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">Uploaded file</p>
                  </div>
                </div>

                {!disabled && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(idx)}>
                    <Trash2 className="h-4 w-4 text-foreground" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
