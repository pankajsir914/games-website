export function normalizeOdds(apiData: any) {
  if (!apiData?.data?.sub) {
    return { bets: [] };
  }
  
  const bets: any[] = [];

  apiData.data.sub.forEach((item: any) => {
    // 1️⃣ Simple markets (Player A / B / Suit etc)
    if (!item.odds || item.odds === null) {
      if (item.b && item.b > 0) {
        bets.push({
          sid: item.sid,
          type: item.nat,
          back: Number(item.b),
          lay: Number(item.l) || 0,
          status: item.gstatus === "OPEN" ? "open" : "suspended",
          min: item.min,
          max: item.max,
        });
      }
      return;
    }

    // 2️⃣ Fancy markets (Odd / Even etc)
    if (Array.isArray(item.odds)) {
      item.odds.forEach((o: any) => {
        if (o.b && o.b > 0) {
          bets.push({
            sid: `${item.sid}-${o.sid}`,
            type: `${item.nat} - ${o.nat}`,
            back: Number(o.b),
            lay: 0,
            status: item.gstatus === "OPEN" ? "open" : "suspended",
            min: item.min,
            max: item.max,
          });
        }
      });
    }
  });

  return { bets };
}
