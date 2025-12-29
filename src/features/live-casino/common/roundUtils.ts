export const deriveRoundMeta = ({
  currentResult,
  odds,
  defaultStatus = "LIVE",
}: {
  currentResult?: any;
  odds?: any;
  defaultStatus?: string;
}) => {
  const latest = currentResult?.latestResult;
  const raw = odds?.rawData || odds?.raw || odds || {};

  const roundId =
    latest?.mid ||
    latest?.round ||
    latest?.round_id ||
    raw?.mid ||
    raw?.round_id ||
    raw?.round ||
    raw?.gmid ||
    null;

  const remainingCandidate =
    latest?.remaining ??
    latest?.timer ??
    latest?.lt ??
    raw?.remaining ??
    raw?.timeRemaining ??
    raw?.timer ??
    raw?.time ??
    raw?.lt ??
    0;

  const remainingSeconds = Number(remainingCandidate) || 0;

  const status =
    latest?.betStatus ||
    latest?.status ||
    raw?.status ||
    raw?.betStatus ||
    defaultStatus;

  return { roundId, remainingSeconds, status };
};

