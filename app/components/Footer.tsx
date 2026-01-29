"use client";

import { LuLinkedin, LuMail, LuGithub } from "react-icons/lu";

export default function Footer() {
  const githubUrl = "https://github.com/aniketduttaAD";
  const linkedinUrl = "https://linkedin.com/in/aniket-dutta";
  const email = "mailto:helloaniketdutta@gmail.com";

  return (
    <footer className="border-t border-[#e2d6c8] bg-[#fbf7f0] mt-auto">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-[#6f665b]">
          <div className="flex items-center gap-4">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-[#e2d6c8] bg-[#fffdf8] text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#f3ede4] hover:text-[#3f5d5a]"
              aria-label="GitHub Profile"
            >
              <LuGithub className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-[#e2d6c8] bg-[#fffdf8] text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#f3ede4] hover:text-[#3f5d5a]"
              aria-label="LinkedIn Profile"
            >
              <LuLinkedin className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={email}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-[#e2d6c8] bg-[#fffdf8] text-[#4f6d6a] transition hover:border-[#b8c6c3] hover:bg-[#f3ede4] hover:text-[#3f5d5a]"
              aria-label="Email"
            >
              <LuMail className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
