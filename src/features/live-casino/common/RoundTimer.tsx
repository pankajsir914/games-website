import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RoundTimerProps {
  status?: string;
  remainingSeconds?: number;
  roundId?: string | number | null;
}

const clampSeconds = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return 0;
  return Math.max(0, Math.min(seconds, 60));
};

export const RoundTimer = ({
  status = "LIVE",
  remainingSeconds = 0,
  roundId,
}: RoundTimerProps) => {
  const safeSeconds = clampSeconds(remainingSeconds);
  const pct = Math.min(100, (safeSeconds / 60) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Round Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold uppercase">{status}</span>
        </div>
        {roundId && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Round</span>
            <span className="font-mono text-xs text-white/80">#{roundId}</span>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Time left</span>
            <span className="font-mono text-xs text-white/80">
              {safeSeconds ? `${safeSeconds}s` : "—"}
            </span>
          </div>
          <Progress value={pct} className="h-2 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};

