// src/components/dashboard/requests/RequestDetailsDialog.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { getRequestDetailsFields } from "@/lib/request-details-fields";
import { content } from "@/lib/content";
import { createClient } from "@/lib/client";
import { toast } from "sonner";

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  requestType: string;
  details: Record<string, unknown>;
  onDetailsUpdated: (newDetails: Record<string, unknown>) => void;
}

export function RequestDetailsDialog({ open, onOpenChange, requestId, requestType, details, onDetailsUpdated }: RequestDetailsDialogProps) {
  const [editing, setEditing] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Load select options when the dialog opens (only for charter fields)
  const [aircraftClasses, setAircraftClasses] = useState<{ value: string; label: string }[]>([]);
  const [aircraftTypes, setAircraftTypes] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!open || requestType !== "charter") return;

    async function fetchOptions() {
      setOptionsLoading(true);
      const supabase = createClient();

      // Fetch aircraft classes
      const { data: classes } = await supabase.from("aircraft_classes").select("id, name").order("priority", { ascending: true });
      if (classes) {
        setAircraftClasses(classes.map((c) => ({ value: c.id, label: c.name })));
      }

      // Fetch aircraft types (you can later filter by class if needed)
      const { data: types } = await supabase.from("aircraft_types").select("id, name").order("name");
      if (types) {
        setAircraftTypes(types.map((t) => ({ value: t.id, label: t.name })));
      }

      setOptionsLoading(false);
    }
    fetchOptions();
  }, [open, requestType]);

  // Build the final fields with options injected
  const baseFields = useMemo(() => getRequestDetailsFields(requestType), [requestType]);

  const fields: FormFieldConfig[] = useMemo(() => {
    if (requestType !== "charter") return baseFields;
    return baseFields.map((field) => {
      if (field.name === "aircraft_class_id") {
        return { ...field, options: aircraftClasses };
      }
      if (field.name === "aircraft_type_id") {
        return { ...field, options: aircraftTypes };
      }
      return field;
    });
  }, [baseFields, aircraftClasses, aircraftTypes, requestType]);

  const schema = z.object({}).passthrough();

  const ct = content.pages.requestDetail.detailsDialog;

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: values }),
      });
      if (res.ok) {
        toast.success("Details updated");
        onDetailsUpdated(values);
        setEditing(false);
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditing(!editing)} disabled={editing}>
              <Pencil className="h-4 w-4" />
            </Button>
            <DialogTitle>{ct.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {optionsLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <FormRenderer
              key={editing ? "edit" : "view"}
              schema={schema}
              fields={fields}
              defaultValues={details}
              onSubmit={handleSubmit}
              submitLabel={ct.saveChanges}
              onCancel={() => setEditing(false)}
              disabled={!editing}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
