import { NextResponse } from "next/server";

type CompareRequest = {
  openaiKey: string;
  jobDescription?: string;
  comparisonType: "role_match" | "technical_skills" | "overall_assessment";
  profiles: Array<{
    login: string;
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    type: string;
  }>;
  reposData: Array<{
    repos: Array<{
      name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      topics: string[];
      created_at: string;
      pushed_at: string;
    }>;
    languages: Record<string, number>;
    totalStars: number;
    totalForks: number;
    totalOpenIssues: number;
    languagesCount: number;
    avgRepoSize: number;
    mostStarredRepo: { name: string; stars: number } | null;
  }>;
};

const OPENAI_MODEL = "gpt-4o-mini";

async function callOpenAI(
  openaiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string | null; error: string | null; status: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error?.message || `API error: ${response.statusText}`;

    errorMessage = errorMessage
      .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]");

    if (response.status === 401) {
      errorMessage = "Invalid OpenAI API key. Please check your key in settings.";
    } else if (response.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (response.status >= 500) {
      errorMessage = "OpenAI API is temporarily unavailable. Please try again.";
    }

    return { content: null, error: errorMessage, status: response.status };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || null;
  const finishReason = data.choices?.[0]?.finish_reason;

  if (finishReason === "length" && content) {
    return { content: content + "\n\n[Analysis truncated]", error: null, status: 200 };
  }

  return { content, error: null, status: 200 };
}

