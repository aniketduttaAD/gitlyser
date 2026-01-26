import Image from "next/image";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Globe,
  MapPin,
  Twitter,
  User,
  Users,
  Star,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { GithubProfile } from "@/lib/github/types";

type ProfileHeaderProps = {
  profile: GithubProfile;
};

const normalizeUrl = (value: string) => {
  if (!value) {
    return value;
  }
  return value.startsWith("http") ? value : `https://${value}`;
};

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const blogUrl = profile.blog ? normalizeUrl(profile.blog) : null;
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const lastUpdated = new Date(profile.updated_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <section className="flex flex-col gap-4 sm:gap-5 rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm md:flex-row md:items-center overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
        <Image
          src={profile.avatar_url}
          alt={`${profile.login} avatar`}
          width={80}
          height={80}
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-[#e2d6c8] object-cover shadow-sm flex-shrink-0"
          unoptimized
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="text-lg sm:text-xl font-semibold text-[#2f2a24] truncate">
            {profile.name ?? profile.login}
          </h2>
          <a
            href={profile.html_url}
            className="text-xs sm:text-sm text-[#4f6d6a] hover:text-[#3f5d5a] truncate block"
            target="_blank"
            rel="noreferrer"
          >
            @{profile.login}
          </a>
          <p className="mt-1 text-xs uppercase tracking-wide text-[#7a7064] truncate">
            {profile.type}
          </p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4 text-sm text-[#6f665b] sm:grid-cols-3">
        {[
          { label: "Repos", value: profile.public_repos, Icon: BookOpen },
          { label: "Followers", value: profile.followers, Icon: Users },
          { label: "Following", value: profile.following, Icon: User },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] px-3 sm:px-4 py-3 sm:py-4 min-w-0 overflow-hidden transition hover:shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#6f665b]"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm uppercase tracking-wide text-[#7a7064] leading-tight truncate min-w-0 flex-1 font-medium">
                {label}
              </span>
            </div>
            <p className="mt-2 sm:mt-2.5 text-base sm:text-lg md:text-xl font-semibold text-[#2f2a24] truncate">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm text-[#6f665b] md:max-w-xs min-w-0 overflow-hidden">
        {profile.bio && <p className="text-[#5f564d]">{profile.bio}</p>}
        <div className="flex flex-wrap gap-2 text-xs text-[#6f665b]">
          {profile.company && (
            <span className="flex items-center gap-2 rounded-full border border-[#e2d6c8] bg-[#fffdf8] px-3 py-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.company}
            </span>
          )}
          {profile.location && (
            <span className="flex items-center gap-2 rounded-full border border-[#e2d6c8] bg-[#fffdf8] px-3 py-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.location}
            </span>
          )}
          {blogUrl && (
            <a
              href={blogUrl}
              className="flex items-center gap-2 rounded-full border border-[#cfdad7] bg-[#e9efee] px-3 py-1 text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:text-[#3f5d5a]"
              target="_blank"
              rel="noreferrer"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.blog}
            </a>
          )}
          {profile.twitter_username && (
            <a
              href={`https://twitter.com/${profile.twitter_username}`}
              className="flex items-center gap-2 rounded-full border border-[#cfdad7] bg-[#e9efee] px-3 py-1 text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:text-[#3f5d5a]"
              target="_blank"
              rel="noreferrer"
            >
              <Twitter className="h-3.5 w-3.5" aria-hidden="true" />@{profile.twitter_username}
            </a>
          )}
          <span className="flex items-center gap-2 rounded-full border border-[#e2d6c8] bg-[#fffdf8] px-3 py-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Member since {memberSince}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-[#e2d6c8] bg-[#fffdf8] px-3 py-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Updated {lastUpdated}
          </span>
          {profile.hireable && (
            <span className="flex items-center gap-2 rounded-full border border-[#cfe2d1] bg-[#eff6f0] px-3 py-1 text-[#426a4b]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Open to work
            </span>
          )}
          {profile.suspended_at && (
            <span className="flex items-center gap-2 rounded-full border border-[#efc6c0] bg-[#f9ebe8] px-3 py-1 text-[#a24f45]">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Suspended {new Date(profile.suspended_at).toLocaleDateString()}
            </span>
          )}
          {profile.starred_url && (
            <a
              href={`https://github.com/${profile.login}?tab=stars`}
              className="flex items-center gap-2 rounded-full border border-[#cfdad7] bg-[#e9efee] px-3 py-1 text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:text-[#3f5d5a]"
              target="_blank"
              rel="noreferrer"
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              Starred repos
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
