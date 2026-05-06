// src/components/dashboard/empty-legs/EmptyLegsSearch.tsx
"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AirportSearch, Airport } from "@/components/dashboard/airports/AirportSearch";

export interface EmptyLegSearchParams {
  depAirportId?: string;
  depLat?: number;
  depLng?: number;
  arrAirportId?: string;
  arrLat?: number;
  arrLng?: number;
  fromDate?: string;
  radiusKm?: number;
}

interface Props {
  onSearch: (params: EmptyLegSearchParams) => void;
}

export function EmptyLegsSearch({ onSearch }: Props) {
  const [open, setOpen] = useState(false);

  const [depAirport, setDepAirport] = useState<Airport | null>(null);
  const [arrAirport, setArrAirport] = useState<Airport | null>(null);
  const [date, setDate] = useState<Date>();
  const [radiusKm, setRadiusKm] = useState(50);

  const hasFilters = depAirport || arrAirport || date || radiusKm !== 50;

  const handleSearch = () => {
    onSearch({
      depAirportId: depAirport?.id,
      depLat: depAirport?.latitude ?? undefined,
      depLng: depAirport?.longitude ?? undefined,
      arrAirportId: arrAirport?.id,
      arrLat: arrAirport?.latitude ?? undefined,
      arrLng: arrAirport?.longitude ?? undefined,
      fromDate: date?.toISOString(),
      radiusKm,
    });
    setOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    // prevent popover toggle when clicking X
    e?.stopPropagation();

    setDepAirport(null);
    setArrAirport(null);
    setDate(undefined);
    setRadiusKm(50);

    onSearch({});
    setOpen(false);
  };

  const summary = [
    depAirport ? `${depAirport.city || depAirport.name}` : "From",
    "→",
    arrAirport ? `${arrAirport.city || arrAirport.name}` : "To",
    date ? `• ${format(date, "MMM dd")}` : "",
    radiusKm !== 50 ? `• ${radiusKm}km` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-center w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-between text-left font-normal max-w-4xl">
            <span className={`truncate ${hasFilters ? "text-foreground" : "text-muted-foreground"}`}>{summary}</span>

            {/* 🔥 SINGLE ICON SLOT */}
            {hasFilters ? (
              <span onClick={handleClear} className="ml-2 flex items-center justify-center">
                <X className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
              </span>
            ) : (
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[360px] space-y-3 p-4" align="start">
          <AirportSearch value={depAirport} onChange={setDepAirport} placeholder="From airport" />
          <AirportSearch value={arrAirport} onChange={setArrAirport} placeholder="To airport" />

          <div className="flex justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </div>

          <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Exact (0 km)</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
              <SelectItem value="100">100 km</SelectItem>
              <SelectItem value="200">200 km</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
