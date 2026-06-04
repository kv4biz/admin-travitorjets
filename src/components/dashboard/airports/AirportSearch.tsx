//src/components/dashboard/airports/AirportSearch.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export interface Airport {
  id: string;
  name: string;
  iata: string | null;
  icao: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AirportSearch({
  value,
  onChange,
  placeholder = "Select airport",
  disabled = false,
}: AirportSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch missing airport details (e.g. when only an id is stored)
  useEffect(() => {
    if (value?.id && !value.name) {
      fetch(`/api/airports/${value.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            onChange(json.data as Airport);
          }
        })
        .catch(console.error);
    }
  }, [value, onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (term: string) => {
    if (disabled) return;
    setSearch(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortControllerRef.current?.abort();

    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const res = await fetch(
          `/api/airports/search?q=${encodeURIComponent(term)}`,
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) {
          console.error("Fetch failed:", res.status);
          setResults([]);
          return;
        }
        const json = await res.json();
        const airports: Airport[] = json.data || [];
        if (!controller.signal.aborted) {
          setResults(airports);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Airport search failed:", err);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleClear = () => {
    if (disabled) return;
    setSearch("");
    setResults([]);
    setLoading(false);
    onChange(null);
  };

  const handleSelect = (airport: Airport) => {
    if (disabled) return;
    onChange(airport);
    setOpen(false);
    setSearch("");
    setResults([]);
    setLoading(false);
  };

  const handleOpenChange = (state: boolean) => {
    if (disabled) return;
    setOpen(state);
    if (!state) {
      setSearch("");
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`w-full justify-start ${disabled ? "bg-input/50 text-foreground cursor-not-allowed" : ""}`}
        >
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          {value?.id
            ? `${value.city || value.name || "Airport"} (${value.iata || value.icao || "?"})`
            : placeholder}
        </Button>
      </PopoverTrigger>

      {!disabled && (
        <PopoverContent className="w-xs p-0" align="start">
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput
                placeholder="Search airport..."
                value={search}
                onValueChange={handleSearch}
                autoFocus
                className="pr-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : search ? (
                  <button onClick={handleClear}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                ) : null}
              </div>
            </div>
            {!loading && results.length === 0 && search.trim().length >= 2 && (
              <CommandEmpty>No airport found.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup className="max-h-64 overflow-y-auto">
                {results.map((airport) => (
                  <CommandItem
                    key={airport.id}
                    onSelect={() => handleSelect(airport)}
                  >
                    <div className="flex flex-col">
                      <span>{airport.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {airport.iata || airport.icao} – {airport.city},{" "}
                        {airport.country}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
