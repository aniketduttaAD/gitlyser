"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { LuSparkles } from "react-icons/lu";
import SearchBar from "./components/SearchBar";
import ProfileHeader from "./components/ProfileHeader";
import StickyProfileHeader from "./components/StickyProfileHeader";
import RepoList from "./components/RepoList";
import AISettings from "./components/AISettings";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";
import MetricsInfoModal from "./components/MetricsInfoModal";
import ProfileSkeleton from "./components/skeletons/ProfileSkeleton";
import RepoCardSkeleton from "./components/skeletons/RepoCardSkeleton";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

const ComparisonView = dynamic(() => import("./components/ComparisonView"), {
  loading: () => (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-6 text-sm text-[#6f665b] shadow-sm">
      Loading comparison...
    </div>
  ),
  ssr: false,
});

const ProfileAnalytics = dynamic(() => import("./components/ProfileAnalytics"), {
  loading: () => (
    <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-6 text-sm text-[#6f665b] shadow-sm">
      Loading analytics...
    </div>
  ),
  ssr: false,
});

type ProfileResponse = {
  profile: GithubProfile;
  repos: GithubRepo[];
};

export default function Home() {
  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false);
  const [showSmartButton, setShowSmartButton] = useState(true);
  const [comparisonProfiles, setComparisonProfiles] = useState<GithubProfile[]>([]);
  const [comparisonRepos, setComparisonRepos] = useState<GithubRepo[][]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("openai_api_key");
    if (stored) {
      setOpenaiKey(stored);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowSmartButton(scrollPosition < 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSaveAIKey = (key: string) => {
    setOpenaiKey(key);
    if (key) {
      localStorage.setItem("openai_api_key", key);
    } else {
      localStorage.removeItem("openai_api_key");
    }
    setShowAISettings(false);
  };

  const handleSearch = async (username: string) => {
    setComparisonProfiles([]);
    setComparisonRepos([]);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/github/profile?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to fetch profile.");
      }
      const data = (await response.json()) as ProfileResponse;
      setProfile(data.profile);
      setRepos(data.repos);
    } catch (err) {
      setProfile(null);
      setRepos([]);
      setError(err instanceof Error ? err.message : "Unable to fetch profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (username: string) => {
    if (comparisonProfiles.length >= 2) {
      setError("Maximum 2 profiles can be compared at once.");
      return;
    }

    setProfile(null);
    setRepos([]);

    setComparisonLoading(true);
    setError(null);
    try {
      if (profile && profile.login.toLowerCase() === username.toLowerCase()) {
        if (comparisonProfiles.some((p) => p.login === profile.login)) {
          setError("Profile already in comparison.");
          setComparisonLoading(false);
          return;
        }
        setComparisonProfiles([...comparisonProfiles, profile]);
        setComparisonRepos([...comparisonRepos, repos]);
        setComparisonLoading(false);
        return;
      }

      const response = await fetch(`/api/github/profile?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to fetch profile.");
      }
      const data = (await response.json()) as ProfileResponse;

      if (comparisonProfiles.some((p) => p.login === data.profile.login)) {
        setError("Profile already in comparison.");
        setComparisonLoading(false);
        return;
      }

      setComparisonProfiles([...comparisonProfiles, data.profile]);
      setComparisonRepos([...comparisonRepos, data.repos]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add profile to comparison.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleRemoveComparison = (index: number) => {
    setComparisonProfiles(comparisonProfiles.filter((_, i) => i !== index));
    setComparisonRepos(comparisonRepos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f2ec] text-[#2f2a24]">
      {profile && (
        <StickyProfileHeader profile={profile} onStickyChange={setIsStickyHeaderVisible} />
      )}
      <main
        className={`mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 sm:gap-10 px-4 sm:px-6 py-8 sm:py-12 transition-all ${isStickyHeaderVisible ? "pt-20 sm:pt-24" : ""}`}
      >
        <header className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Image
              src="/icon.png"
              alt="GitLyser"
              width={64}
              height={64}
              className="h-8 w-8 sm:h-16 sm:w-16 flex-shrink-0 rounded-lg sm:rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-0.5 sm:p-1 shadow-sm"
            />
            <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
              <h1 className="text-lg sm:text-3xl font-semibold text-[#2f2a24] md:text-4xl leading-tight">
                GitLyser
              </h1>
              <p className="text-[0.65rem] sm:text-sm text-[#6f665b] leading-tight">
                GitHub Profile Analyzer
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAISettings(true)}
                className={`flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-[#cfdad7] bg-[#e9efee] px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] shadow-sm ${showSmartButton ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <LuSparkles className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Smart Summary</span>
              </button>
              <MetricsInfoModal />
            </div>
          </div>
          <p className="max-w-2xl text-[0.7rem] sm:text-sm text-[#6f665b] leading-relaxed hidden sm:block">
            Surface the story behind any GitHub profile. Search for a user or organization to
            explore repository summaries, tech stack signals, and pull request activity grouped by
            base branch.
          </p>
        </header>

        {showAISettings && (
          <AISettings
            currentKey={openaiKey}
            onSave={handleSaveAIKey}
            onClose={() => setShowAISettings(false)}
          />
        )}

        <SearchBar
          onSearch={handleSearch}
          onCompare={handleCompare}
          loading={loading || comparisonLoading}
          showCompare={true}
        />

        {error && (
          <div className="rounded-2xl border border-[#efc6c0] bg-[#f9ebe8] p-4 text-sm text-[#a24f45] shadow-sm">
            {error}
          </div>
        )}

        {loading && (
          <>
            <ProfileSkeleton />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <RepoCardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {comparisonProfiles.length > 0 && (
          <ComparisonView
            profiles={comparisonProfiles}
            reposList={comparisonRepos}
            onRemove={handleRemoveComparison}
            openaiKey={openaiKey}
          />
        )}

        {profile && !loading && comparisonProfiles.length === 0 && (
          <>
            <ProfileHeader profile={profile} />
            <ProfileAnalytics repos={repos} profile={profile} />
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2f2a24]">Repositories</h2>
              <RepoList repos={repos} owner={profile.login} openaiKey={openaiKey} />
            </div>
          </>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
