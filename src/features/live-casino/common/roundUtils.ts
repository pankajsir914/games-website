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
  const historyFirst =
    Array.isArray(currentResult?.results) && currentResult.results.length > 0
      ? currentResult.results[0]
      : null;
  const raw = odds?.rawData || odds?.raw || odds || {};

  const roundId =
    raw?.mid ||
    raw?.round_id ||
    raw?.round ||
    raw?.gmid ||
    raw?.game_id ||
    latest?.mid ||
    latest?.round ||
    latest?.round_id ||
    historyFirst?.mid ||
    historyFirst?.round ||
    historyFirst?.round_id ||
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

