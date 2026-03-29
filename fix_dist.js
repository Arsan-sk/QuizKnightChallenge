const fs = require('fs');
let code = fs.readFileSync('server/routes.ts', 'utf8');

const replacement =         const performanceDistribution = [
          { scoreRange: "0-34%", count: scores.filter(s => s < 35).length },
          { scoreRange: "35-44%", count: scores.filter(s => s >= 35 && s < 45).length },
          { scoreRange: "45-69%", count: scores.filter(s => s >= 45 && s < 70).length },
          { scoreRange: "70-89%", count: scores.filter(s => s >= 70 && s < 90).length },
          { scoreRange: "90-100%", count: scores.filter(s => s >= 90).length }
        ];;

code = code.replace(/const performanceDistribution = \[\s*\{\s*scoreRange.*?\];/s, replacement);
fs.writeFileSync('server/routes.ts', code);
console.log('Replaced routes');

let chartCode = fs.readFileSync('client/src/components/analytics/DistributionChart.tsx', 'utf8');
const chartReplacement =   const mappedData = [
    { label: "FAIL", count: data.find(d => d.scoreRange.includes("0-34"))?.count || 0 },
    { label: "BELOW AVG", count: data.find(d => d.scoreRange.includes("35-44"))?.count || 0 },
    { label: "AVERAGE", count: data.find(d => d.scoreRange.includes("45-69"))?.count || 0 },
    { label: "ABOVE AVG", count: data.find(d => d.scoreRange.includes("70-89"))?.count || 0 },
    { label: "DISTINCTION", count: data.find(d => d.scoreRange.includes("90-100"))?.count || 0 },
  ];;
chartCode = chartCode.replace(/const mappedData = \[\s*\{\s*label: "FAIL".*?\];/s, chartReplacement);
fs.writeFileSync('client/src/components/analytics/DistributionChart.tsx', chartCode);
console.log('Replaced Chart');
