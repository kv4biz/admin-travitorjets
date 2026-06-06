/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
//src/components/dashboard/forms/FormFields.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { utcToLocalDatetime } from "./formUtils";
import { FileDropzone } from "./FileDropzone";
import { FormFieldConfig } from "./FormRenderer";
import { AirportSearch, Airport } from "@/components/dashboard/airports/AirportSearch";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { ListingSectionsField } from "./ListingSectionsField";

interface FormFieldsProps {
  fields: FormFieldConfig[];
  form: any;
  uploading: Record<string, boolean>;
  setUploading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  disabled?: boolean;
  stagedFiles: Record<string, { url: string; tempPath: string }[]>;
  onFileStaged: (fieldName: string, file: { url: string; tempPath: string }) => void;
  onStagedFileRemoved: (fieldName: string, url: string) => void;
  onExistingFileMarkedForRemoval: (fieldName: string, url: string) => void;
}

/**
 * Intelligent Select Option component processing both local fallback configurations
 * and dynamic asynchronous dependency chains.
 */
function DynamicSelect({ field, form, disabled }: { field: FormFieldConfig; form: any; disabled: boolean }) {
  const [computedOptions, setComputedOptions] = useState<{ value: string; label: string }[]>(field.options || []);
  const [loading, setLoading] = useState(false);

  // Safely watch target parent structural field context dependencies
  const dependsOnValue = field.dependsOn ? form.watch(field.dependsOn) : undefined;
  const previousDependsOnValue = useRef<string | undefined>(dependsOnValue);

  useEffect(() => {
    // 1. Immediate fallback sequence if static options configuration lacks remote routes
    if (!field.apiEndpoint) {
      setComputedOptions(field.options ?? []);
      return;
    }

    // 2. Clear out subordinate state collections if master option is deselected
    if (field.dependsOn && !dependsOnValue) {
      setComputedOptions([]);
      if (form.getValues(field.name)) {
        form.setValue(field.name, "");
      }
      previousDependsOnValue.current = undefined;
      return;
    }

    // 3. Structural update reset validation checks (skips if it matches original mount parameters)
    if (field.dependsOn && dependsOnValue !== previousDependsOnValue.current) {
      if (previousDependsOnValue.current !== undefined) {
        form.setValue(field.name, "");
      }
      previousDependsOnValue.current = dependsOnValue;
    }

    // 4. Request orchestration with automated AbortController integration
    const controller = new AbortController();
    let url = field.apiEndpoint;

    if (field.dependsOn && dependsOnValue) {
      const queryParam = field.dependsOnKey || `filter_${field.dependsOn}`;
      url += url.includes("?") ? "&" : "?";
      url += `${queryParam}=${encodeURIComponent(dependsOnValue)}`;
    }

    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        const payloadItems = json.data || json.results || json.items || json.records || [];
        const mappedOptions = payloadItems.map((item: any) => ({
          value: String(item.id ?? item.value ?? item.uuid ?? item.code),
          label: item.label ?? item.name ?? item.aircraft_model ?? item.title ?? "Unknown Option",
        }));
        setComputedOptions(mappedOptions);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(`Dynamic options load error inside field '${field.name}':`, err);
          setComputedOptions([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [field.apiEndpoint, field.options, field.dependsOn, field.dependsOnKey, dependsOnValue, field.name, form]);

  const selectedValue = form.watch(field.name) ?? "";

  if (disabled) {
    const selectedOption = computedOptions.find((opt) => opt.value === selectedValue);

    return (
      <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm text-gray-500">
        {selectedOption?.label || field.options?.find((o) => o.value === selectedValue)?.label || selectedValue || "—"}
      </div>
    );
  }

  return (
    <Select value={selectedValue} onValueChange={(v) => form.setValue(field.name, v)} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading available options..." : field.placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
        {computedOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FormFields({
  fields,
  form,
  uploading,
  setUploading,
  disabled,
  stagedFiles,
  onFileStaged,
  onStagedFileRemoved,
  onExistingFileMarkedForRemoval,
}: FormFieldsProps) {
  return (
    <FieldGroup>
      {fields.map((field) => {
        const value = form.watch(field.name);
        // Per‑field disabled: global disabled OR explicit editable = false
        const isFieldDisabled = disabled || field.editable === false;
        if (field.render && isFieldDisabled) {
          return (
            <Field key={field.name}>
              <FieldLabel>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </FieldLabel>
              <div className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-100">{field.render(value)}</div>
            </Field>
          );
        }
        return (
          <Field key={field.name}>
            <FieldLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FieldLabel>

            <FieldContent>
              {/* TEXT */}
              {field.type === "text" && (
                <Input {...form.register(field.name)} placeholder={field.placeholder} disabled={isFieldDisabled} />
              )}

              {/* TEXTAREA */}
              {field.type === "textarea" && (
                <Textarea {...form.register(field.name)} placeholder={field.placeholder} disabled={isFieldDisabled} />
              )}

              {/* NUMBER */}
              {field.type === "number" && (
                <Input
                  type="number"
                  step="any" // ✅ allows decimals like 1.98
                  {...form.register(field.name, {
                    valueAsNumber: true, // ✅ ensures it's parsed as number
                  })}
                  placeholder={field.placeholder}
                  disabled={isFieldDisabled}
                />
              )}

              {/* DATE */}
              {field.type === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {value ? format(new Date(value as string), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={value ? new Date(value as string) : undefined}
                      onSelect={(date) => form.setValue(field.name, date)}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* DATETIME */}
              {field.type === "datetime" && (
                <DateTimePicker
                  value={value ? new Date(utcToLocalDatetime(value as string)) : undefined}
                  onChange={(date) => {
                    if (date) {
                      const utc = new Date(date);
                      form.setValue(field.name, utc.toISOString());
                    } else {
                      form.setValue(field.name, "");
                    }
                  }}
                  disabled={isFieldDisabled}
                />
              )}

              {/* SELECT */}
              {field.type === "select" && <DynamicSelect field={field} form={form} disabled={!!isFieldDisabled} />}
              {/* AIRPORT */}
              {field.type === "airport" &&
                (() => {
                  let airportValue: Airport | null = null;
                  if (value && typeof value === "object" && "id" in value) {
                    airportValue = value as Airport;
                  } else if (typeof value === "string" && value.length > 0) {
                    // Minimal object – AirportSearch will fetch the rest
                    airportValue = {
                      id: value,
                      name: "",
                      iata: null,
                      icao: "",
                      city: null,
                      country: null,
                      latitude: null,
                      longitude: null,
                    };
                  }

                  return (
                    <AirportSearch
                      value={airportValue}
                      onChange={(airport) => form.setValue(field.name, airport)}
                      placeholder={field.placeholder}
                      disabled={isFieldDisabled}
                    />
                  );
                })()}

              {/* FILE (image or document) */}
              {(field.type === "image" || field.type === "document") && (
                <FileDropzone
                  field={field}
                  form={form}
                  uploading={uploading}
                  setUploading={setUploading}
                  disabled={isFieldDisabled}
                  onFileStaged={onFileStaged}
                  onStagedFileRemoved={onStagedFileRemoved}
                  onExistingFileMarkedForRemoval={onExistingFileMarkedForRemoval}
                  stagedFiles={stagedFiles}
                />
              )}
              {field.type === "listing_sections" && (
                <ListingSectionsField
                  value={(value as any) || []}
                  onChange={(newVal) => form.setValue(field.name, newVal, { shouldDirty: true })}
                  disabled={isFieldDisabled}
                />
              )}
            </FieldContent>

            <FieldError errors={[{ message: form.formState.errors[field.name]?.message as string }]} />
          </Field>
        );
      })}
    </FieldGroup>
  );
}
