import type { CredibilityTier } from "../types/feed";

const labels: Record<CredibilityTier, string> = {
  official: "Official",
  news: "News",
  community: "Community",
};

export function CredibilityChip({ tier }: { tier: CredibilityTier }) {
  return <span className={`cred-chip cred-chip--${tier}`}>{labels[tier]}</span>;
}
