import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";

/* ===============================
   SECTION TITLES
================================ */
const sectionTitleMap: Record<string, string> = {
  main: "Game Rules",
  players: "Player Rules",
  banker: "Banker Rules",
  sidebets: "Side Bets",
  side: "Side Bets",
};

/* ===============================
   HTML SANITIZER
================================ */
const sanitizeHTML = (html: string): string => {
  if (!html) return "";

  let sanitized = html;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/data:text\/html/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed[\s\S]*?<\/embed>/gi, "");

  return sanitized;
};

/* ===============================
   🔹 SKELETON COMPONENT
================================ */
const RulesSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-[95%] bg-muted animate-pulse rounded" />
            <div className="h-3 w-[90%] bg-muted animate-pulse rounded" />
            <div className="h-3 w-[85%] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ===============================
   COMPONENT
================================ */
const GameRules = ({ tableId }: { tableId: string }) => {
  const { fetchCasinoRules } = useDiamondCasino();

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 StrictMode double-call fix
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!tableId || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    setLoading(true);
    setError(null);

    fetchCasinoRules(tableId)
      .then(({ rules, error }) => {
        if (error) {
          setError(error);
          setRules([]);
        } else {
          setRules(rules || []);
        }
      })
      .catch((err: any) => {
        setError(err?.message || "Failed to load rules");
        setRules([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tableId, fetchCasinoRules]);

  /* ===============================
     SANITIZE ONCE
  ================================ */
  const sanitizedRules = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      safeHTML: sanitizeHTML(rule.rules || ""),
    }));
  }, [rules]);

  /* ===============================
     STATES
  ================================ */
  if (loading) {
    return <RulesSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 py-10">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  if (sanitizedRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-center text-base">
          Rules not found
        </p>
      </div>
    );
  }

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="space-y-4 sm:space-y-6">
      {sanitizedRules.map((rule, idx) => (
        <Card key={`${rule.stype}-${idx}`} className="shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold">
              {sectionTitleMap[rule.stype] || rule.stype}
            </h3>
          </CardHeader>

          <CardContent>
            <div
              className="casino-rules-content text-xs sm:text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: rule.safeHTML }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GameRules;
