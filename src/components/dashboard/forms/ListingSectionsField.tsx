//src/components/dashboard/forms/ListingSectionsField.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export interface ListingSectionData {
  title: string;
  items: string[];
}

interface ListingSectionsFieldProps {
  value: ListingSectionData[];
  onChange: (newSections: ListingSectionData[]) => void;
  disabled?: boolean;
}

export function ListingSectionsField({ value = [], onChange, disabled }: ListingSectionsFieldProps) {
  const [sections, setSections] = useState<ListingSectionData[]>(value);

  const update = (newSections: ListingSectionData[]) => {
    setSections(newSections);
    onChange(newSections);
  };

  // ---- Section handlers ----
  const addSection = () => {
    const newSection: ListingSectionData = { title: "", items: [""] };
    update([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    const copy = [...sections];
    copy.splice(index, 1);
    update(copy);
  };

  const updateSectionTitle = (index: number, title: string) => {
    const copy = [...sections];
    copy[index] = { ...copy[index], title };
    update(copy);
  };

  // ---- Item handlers ----
  const addItem = (sectionIndex: number) => {
    const copy = [...sections];
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      items: [...copy[sectionIndex].items, ""],
    };
    update(copy);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    const copy = [...sections];
    const items = [...copy[sectionIndex].items];
    items.splice(itemIndex, 1);
    copy[sectionIndex] = { ...copy[sectionIndex], items };
    update(copy);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const copy = [...sections];
    const items = [...copy[sectionIndex].items];
    items[itemIndex] = value;
    copy[sectionIndex] = { ...copy[sectionIndex], items };
    update(copy);
  };

  return (
    <div className="space-y-3">
      {sections.map((section, sIdx) => (
        <Card key={sIdx} className="relative w-full">
          <CardContent className="pt-4 space-y-3">
            {/* Section header */}
            <div className="flex items-start gap-2 w-full">
              <div className="flex-1">
                <Label className="text-xs font-medium text-muted-foreground">Section Title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  placeholder="e.g. Interior Features"
                  disabled={disabled}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeSection(sIdx)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Items</Label>
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                    placeholder="List item"
                    disabled={disabled}
                    className="flex-1"
                  />
                  {section.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(sIdx, iIdx)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" className="mt-1 w-full" onClick={() => addItem(sIdx)} disabled={disabled}>
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={addSection} disabled={disabled}>
        <Plus className="h-3 w-3 mr-1" />
        Add Section
      </Button>
    </div>
  );
}
