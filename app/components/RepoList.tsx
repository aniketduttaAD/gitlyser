import type { GithubRepo } from "@/lib/github/types";
import RepoCard from "./RepoCard";

type RepoListProps = {
  repos: GithubRepo[];
  owner: string;
  openaiKey: string;
};

export default function RepoList({ repos, owner, openaiKey }: RepoListProps) {
  if (!repos.length) {
    return (
      <div className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-6 text-sm text-[#6f665b] shadow-sm">
        No repositories found for this profile.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} owner={owner} openaiKey={openaiKey} />
      ))}
    </div>
  );
}
