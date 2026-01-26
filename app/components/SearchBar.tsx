"use client";

import { Search, GitCompare, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, type FormEvent } from "react";
import Image from "next/image";

type SearchBarProps = {
  onSearch: (username: string) => void;
  onCompare?: (username: string) => void;
  loading?: boolean;
  initialValue?: string;
  showCompare?: boolean;
};

type SearchUser = {
  login: string;
  avatar_url: string;
  type: "User" | "Organization";
};

export default function SearchBar({
  onSearch,
  onCompare,
  loading = false,
  initialValue = "",
  showCompare = false,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/github/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = (await response.json()) as { users: SearchUser[] };
        setSuggestions(data.users);
        setShowSuggestions(data.users.length > 0);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim().length >= 2) {
        debouncedSearch(value.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, debouncedSearch]);

  const handleSelectSuggestion = (username: string) => {
    setValue(username);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSearch(trimmed);
  };

  const handleCompare = () => {
    const trimmed = value.trim();
    if (!trimmed || !onCompare) {
      return;
    }
    onCompare(trimmed);
    setValue("");
  };

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-3 sm:p-4 shadow-sm md:flex-row md:items-end"
      >
        <div className="flex flex-1 flex-col gap-1 min-w-0 relative">
          <label
            htmlFor="username"
            className="text-xs font-semibold uppercase tracking-wide text-[#7a7064]"
          >
            GitHub Username
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8e80]"
              aria-hidden="true"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8e80] animate-spin" />
            )}
            <input
              id="username"
              name="username"
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="aniketduttaAD"
              className="h-10 sm:h-11 w-full rounded-xl border border-[#e2d6c8] bg-[#fffdf8] px-9 pr-9 text-sm text-[#2f2a24] outline-none transition focus:border-[#4f6d6a] focus:ring-2 focus:ring-[#d7e1e0]"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#fbf7f0] border border-[#e2d6c8] rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((user) => (
                <button
                  key={user.login}
                  type="button"
                  onClick={() => handleSelectSuggestion(user.login)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3ede4] transition text-left"
                >
                  <Image
                    src={user.avatar_url}
                    alt={user.login}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2f2a24] truncate">{user.login}</p>
                    <p className="text-xs text-[#6f665b]">{user.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {showCompare && onCompare && (
            <button
              type="button"
              onClick={handleCompare}
              disabled={loading || value.trim().length === 0}
              className="h-10 sm:h-11 rounded-xl border border-[#cfdad7] bg-[#e9efee] px-4 text-xs sm:text-sm font-semibold text-[#4f6d6a] shadow-sm transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6d6a] disabled:cursor-not-allowed disabled:opacity-50 md:self-end flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare</span>
            </button>
          )}
          <button
            type="submit"
            disabled={loading || value.trim().length === 0}
            className="h-10 sm:h-11 flex-1 md:flex-initial rounded-xl bg-[#4f6d6a] px-4 sm:px-6 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#425b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6d6a] disabled:cursor-not-allowed disabled:bg-[#cfc5b7] disabled:text-[#6f665b] md:self-end"
          >
            {loading ? "Analyzing..." : "Analyze Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
