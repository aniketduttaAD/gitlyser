"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FolderKanban,
  Star,
} from "lucide-react";
import type { TimelineData, TimelineEventType } from "@/lib/github/types";
import ChartSkeleton from "./skeletons/ChartSkeleton";

type ActivityTimelineProps = {
  username: string;
  filterType?: TimelineEventType;
  loading?: boolean;
};

const eventIcons: Record<TimelineEventType, typeof GitCommit> = {
  commits: GitCommit,
  prs: GitPullRequest,
  issues: AlertCircle,
  repos: FolderKanban,
  stars: Star,
};

const eventColors: Record<TimelineEventType, string> = {
  commits: "text-[#4f6d6a] bg-[#e9efee] border-[#cfdad7]",
  prs: "text-[#426a4b] bg-[#eff6f0] border-[#cfe2d1]",
  issues: "text-[#6f665b] bg-[#f3ede4] border-[#e2d6c8]",
  repos: "text-[#5f564d] bg-[#f1e6d8] border-[#e2d6c8]",
  stars: "text-[#a24f45] bg-[#f9ebe8] border-[#efc6c0]",
};

export default function ActivityTimeline({
  username,
  filterType,
  loading: externalLoading,
}: ActivityTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(!externalLoading && !!username);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<TimelineEventType | "all">(
    filterType || "all"
  );

  useEffect(() => {
    if (!username || externalLoading) {
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    fetch(`/api/github/timeline?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to fetch timeline");
          });
        }
        return res.json();
      })
      .then((json: TimelineData) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load timeline");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [username, selectedFilter, externalLoading]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredEvents = !data
    ? []
    : selectedFilter === "all"
      ? data.events
      : data.events.filter((e) => e.type === selectedFilter);

  if (loading || externalLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#efc6c0] bg-[#f9ebe8] p-4 text-sm text-[#a24f45]">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#2f2a24] mb-2">Activity Timeline</h3>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "commits", "prs", "issues", "repos", "stars"] as const).map((type) => {
            const Icon = type === "all" ? CalendarDays : eventIcons[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedFilter(type)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedFilter === type
                    ? "border-[#4f6d6a] bg-[#e9efee] text-[#4f6d6a]"
                    : "border-[#e2d6c8] bg-[#f3ede4] text-[#6f665b] hover:border-[#cfdad7]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-[#6f665b]">
          {!data
            ? "No activity timeline data available."
            : filteredEvents.length === 0
              ? `No ${selectedFilter === "all" ? "" : selectedFilter} events found.`
              : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""} shown`}
        </p>
      </div>

      {/* Timeline */}
      {!data || filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] p-6 text-center text-sm text-[#6f665b]">
          {!data
            ? "No activity timeline data available."
            : `No ${selectedFilter === "all" ? "" : selectedFilter} events found. Try selecting a different filter.`}
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto pl-3">
            {filteredEvents.slice(0, 75).map((event, index) => {
              const Icon = eventIcons[event.type];
              const colorClass = eventColors[event.type];

              return (
                <div
                  key={event.id}
                  className={`flex gap-4 relative pl-8 ${
                    index < filteredEvents.length - 1 ? "border-l-2 border-[#e2d6c8] pb-3" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`absolute -left-[14px] top-0 rounded-full border-2 p-1.5 ${colorClass} z-10`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-sm font-semibold text-[#2f2a24] flex-1 leading-tight">
                        {event.title}
                      </h4>
                      <span className="text-xs text-[#6f665b] whitespace-nowrap flex-shrink-0">
                        {formatDate(event.date)}
                      </span>
                    </div>

                    {event.repo && (
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-[#6f665b] font-medium bg-[#f3ede4] px-2 py-0.5 rounded">
                          {event.repo}
                        </span>
                        {event.actor && (
                          <span className="text-xs text-[#5f564d]">by @{event.actor.login}</span>
                        )}
                      </div>
                    )}

                    {event.description && (
                      <p className="text-xs text-[#5f564d] mb-2 leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#4f6d6a] hover:text-[#3f5d5a] underline transition-colors"
                      >
                        View on GitHub
                        <span>→</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvents.length > 75 && (
            <p className="mt-4 text-xs text-[#6f665b] text-center">
              Showing first 75 of {filteredEvents.length} events
            </p>
          )}
        </>
      )}
    </div>
  );
}