function buildProfileContext(
  profile: CompareRequest["profiles"][0],
  reposData: CompareRequest["reposData"][0]
): string {
  const topLanguages = Object.entries(reposData.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang, bytes]) => {
      const mb = bytes / (1024 * 1024);
      return mb > 1 ? `${lang} (${mb.toFixed(1)}MB)` : `${lang} (${(bytes / 1024).toFixed(0)}KB)`;
    })
    .join(", ");

  const topRepos = reposData.repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)
    .map((repo, idx) => {
      const topics =
        repo.topics && repo.topics.length > 0
          ? ` [Topics: ${repo.topics.slice(0, 5).join(", ")}]`
          : "";
      const desc = repo.description ? ` | Description: ${repo.description.substring(0, 120)}` : "";
      const issues = repo.open_issues_count > 0 ? ` | Open Issues: ${repo.open_issues_count}` : "";
      const created = new Date(repo.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      return `${idx + 1}. ${repo.name} | ⭐${repo.stargazers_count} | 🍴${repo.forks_count} | ${repo.language || "N/A"} | Created: ${created}${topics}${desc}${issues}`;
    })
    .join("\n  ");

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const yearsActive = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  const reposByLanguage = reposData.repos.reduce(
    (acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const languageBreakdown = Object.entries(reposByLanguage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => `${lang}: ${count} repos`)
    .join(", ");

  const recentActivity = reposData.repos.filter(
    (repo) =>
      repo.pushed_at && new Date(repo.pushed_at).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
  ).length;

  return `
PROFILE: @${profile.login}
- Name: ${profile.name || "Not provided"}
- Bio: ${profile.bio || "Not provided"}
- Company: ${profile.company || "Not provided"}
- Location: ${profile.location || "Not provided"}
- Member since: ${memberSince} (${yearsActive} years active)
- Account type: ${profile.type}

REPOSITORY METRICS:
- Total repositories: ${profile.public_repos}
- Total stars received: ${reposData.totalStars.toLocaleString()}
- Total forks: ${reposData.totalForks.toLocaleString()}
- Open issues: ${reposData.totalOpenIssues}
- Unique languages: ${reposData.languagesCount}
- Average repository size: ${(reposData.avgRepoSize / 1024).toFixed(1)} MB
- Repositories with recent activity (last 90 days): ${recentActivity}

LANGUAGE DISTRIBUTION:
- Top languages by code volume: ${topLanguages || "N/A"}
- Language breakdown by repository count: ${languageBreakdown || "N/A"}

TOP REPOSITORIES (by stars):
  ${topRepos || "N/A"}

SOCIAL METRICS:
- Followers: ${profile.followers.toLocaleString()}
- Following: ${profile.following.toLocaleString()}
- Follower-to-following ratio: ${profile.following > 0 ? (profile.followers / profile.following).toFixed(2) : "N/A"}

ENGAGEMENT METRICS:
- Average stars per repository: ${profile.public_repos > 0 ? (reposData.totalStars / profile.public_repos).toFixed(1) : "0"}
- Average forks per repository: ${profile.public_repos > 0 ? (reposData.totalForks / profile.public_repos).toFixed(1) : "0"}
- Most starred repository: ${reposData.mostStarredRepo ? `${reposData.mostStarredRepo.name} (${reposData.mostStarredRepo.stars} stars)` : "N/A"}
`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareRequest;

    if (!body.openaiKey || typeof body.openaiKey !== "string") {
      return NextResponse.json({ error: "OpenAI API key is required." }, { status: 400 });
    }

    if (!body.profiles || !Array.isArray(body.profiles) || body.profiles.length < 2) {
      return NextResponse.json(
        { error: "At least 2 profiles are required for comparison." },
        { status: 400 }
      );
    }

    if (
      !body.reposData ||
      !Array.isArray(body.reposData) ||
      body.reposData.length !== body.profiles.length
    ) {
      return NextResponse.json(
        { error: "Repository data must match the number of profiles." },
        { status: 400 }
      );
    }

    const { profiles, reposData, openaiKey, comparisonType, jobDescription } = body;
    const trimmedKey = openaiKey.trim();

    if (!trimmedKey.startsWith("sk-") || trimmedKey.length < 20) {
      return NextResponse.json({ error: "Invalid OpenAI API key format." }, { status: 400 });
    }

    const profilesContext = profiles
      .map(
        (profile, index) =>
          `\n=== PROFILE ${index + 1} ===\n${buildProfileContext(profile, reposData[index])}`
      )
      .join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (comparisonType === "role_match" && jobDescription) {
      systemPrompt = `You are an expert technical recruiter and hiring manager with deep knowledge of software engineering roles, technical skills assessment, and candidate evaluation. Your task is to analyze GitHub profiles and compare candidates against a job description to determine role suitability.`;

      userPrompt = `Compare the following GitHub profiles against this job description and provide a detailed analysis. Use the exact data provided and be specific with numbers, repository names, and metrics.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILES:
${profilesContext}

Provide a comprehensive analysis (500-700 words) in well-structured markdown format covering:

## Role Suitability Scores
- **Candidate 1 (@[username])**: [Score]/100 - [Brief justification]
- **Candidate 2 (@[username])**: [Score]/100 - [Brief justification]
- Explain the scoring methodology

## Technical Skills Match
- How well each candidate's tech stack, languages, and project experience aligns with job requirements
- Specific technologies mentioned in JD vs. what candidates have
- Language proficiency indicators (code volume, repository count)
- Framework and tool experience
- Reference actual repositories that demonstrate relevant skills

## Experience Level Assessment
- Evaluate based on repository count, code quality signals, project complexity, and community engagement
- Years of GitHub activity and professional experience indicators
- Project sophistication and scale
- Code quality indicators (open issues, maintenance, documentation)
- Include specific metrics and comparisons

## Strengths & Gaps
- **Candidate 1 Strengths**: Specific strengths that make them suitable for this role
- **Candidate 1 Gaps**: Areas of concern or missing requirements
- **Candidate 2 Strengths**: Specific strengths that make them suitable for this role
- **Candidate 2 Gaps**: Areas of concern or missing requirements
- Reference actual data points and repositories

## Recommendation
- Which candidate is more suitable for this role and why
- Specific evidence from their GitHub activity
- Context for when the other candidate might be preferred
- Summary of key differentiators

**Formatting Requirements:**
- Use proper markdown headers (## for main sections)
- Include specific repository names when discussing projects
- Use bold for emphasis on key points
- Include exact numbers and metrics
- Make direct comparisons where relevant

**Important:** Always mention specific repository names when discussing projects. Use exact numbers from the metrics provided. Match specific job requirements to candidate skills with evidence.`;
    } else if (comparisonType === "technical_skills") {
      systemPrompt = `You are a senior software engineer and technical lead with expertise in evaluating developer skills, code quality, and technical capabilities through GitHub profiles. You provide clear, actionable technical insights based on concrete GitHub data.`;

      userPrompt = `Compare the technical skills and capabilities of these GitHub profiles. Use the exact data provided and be specific with numbers, repository names, languages, and metrics.

${profilesContext}

Provide a detailed technical comparison (500-700 words) in well-structured markdown format covering:

## 1. Technical Stack Comparison
- Compare languages, frameworks, and technologies used by each profile
- Language distribution analysis (by code volume and repository count)
- Technical diversity and specialization areas
- Include specific language names and usage percentages/volumes

## 2. Code Quality Indicators
- Repository structure and organization
- Project maintenance signals (recent activity, open issues)
- Average repository sizes and what they indicate
- Documentation and project features (wiki, issues, pages)
- Reference specific metrics: open issues count, feature coverage, etc.

## 3. Project Complexity
- Assess the sophistication and scale of projects
- Reference specific repository names and their characteristics
- Project types and domains (web apps, automation, data science, etc.)
- Integration complexity (APIs, hardware, databases, etc.)

## 4. Community Engagement
- Open source contributions and visibility
- Stars, forks, and watchers per repository
- Follower-to-following ratios
- Community impact and recognition
- Include specific numbers and averages

## 5. Technical Strengths
- What each profile excels at technically
- Specific technologies or domains of expertise
- Unique technical capabilities demonstrated
- Reference actual repositories that showcase these strengths

## 6. Areas for Growth
- Technical areas where each could improve
- Missing skills or technologies
- Project maintenance opportunities
- Community engagement improvements

## 7. Overall Technical Assessment
- Which profile demonstrates stronger technical capabilities overall
- Specific reasons with data-backed evidence
- Context for when each profile's skills would be preferred

**Formatting Requirements:**
- Use proper markdown headers (## for main sections)
- Include specific repository names, metrics, and numbers
- Use bold for emphasis on key points
- Make direct comparisons where relevant
- Reference actual data from the profiles

**Important:** Always mention specific repository names when discussing projects. Use exact numbers from the metrics provided. Be objective and data-driven.`;
    } else {
      systemPrompt = `You are an expert technical recruiter and career advisor with deep knowledge of software engineering careers, skill assessment, and professional development. You provide clear, actionable insights based on concrete GitHub data.`;

      userPrompt = `Provide a comprehensive overall assessment comparing these GitHub profiles. Use the exact data provided and be specific with numbers, repository names, and metrics.

${profilesContext}

Provide a detailed comparison (500-700 words) in well-structured markdown format covering:

1. **Profile Overview**
   - Brief summary of each candidate's GitHub presence
   - Years of experience on GitHub
   - Account type and professional indicators

2. **Technical Expertise**
   - Depth and breadth comparison of programming languages
   - Language distribution analysis (by code volume and repository count)
   - Technical stack diversity and specialization

3. **Project Portfolio**
   - Quality and diversity of repositories
   - Top projects and their characteristics (stars, forks, topics, descriptions)
   - Project complexity indicators (repository sizes, languages used)
   - Recent activity levels

4. **Community Impact & Engagement**
   - Follower count and engagement metrics
   - Repository popularity (stars, forks per repo)
   - Open source contribution signals
   - Community visibility and influence

5. **Professional Signals**
   - Company affiliations and professional background
   - Repository maintenance and activity patterns
   - Code quality indicators (open issues, project organization)
   - Growth trajectory and consistency

6. **Comparative Strengths**
   - What makes each profile stand out uniquely
   - Specific strengths with supporting metrics
   - Differentiators between the profiles

7. **Overall Recommendation**
   - Which profile appears more experienced/capable overall
   - Specific reasons with data-backed evidence
   - Context for when each profile might be preferred

**Formatting Requirements:**
- Use proper markdown formatting (headers, bold, lists)
- Include specific numbers, repository names, and metrics
- Use clear section headers (##)
- Make comparisons side-by-side where relevant
- Be objective and data-driven

**Important:** Reference actual repository names, specific metrics, and concrete data from the profiles. Avoid generic statements.`;
    }

    const result = await callOpenAI(trimmedKey, systemPrompt, userPrompt, 1200);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (!result.content || result.content.length < 100) {
      return NextResponse.json(
        { error: "Failed to generate comparison. Please try again." },
        { status: 500 }
      );
    }

    const dataUsageNote = `**Data Considered in Analysis:**
- Profile information (name, bio, company, location, member since)
- Repository metrics (total repos, stars, forks, open issues)
- Language distribution and technical stack
- Top repositories and their characteristics
- Social metrics (followers, following)
- Repository features and maintenance signals
${comparisonType === "role_match" && jobDescription ? "- Job description requirements and role expectations" : ""}`;

    return NextResponse.json({
      analysis: result.content,
      dataUsageNote,
      comparisonType,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate comparison.";
    const sanitized = errorMessage
      .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]");

    return NextResponse.json({ error: sanitized }, { status: 500 });
  }
}
