// src/components/dashboard/forms/FormRenderer.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { ZodTypeAny, z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { getPathFromUrl, deleteFromBucket, moveTempToFinal, generateStoragePath } from "@/lib/supabase/storage";
import { createClient } from "@/lib/client";

import { FormFields } from "./FormFields";

/* -------------------------------- */
/* FIELD TYPES (exported for FileDropzone) */
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
  editable?: boolean;
}

interface FormRendererProps<TSchema extends ZodTypeAny> {
  schema: TSchema;
  fields: FormFieldConfig[];
  defaultValues: Record<string, unknown>;
  onSubmit: (values: z.infer<TSchema>) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  disabled?: boolean;
  onFormReady?: (form: UseFormReturn) => void; // new
}

/* -------------------------------- */
/* COMPONENT */
/* -------------------------------- */

export function FormRenderer<TSchema extends ZodTypeAny>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  onSuccess,
  disabled = false,
  onFormReady,
}: FormRendererProps<TSchema>) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({ defaultValues });
  const initialValuesRef = useRef(defaultValues);

  const [stagedFiles, setStagedFiles] = useState<Record<string, { url: string; tempPath: string }[]>>({});
  const [removedExistingFiles, setRemovedExistingFiles] = useState<Record<string, Set<string>>>({});

  // Expose form to parent
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]); // run once on mount

  // Reset everything when defaultValues change (new record or edit)
  useEffect(() => {
    form.reset(defaultValues);
    initialValuesRef.current = defaultValues;
    setStagedFiles({});
    setRemovedExistingFiles({});
  }, [defaultValues, form]);

  const handleFileStaged = useCallback((fieldName: string, stagedFile: { url: string; tempPath: string }) => {
    setStagedFiles((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), stagedFile],
    }));
  }, []);

  const handleStagedFileRemoved = useCallback((fieldName: string, url: string) => {
    setStagedFiles((prev) => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((sf) => sf.url !== url),
    }));
  }, []);

  const handleExistingFileMarkedForRemoval = useCallback((fieldName: string, url: string) => {
    setRemovedExistingFiles((prev) => {
      const currentSet = prev[fieldName] || new Set<string>();
      currentSet.add(url);
      return { ...prev, [fieldName]: currentSet };
    });
  }, []);

  const handleCancel = useCallback(async () => {
    // Clean up all temporarily staged files
    for (const fieldName in stagedFiles) {
      const files = stagedFiles[fieldName];
      for (const file of files) {
        try {
          const bucket = fields.find((f) => f.name === fieldName)?.bucket || "uploads";
          const path = getPathFromUrl(file.url, bucket);
          await deleteFromBucket({ bucket, paths: [path] });
        } catch (err) {
          console.error("Failed to delete temp file on cancel:", err);
        }
      }
    }
    setStagedFiles({});
    setRemovedExistingFiles({});
    onCancel?.();
  }, [stagedFiles, fields, onCancel]);

  const submitHandler = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Not authenticated");
        return;
      }

      const processedData = { ...data };

      // Convert number strings to actual numbers
      for (const field of fields) {
        if (field.type === "number" && processedData[field.name] !== undefined && processedData[field.name] !== "") {
          const num = Number(processedData[field.name]);
          processedData[field.name] = isNaN(num) ? undefined : num;
        }
      }

      // Convert Airport object → ID before sending to backend
      for (const field of fields) {
        if (field.type === "airport") {
          const val = processedData[field.name];
          if (val && typeof val === "object") {
            processedData[field.name] = (val as { id: string }).id;
          }
        }
      }

      // Move temporary file uploads to final bucket and handle removals
      for (const field of fields) {
        if (field.type !== "image" && field.type !== "document") continue;

        const bucket = field.bucket || "uploads";
        const fieldStaged = stagedFiles[field.name] || [];
        const currentValue = processedData[field.name];

        let newValue: string | string[];

        if (field.multiple) {
          const urls = (currentValue as string[]) || [];
          const finalUrls = await Promise.all(
            urls.map(async (url) => {
              const staged = fieldStaged.find((sf) => sf.url === url);
              if (staged) {
                const finalPath = generateStoragePath({
                  userId: userData.user.id,
                  field: field.name,
                  file: new File([], staged.tempPath.split("/").pop()!),
                });
                return await moveTempToFinal({
                  bucket,
                  tempPath: staged.tempPath,
                  finalPath,
                });
              }
              return url;
            }),
          );
          newValue = finalUrls;
        } else {
          const url = currentValue as string;
          const staged = fieldStaged.find((sf) => sf.url === url);
          if (staged) {
            const finalPath = generateStoragePath({
              userId: userData.user.id,
              field: field.name,
              file: new File([], staged.tempPath.split("/").pop()!),
            });
            newValue = await moveTempToFinal({
              bucket,
              tempPath: staged.tempPath,
              finalPath,
            });
          } else {
            newValue = url || "";
          }
        }

        processedData[field.name] = newValue;
      }

      // Validate with Zod
      const result = schema.safeParse(processedData);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path?.[0];
          if (path) {
            form.setError(path as string, {
              message: issue.message,
              type: "validation",
            });
          }
        });
        return;
      }

      // Delete existing files that were marked for removal
      for (const field of fields) {
        if (field.type !== "image" && field.type !== "document") continue;
        const bucket = field.bucket || "uploads";
        const removedSet = removedExistingFiles[field.name] || new Set<string>();
        for (const url of removedSet) {
          try {
            const path = getPathFromUrl(url, bucket);
            await deleteFromBucket({ bucket, paths: [path] });
          } catch (err) {
            console.error("Failed to delete removed file:", url, err);
          }
        }
      }

      // Submit the final data
      await onSubmit(result.data);
      toast.success("Saved successfully");

      // Reset internal state and close the panel
      setStagedFiles({});
      setRemovedExistingFiles({});
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploadingAny = Object.values(uploading).some(Boolean);

  return (
    <form onSubmit={form.handleSubmit(submitHandler)} className="h-full flex flex-col min-h-0">
      <ScrollArea className="flex-1 min-h-0 overflow-hidden pr-4">
        <div className="space-y-4 mb-4">
          <FormFields
            fields={fields}
            form={form}
            uploading={uploading}
            setUploading={setUploading}
            disabled={disabled}
            stagedFiles={stagedFiles}
            onFileStaged={handleFileStaged}
            onStagedFileRemoved={handleStagedFileRemoved}
            onExistingFileMarkedForRemoval={handleExistingFileMarkedForRemoval}
          />
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {!disabled && (
        <div className="shrink-0 border-t bg-background p-3 flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isUploadingAny}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
