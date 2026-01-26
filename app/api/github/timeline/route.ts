import { NextResponse } from "next/server";
import { githubJson } from "@/lib/github/client";
import { apiErrorResponse } from "@/lib/github/errors";
import { convertGithubEventsToTimeline } from "@/lib/utils/timeline";
import type { TimelineData } from "@/lib/github/types";

/**
 * API route for fetching GitHub activity timeline.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing username query param." }, { status: 400 });
  }

  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
  }

  try {
    const events = await githubJson<
      Array<{
        id: string;
        type: string;
        created_at: string;
        repo?: { name: string; url?: string };
        actor?: { login: string; avatar_url: string };
        payload?: {
          action?: string;
          pull_request?: { title: string; html_url: string; number?: number };
          issue?: { title: string; html_url: string; number?: number };
          commits?: Array<{ message: string; sha: string; url: string }>;
          size?: number;
          ref?: string;
          ref_type?: string;
          description?: string;
          release?: { name: string; tag_name: string; html_url: string };
          head?: string;
          before?: string;
        };
      }>
    >(`/users/${sanitizedUsername}/events/public?per_page=300`);

    const timelineEvents = convertGithubEventsToTimeline(events);

    const timelineData: TimelineData = {
      events: timelineEvents,
      totalEvents: timelineEvents.length,
    };

    return NextResponse.json(timelineData);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch timeline.");
  }
}
