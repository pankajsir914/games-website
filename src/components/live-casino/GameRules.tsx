import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";

const sectionTitleMap = {
  main: "Game Rules",
  players: "Player Rules",
  banker: "Banker Rules",
  side: "Side Bets",
};

const GameRules = ({ tableId }) => {
  const { fetchCasinoRules } = useDiamondCasino();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tableId) return;

    const loadRules = async () => {
      setLoading(true);
      setError(null);

      const { rules, error } = await fetchCasinoRules(tableId);

      if (error) {
        setError(error);
      } else {
        setRules(rules || []);
      }

      setLoading(false);
    };

    loadRules();
  }, [tableId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 py-10">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  if (!rules.length) {
    return (
      <p className="text-muted-foreground py-10">
        No rules available
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {rules.map((rule, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-base">
              {sectionTitleMap[rule.stype] || rule.stype}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rules-wrapper"
              dangerouslySetInnerHTML={{ __html: rule.rules }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GameRules;
