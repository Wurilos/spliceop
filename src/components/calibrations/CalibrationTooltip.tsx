interface CalibrationTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CalibrationTooltip({ active, payload, label }: CalibrationTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl max-w-xs z-50">
      {label && <div className="font-medium mb-2">{label}</div>}
      {payload.map((entry: any, idx: number) => {
        // Try to get items from different possible locations in the payload
        const items = entry.payload?.items || 
                      entry.payload?.[`${entry.dataKey}_items`] || 
                      [];
        
        return (
          <div key={idx} className="mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div 
                className="h-2.5 w-2.5 rounded-sm shrink-0" 
                style={{ backgroundColor: entry.color || entry.payload?.color }}
              />
              <span>{entry.name}: <strong>{entry.value}</strong></span>
            </div>
            {items.length > 0 && items.length <= 10 && (
              <div className="ml-4 mt-1 text-muted-foreground">
                {items.map((item: string, i: number) => (
                  <div key={i}>• {item}</div>
                ))}
              </div>
            )}
            {items.length > 10 && (
              <div className="ml-4 mt-1 text-muted-foreground">
                <div>• {items.slice(0, 8).join(', ')}</div>
                <div className="italic">+{items.length - 8} outros...</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
