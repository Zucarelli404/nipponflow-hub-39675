import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SparkPoint = { label: string; value: number };

type KPIStatCardProps = {
  title: string;
  icon: ReactNode;
  value: string | number;
  subtext?: string;
  sparkline?: SparkPoint[];
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

export default function KPIStatCard({
  title,
  icon,
  value,
  subtext,
  sparkline = [],
  lineColor = "#0ea5e9",
  gradientFrom = "rgba(14,165,233,0.25)",
  gradientTo = "rgba(14,165,233,0)",
}: KPIStatCardProps) {
  const hasData = sparkline && sparkline.length > 0;

  const gradientId = useMemo(() => `grad-${title.replace(/\s+/g, "-").toLowerCase()}`,[title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
   >
      <Card className="h-full border-border/60">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {subtext && (
            <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
          )}

          <div className="h-16 mt-3">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradientFrom} />
                      <stop offset="100%" stopColor={gradientTo} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip cursor={{ strokeDasharray: "4 4" }} formatter={(val) => `${val}`} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Sem dados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
