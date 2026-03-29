import { ScoreDistribution } from "@/types/analytics";
import { motion } from "framer-motion";

interface DistributionChartProps {
  data: ScoreDistribution[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Map standard ranges to our UI labels
  const mappedData = [
    { label: "FAIL", count: data.find(d => d.scoreRange.includes("0-39"))?.count || 0 },
    { label: "BELOW AVG", count: data.find(d => d.scoreRange.includes("40-59"))?.count || 0 },
    { label: "AVERAGE", count: data.find(d => d.scoreRange.includes("60-79"))?.count || 0 },
    { label: "DISTINCTION", count: data.find(d => d.scoreRange.includes("80-100"))?.count || 0 },
  ];

  const maxCount = Math.max(...mappedData.map(d => d.count), 1); // Avoid division by zero
  const total = mappedData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-12">
        <h3 className="text-xl font-bold text-white tracking-tight">Score Distribution</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.8)]" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Students</span>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-4 mt-auto relative z-10 px-2">
        {mappedData.map((item, i) => {
          const heightPercent = total === 0 ? 10 : Math.max((item.count / maxCount) * 100, 10);
          const opacityScale = total === 0 ? 0.2 : 0.3 + (item.count / maxCount) * 0.7;

          return (
            <div key={item.label} className="flex flex-col items-center w-full group">
              <div
                className="w-full relative flex items-end justify-center"       
                style={{ height: "240px" }}
              >
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${heightPercent}%`, opacity: opacityScale }}
                  transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 50 }}
                  style={{ opacity: opacityScale }}
                  className="w-full rounded-t-[20px] transition-all duration-300 bg-gradient-to-t from-indigo-500 to-indigo-300 shadow-[0_0_30px_rgba(165,180,252,0.3)]"
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#131316] text-white text-xs font-bold py-1.5 px-3 rounded-lg border border-white/10 pointer-events-none">
                  {item.count} Student{item.count !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="h-px w-full bg-white/5 mt-4 mb-4" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
