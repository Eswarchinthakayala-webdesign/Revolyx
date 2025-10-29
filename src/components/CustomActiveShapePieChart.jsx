import React from "react";
import { PieChart, Pie, Sector, Tooltip, ResponsiveContainer } from "recharts";

// #region Sample data
const data = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
];
// #endregion

// Custom active slice renderer
const renderActiveShape = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >
        {`PV ${value}`}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

// Responsive Pie Chart
export default function CustomActiveShapePieChart({ isAnimationActive = true,palette }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart
     
        margin={{
          top: 50,
          right: 120,
          bottom: 0,
          left: 120,
        }}
      >
        <Pie
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          fill={palette[1]}
          dataKey="value"
          isAnimationActive={isAnimationActive}
        />
         <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      </PieChart>
      </ResponsiveContainer>
    
  );
}
