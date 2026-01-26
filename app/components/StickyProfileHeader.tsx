"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BookOpen, Users, User, MapPin, Building2 } from "lucide-react";
import type { GithubProfile } from "@/lib/github/types";

type StickyProfileHeaderProps = {
  profile: GithubProfile;
  onStickyChange?: (isSticky: boolean) => void;
};

export default function StickyProfileHeader({ profile, onStickyChange }: StickyProfileHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const newSticky = scrollPosition > 200;
      setIsSticky(newSticky);
      onStickyChange?.(newSticky);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onStickyChange]);

  if (!isSticky) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-[#e2d6c8] bg-[#fbf7f0] shadow-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
        <Image
          src={profile.avatar_url}
          alt={`${profile.login} avatar`}
          width={40}
          height={40}
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-full border border-[#e2d6c8] object-cover"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-[#2f2a24]">
            {profile.name ?? profile.login}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={profile.html_url}
              className="text-xs text-[#4f6d6a] hover:text-[#3f5d5a] truncate"
              target="_blank"
              rel="noreferrer"
            >
              @{profile.login}
            </a>
            {profile.location && (
              <span className="hidden md:flex items-center gap-1 text-xs text-[#6f665b]">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span className="truncate max-w-[120px]">{profile.location}</span>
              </span>
            )}
            {profile.company && (
              <span className="hidden lg:flex items-center gap-1 text-xs text-[#6f665b]">
                <Building2 className="h-3 w-3" aria-hidden="true" />
                <span className="truncate max-w-[100px]">{profile.company}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#6f665b] overflow-hidden">
          <div className="flex items-center gap-1 min-w-0">
            <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{profile.public_repos}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{profile.followers}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 min-w-0">
            <User className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{profile.following}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
