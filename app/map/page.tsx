import { MapView } from "@/ui/map/map-view";

interface MapSearchParams {
  goal?: string;
  level?: string;
  goalKind?: string;
  depth?: string;
  hours?: string;
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<MapSearchParams>;
}) {
  const { goal, level, goalKind, depth, hours } = await searchParams;
  return (
    <MapView
      goal={goal ?? ""}
      level={level}
      goalKind={goalKind}
      depth={depth}
      hours={hours}
    />
  );
}
