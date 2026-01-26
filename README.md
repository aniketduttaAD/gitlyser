# GitLyser

**GitHub Profile Analyzer** - Comprehensive analysis tool for GitHub users and organizations with advanced visualizations, repository insights, code quality metrics, and collaboration analytics.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup GitHub Token (Optional but Recommended)

**Get Your Token:**

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `GitLyser`
4. Expiration: Choose your preference
5. Scopes: Select `public_repo` (read-only)
6. Click "Generate token" and **copy it immediately**

**Where to Add:**

**Local Development:**

- Create `.env.local` file in the project root
- Add: `GITHUB_TOKEN=your_token_here`

**Production (Vercel):**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `GITHUB_TOKEN` with your token value
- Select environments: Production, Preview, Development
- Redeploy your application

**Why?** Increases rate limits from 60/hour (unauthenticated) to 5,000/hour (authenticated). **FREE** - no charges.

### 3. Setup OpenAI Key (Optional - For Smart Summary)

**Get Your Key:**

1. Go to [OpenAI Platform → API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name it and copy the key

**Where to Add:**

- Click the **"Smart Summary"** button in the app (top-right on desktop, floating button on mobile)
- Enter your OpenAI API key in the modal
- Click "Save Settings"
- Key is stored securely in your browser's local storage

**Why?** Enables AI-powered repository summaries. Subject to OpenAI's pricing.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start analyzing profiles.

## ✨ Features

### Profile Analysis

- **User & Organization Support** - Analyze any GitHub user or organization
- **Profile Overview** - Avatar, bio, location, company, website, followers, following, public repos
- **Sticky Header** - Profile info stays visible while scrolling
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Search Functionality** - Quick search for any GitHub username

### Data Visualizations

- **Language Distribution** - Interactive pie chart showing programming language usage across repositories
- **Language Usage** - Bar chart with detailed language statistics and percentages
- **Repository Size Distribution** - Visual breakdown of repository sizes
- **Contribution Heatmap** - GitHub-style contribution calendar with year selection (from profile creation to current year)
- **Activity Timeline** - Chronological timeline of commits, PRs, issues, repos, and stars with event type filtering

### Repository Insights

- **Repository Cards** - Expandable cards with detailed information
- **Repository Summaries** - Heuristic-based summaries from README, dependencies, and file structure
- **Smart Summary** - AI-powered detailed summaries using OpenAI (optional, requires API key)
- **Tech Stack Detection** - Automatically detects technologies from:
  - README files
  - Package files (package.json, pyproject.toml, requirements.txt, Cargo.toml, go.mod, Gemfile)
  - File tree structure
- **Language Statistics** - Programming languages with usage percentages
- **Topics & Tags** - Repository topics displayed as badges

### Repository Details

When you expand a repository card, you get access to:

- **Project Overview** - Repository summary and AI-powered smart summary
- **Tech Stack** - Detected technologies and frameworks
- **Basic Information** - Default branch, visibility, license, repository size
- **Timeline** - Created date and last pushed date
- **Features & Settings** - Issues, Projects, Wiki, Pages, Discussions, Forking status
- **Merge Settings** - Squash merge, merge commit, rebase merge, auto-merge options
- **Statistics** - Stars, forks, watchers, open issues, fork network size
- **Clone URLs** - HTTPS, SSH, and Git URLs with one-click copy
- **Topics & Languages** - Repository topics and top programming languages
- **Pull Requests** - Grouped by base branch with recent activity

### Pull Request Analytics

- **PR Metrics Dashboard** - Comprehensive PR statistics and insights
- **Total PRs** - Count of all pull requests
- **Success Rate** - Percentage of merged PRs
- **Average Review Time** - Time to first review in hours
- **Active Reviewers** - Most active PR reviewers with review counts
- **PR Size Distribution** - Breakdown by small (<100 lines), medium (100-500), and large (>500) PRs
- **Grouped by Base Branch** - PRs organized by target branch
- **Recent Activity** - Latest 5 PRs per branch with timestamps

### Repository Health Score

- **Overall Health Score** - 0-100 score with visual indicators
- **Score Breakdown** - Detailed metrics across 5 categories:
  - Documentation (0-30 points) - README quality, contributing guidelines, changelog
  - Maintenance (0-25 points) - Recent commits, commit frequency, CI/CD setup
  - Community (0-20 points) - Stars, forks, issue activity
  - Issue Response (0-15 points) - Response time and resolution rate
  - Code Quality (0-10 points) - Code quality indicators
- **Improvement Recommendations** - Actionable suggestions to improve repository health
- **Color-Coded Status** - Visual indicators (Excellent, Good, Fair, Needs Improvement)

### Code Quality Metrics

- **PR Review Times** - Average and median time to first review
- **Code Churn Analysis** - Track additions, deletions, and net changes over time
- **Average Churn per Commit** - Code change statistics
- **Dependency Health** - Track total, outdated, and latest dependencies
- **Quality Recommendations** - Suggestions for improving code quality
- **Interactive Charts** - Visual representation of code churn trends over time

### Comparison View

- **Multi-Profile Comparison** - Compare up to 3 GitHub profiles side-by-side
- **Side-by-Side Metrics** - Compare followers, repos, stars, and more
- **Language Comparison** - Compare programming language usage across profiles
- **Activity Comparison** - Compare contribution heatmaps and activity timelines
- **AI-Powered Comparison** - Get AI-generated insights comparing profiles (requires OpenAI API key)
- **Easy Management** - Add/remove profiles from comparison with one click

### User Experience

- **Loading States** - Skeleton loaders and clear feedback during data fetching
- **Error Handling** - User-friendly error messages
- **Scroll to Top** - Floating button appears on scroll
- **Copy to Clipboard** - One-click copy for clone URLs

## 🔒 Security

- **GitHub Token**: Stored server-side only, never exposed to client
- **OpenAI Key**: Stored in browser localStorage, never sent to our servers
- **Input Validation**: All inputs sanitized to prevent injection attacks
- **Error Sanitization**: Tokens never appear in error messages
- **Security Headers**: Production-grade security headers enabled
- **Graceful Degradation**: App works without tokens (with lower rate limits)

## 📝 Notes

- Repository summaries are heuristic-based and may not cover every tech stack
- Smart Summary feature requires OpenAI API key (pay-per-use)
- GitHub token is optional but recommended for better rate limits (5,000/hour vs 60/hour)
- All tokens are stored securely and never exposed in client-side code
- Contribution heatmap uses GitHub's official GraphQL API for accurate data
- Health scores and code quality metrics are calculated based on repository activity and metadata

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Modern styling
- **GitHub REST API** - Profile, repository, and PR data
- **GitHub GraphQL API** - Contribution calendar data
- **OpenAI API** - AI summaries and comparisons (optional)
- **Recharts** - Interactive charts and visualizations
- **React Markdown** - Markdown rendering for READMEs

---

Built with ❤️ by [Aniket Dutta](https://github.com/aniketduttaAD)
