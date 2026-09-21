import { GuideView } from "@/ui/guide/guide-view";

interface GuideSearchParams {
  goal?: string;
}

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<GuideSearchParams>;
}) {
  const { goal } = await searchParams;
  return <GuideView initialGoal={goal ?? ""} />;
}