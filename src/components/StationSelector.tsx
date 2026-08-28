"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Station } from "@/lib/types";
import { searchStations, POPULAR_STATIONS, getStation } from "@/data/stations";
import { Search, MapPin, Flag, X, Check, Building2, TrainFront, ChevronDown } from "lucide-react";

interface StationSelectorProps {
  label: string;
  type: "from" | "to";
  value: string;
  onChange: (stationName: string, stationCode: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function StationSelector({
  label,
  type,
  value,
  onChange,
  className = "",
}: StationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentStation = useMemo(() => {
    return getStation(value) || {
      id: value,
      name: value,
      code: value.slice(0, 4).toUpperCase(),
      city: value,
      state: "",
      transferMinutes: 8,
      complexity: "low" as const
    };
  }, [value]);

  const filteredStations = useMemo(() => {
    return searchStations(searchQuery, 40);
  }, [searchQuery]);

  // Open modal / dropdown & focus input
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredStations.length - 1 ? prev + 1 : prev));
      scrollActiveIntoView(selectedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollActiveIntoView(selectedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredStations[selectedIndex]) {
        selectStation(filteredStations[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollActiveIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(".station-item");
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  };

  const selectStation = (station: Station) => {
    onChange(station.name, station.code);
    setIsOpen(false);
  };

  const Icon = type === "from" ? MapPin : Flag;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-[#1B3A5C]" /> {label}
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between bg-[#FAF7F0] border border-[#E8E0D1] hover:border-[#1B3A5C] px-3.5 py-2.5 text-left transition-all duration-150 group shadow-sm hover:bg-white"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="font-display text-[17px] sm:text-[18px] tracking-wide text-[#1B3A5C] truncate uppercase">
            {currentStation.name || value || (type === "from" ? "Select origin" : "Select destination")}
          </div>
          <div className="font-mono text-[11px] text-[#5C6B80] mt-0.5 flex items-center gap-1.5 truncate">
            <span className="font-bold text-[#1B3A5C] bg-[#E8E0D1]/60 px-1 py-0.2 rounded text-[10px]">
              {currentStation.code || "CODE"}
            </span>
            {currentStation.state && <span>· {currentStation.state}</span>}
            {currentStation.city && currentStation.city !== currentStation.name && (
              <span className="text-[#5C6B80]/80">({currentStation.city})</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <ChevronDown
            className={`w-4 h-4 text-[#5C6B80] transition-transform duration-200 group-hover:text-[#1B3A5C] ${
              isOpen ? "rotate-180 text-[#1B3A5C]" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Selection Card */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full sm:min-w-[380px] bg-white border-2 border-[#1B3A5C] shadow-[4px_6px_0px_rgba(27,58,92,0.9)] overflow-hidden left-0 right-0 animate-in fade-in slide-in-from-top-1 duration-150"
          onKeyDown={handleKeyDown}
        >
          {/* Header & Search Bar */}
          <div className="p-3 bg-[#FAF7F0] border-b border-[#E8E0D1]">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-[#5C6B80] pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={`Search station name, city, or code (e.g. NDLS)...`}
                className="w-full bg-white border border-[#1B3A5C] pl-9 pr-8 py-2 text-sm font-sans placeholder:text-[#5C6B80]/70 text-[#1B3A5C] outline-none focus:ring-1 focus:ring-[#1B3A5C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 p-1 text-[#5C6B80] hover:text-[#1B3A5C]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Popular Hubs Pills */}
            {!searchQuery && (
              <div className="mt-2.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#5C6B80] mb-1.5 flex items-center gap-1">
                  <TrainFront className="w-3 h-3 text-[#1B3A5C]" /> Major Junctions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_STATIONS.slice(0, 8).map((ps) => (
                    <button
                      key={ps.code}
                      type="button"
                      onClick={() => selectStation(ps)}
                      className={`text-[11px] font-mono px-2 py-0.5 border transition ${
                        currentStation.code === ps.code
                          ? "bg-[#1B3A5C] text-[#FAF7F0] border-[#1B3A5C]"
                          : "bg-white text-[#1B3A5C] border-[#E8E0D1] hover:border-[#1B3A5C] hover:bg-[#FAF7F0]"
                      }`}
                    >
                      <span className="font-bold">{ps.code}</span>
                      <span className="opacity-70 ml-1">({ps.city})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-[#FAF7F0]">
            {filteredStations.length === 0 ? (
              <div className="p-6 text-center text-[#5C6B80]">
                <Building2 className="w-6 h-6 mx-auto mb-2 text-[#5C6B80]/50" />
                <p className="text-sm font-medium">No railway station found for &quot;{searchQuery}&quot;</p>
                <p className="font-mono text-xs text-[#5C6B80]/80 mt-1">
                  Try searching by station code (e.g. NDLS, CSMT, HWH) or city.
                </p>
              </div>
            ) : (
              filteredStations.map((station, index) => {
                const isSelected = station.code === currentStation.code || station.name.toLowerCase() === currentStation.name.toLowerCase();
                const isHighlighted = index === selectedIndex;

                return (
                  <button
                    key={`${station.code}-${station.id || index}`}
                    type="button"
                    onClick={() => selectStation(station)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`station-item w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? "bg-[#1B3A5C] text-white"
                        : isSelected
                        ? "bg-[#FAF7F0] text-[#1B3A5C]"
                        : "text-[#1B3A5C] hover:bg-[#FAF7F0]"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${isHighlighted ? "text-white" : "text-[#1B3A5C]"}`}>
                          {station.name}
                        </span>
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? "text-[#F2B705]" : "text-[#0E9F4B]"}`} />
                        )}
                      </div>
                      <div className={`font-mono text-[11px] mt-0.5 truncate flex items-center gap-1.5 ${
                        isHighlighted ? "text-[#FAF7F0]/80" : "text-[#5C6B80]"
                      }`}>
                        <span>{station.city}</span>
                        {station.state && <span>· {station.state}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 font-bold tracking-wide border ${
                          isHighlighted
                            ? "bg-[#F2B705] text-[#1B3A5C] border-[#F2B705]"
                            : "bg-[#FAF7F0] text-[#1B3A5C] border-[#E8E0D1]"
                        }`}
                      >
                        {station.code}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info Strip */}
          <div className="px-3 py-1.5 bg-[#FAF7F0] border-t border-[#E8E0D1] flex items-center justify-between text-[10px] font-mono text-[#5C6B80]">
            <span>{filteredStations.length} station{filteredStations.length !== 1 ? "s" : ""}</span>
            <span className="hidden sm:inline">Use ↑↓ keys & Enter to select</span>
          </div>
        </div>
      )}
    </div>
  );
}
