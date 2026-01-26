"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import SearchBar from "./components/SearchBar";
import ProfileHeader from "./components/ProfileHeader";
import StickyProfileHeader from "./components/StickyProfileHeader";
import RepoList from "./components/RepoList";
import ComparisonView from "./components/ComparisonView";
import ProfileAnalytics from "./components/ProfileAnalytics";
import AISettings from "./components/AISettings";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";
import ProfileSkeleton from "./components/skeletons/ProfileSkeleton";
import RepoCardSkeleton from "./components/skeletons/RepoCardSkeleton";
import type { GithubProfile, GithubRepo } from "@/lib/github/types";

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
      <div
        className={`mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 sm:gap-10 px-4 sm:px-6 py-8 sm:py-12 transition-all ${isStickyHeaderVisible ? "pt-20 sm:pt-24" : ""}`}
      >
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
            <button
              type="button"
              onClick={() => setShowAISettings(true)}
              className={`hidden sm:flex items-center gap-2 rounded-xl border border-[#cfdad7] bg-[#e9efee] px-4 py-2 text-sm font-semibold text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#d9e5e4] flex-shrink-0 shadow-sm ${showSmartButton ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Smart Summary</span>
            </button>
          </div>
          {/* Floating Smart button for mobile */}
          <button
            type="button"
            onClick={() => setShowAISettings(true)}
            className={`fixed top-4 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full border border-[#cfdad7] bg-[#e9efee] text-[#4f6d6a] transition-all hover:border-[#b8c6c3] hover:bg-[#d9e5e4] shadow-lg ${showSmartButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-100%] pointer-events-none"}`}
            aria-label="Smart Summary"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="max-w-2xl text-xs sm:text-sm text-[#6f665b]">
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

        {!profile && !loading && !error && comparisonProfiles.length === 0 && (
          <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-6 text-sm text-[#6f665b] shadow-sm">
            Enter a GitHub handle to begin the analysis.
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
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
