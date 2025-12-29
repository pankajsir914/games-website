import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BalanceProps {
  available?: number | null;
  locked?: number | null;
  currency?: string;
}

export const Balance = ({
  available = null,
  locked = null,
  currency = "₹",
}: BalanceProps) => {
  const formatAmount = (value: number | null) =>
    value === null || value === undefined
      ? "—"
      : `${currency}${value.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Available</span>
          <span className="font-semibold">{formatAmount(available)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Locked</span>
          <span className="font-semibold">{formatAmount(locked)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

