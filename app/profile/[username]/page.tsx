import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProfileHeader from "@/app/components/ProfileHeader";
import ProfileAnalytics from "@/app/components/ProfileAnalytics";
import RepoList from "@/app/components/RepoList";
import { githubJson } from "@/lib/github/client";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");

  try {
    const profile = await githubJson<GithubProfile>(`/users/${sanitizedUsername}`).catch(
      () => null
    );

    if (!profile) {
      return {
        title: `Profile Not Found - GitLyser`,
      };
    }

    const title = `${profile.name || profile.login} - GitLyser Profile`;
    const description =
      profile.bio ||
      `GitHub profile for ${profile.login}. ${profile.public_repos} repositories, ${profile.followers} followers.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        images: [
          {
            url: profile.avatar_url,
            width: 400,
            height: 400,
            alt: `${profile.login} avatar`,
          },
        ],
        url: `${process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/profile/${profile.login}`,
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: [profile.avatar_url],
      },
    };
  } catch {
    return {
      title: `Profile Not Found - GitLyser`,
    };
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");

  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    notFound();
  }

  let profile: GithubProfile;
  let repos: GithubRepo[];

  try {
    profile = await githubJson<GithubProfile>(`/users/${sanitizedUsername}`);
    const repoPath =
      profile.type === "Organization"
        ? `/orgs/${sanitizedUsername}/repos`
        : `/users/${sanitizedUsername}/repos`;
    repos = await githubJson<GithubRepo[]>(`${repoPath}?per_page=100&sort=updated`);
  } catch (error) {
    console.error("Failed to load profile:", error);
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f2ec] text-[#2f2a24]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 sm:gap-10 px-4 sm:px-6 py-8 sm:py-12">
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <Image
              src="/icon.png"
              alt="GitLyser"
              width={64}
              height={64}
              className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-1 shadow-sm"
            />
            <div className="flex-1 space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#2f2a24] md:text-4xl">
                GitLyser
              </h1>
              <p className="text-xs sm:text-sm text-[#6f665b]">GitHub Profile Analyzer</p>
            </div>
          </div>
        </header>

        <ProfileHeader profile={profile} />

        <ProfileAnalytics repos={repos} profile={profile} />

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2f2a24]">Repositories</h2>
          <RepoList repos={repos} owner={profile.login} openaiKey="" />
        </div>
      </div>
    </div>
  );
}
