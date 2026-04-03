import type { MetaFile } from "../types";
import { useTheme } from "../ThemeProvider";

interface HeaderProps {
  meta: MetaFile | null;
}

export default function Header({ meta }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const ariaLabel =
    theme === "system"
      ? "Currently system preference — click to switch to light mode"
      : theme === "light"
        ? "Currently light mode — click to switch to dark mode"
        : "Currently dark mode — click to switch to system preference";

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Australian Mortgage Rate Comparator
          </h1>
          {meta && (
            <p className="mt-1 text-sm md:text-base text-indigo-200">
              {meta.bankCount} banks &middot; {meta.rateCount} rates &middot; Updated{" "}
              {new Date(meta.generatedAt).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <button
          onClick={cycleTheme}
          className="self-start md:self-auto p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={ariaLabel}
        >
          {theme === "system" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ) : theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
