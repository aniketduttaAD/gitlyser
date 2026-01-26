import { NextResponse } from "next/server";
import { githubGraphQL } from "@/lib/github/graphql";
import { apiErrorResponse } from "@/lib/github/errors";
import { formatContributionData } from "@/lib/utils/contributions";
import type { ContributionData } from "@/lib/github/types";

/**
 * API route for fetching GitHub contribution heatmap data using GraphQL API.
 * This uses GitHub's official contributionsCollection which matches the contribution graph.
 *
 * SECURITY:
 * - Input validation prevents injection
 * - Graceful error handling
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const year = searchParams.get("year");
  const startDate = searchParams.get("startDate");

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing username query param." }, { status: 400 });
  }

  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
  }

  const yearNum = year ? parseInt(year, 10) : undefined;
  if (year && (isNaN(yearNum!) || yearNum! < 2000 || yearNum! > new Date().getFullYear())) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  try {
    const today = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (yearNum) {
      fromDate = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      toDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      if (toDate > today) {
        toDate = today;
      }
    } else if (startDate) {
      fromDate = new Date(startDate);
      toDate = today;

      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    } else {
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      fromDate = oneYearAgo;
      toDate = today;
    }

    const graphqlQuery = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
                firstDay
              }
            }
          }
        }
      }
    `;

    try {
      const graphqlResponse = await githubGraphQL<{
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              weeks: Array<{
                contributionDays: Array<{
                  date: string;
                  contributionCount: number;
                  color: string;
                }>;
                firstDay: string;
              }>;
            };
          } | null;
        } | null;
      }>(graphqlQuery, {
        username: sanitizedUsername,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });

      if (!graphqlResponse.user || !graphqlResponse.user.contributionsCollection) {
        const contributions: ContributionData[] = [];
        const formattedData = formatContributionData(
          contributions,
          yearNum,
          startDate ? startDate : undefined
        );
        return NextResponse.json(formattedData);
      }

      const calendar = graphqlResponse.user.contributionsCollection.contributionCalendar;

      const contributions: ContributionData[] = [];
      calendar.weeks.forEach((week) => {
        week.contributionDays.forEach((day) => {
          contributions.push({
            date: day.date,
            count: day.contributionCount,
          });
        });
      });

      const formattedData = formatContributionData(contributions, yearNum, startDate || undefined);

      return NextResponse.json(formattedData);
    } catch {
      const contributions: ContributionData[] = [];
      const formattedData = formatContributionData(contributions, yearNum, startDate || undefined);
      return NextResponse.json(formattedData);
    }
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch contributions.");
  }
}
