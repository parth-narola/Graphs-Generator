import { useState, useRef, useCallback } from "react";
import { toPng, toSvg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Plus, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = [
  "#8B1A4A",
  "#A83279",
  "#C74B8B",
  "#D4699E",
  "#E8A5C8",
  "#F0B8D4",
  "#F5C6DC",
  "#F8D5E5",
  "#FADCE9",
  "#FCE8F0",
];

interface PieDataPoint {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface PieChartConfig {
  title: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  isDonut: boolean;
  dataPoints: PieDataPoint[];
}

const defaultConfig: PieChartConfig = {
  title:
    "TestDino V2 spends less time on easy tasks,\nand more time on complex executions",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  isDonut: false,
  dataPoints: [
    { id: "1", name: "Playwright", value: 32, color: "#F5C6DC" },
    { id: "2", name: "Cypress", value: 21, color: "#F0B8D4" },
    { id: "3", name: "Selenium", value: 11, color: "#E8A5C8" },
    { id: "4", name: "Others", value: 11, color: "#D4699E" },
    { id: "5", name: "New Category", value: 7, color: "#C74B8B" },
    { id: "6", name: "New Category", value: 7, color: "#A83279" },
    { id: "7", name: "New Category", value: 7, color: "#8B1A4A" },
    { id: "8", name: "New Category", value: 7, color: "#6B1038" },
    { id: "9", name: "New Category", value: 7, color: "#4A0A28" },
  ],
};

const RADIAN = Math.PI / 180;

interface LabelInfo {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  name: string;
  fill: string;
  index: number;
}

function computeLabelPositions(labels: LabelInfo[]) {
  const PILL_HEIGHT = 28;
  const MIN_GAP = 4;

  // Split labels into left and right sides
  const rightLabels: (LabelInfo & { naturalY: number; adjustedY: number; pillAnchorX: number })[] = [];
  const leftLabels: (LabelInfo & { naturalY: number; adjustedY: number; pillAnchorX: number })[] = [];

  labels.forEach((l) => {
    const cosAngle = Math.cos(-l.midAngle * RADIAN);
    const sinAngle = Math.sin(-l.midAngle * RADIAN);
    const isRight = cosAngle >= 0;
    const pillRadius = l.outerRadius + 28;
    const pillAnchorX = l.cx + pillRadius * cosAngle;
    const naturalY = l.cy + pillRadius * sinAngle;

    const entry = { ...l, naturalY, adjustedY: naturalY, pillAnchorX };
    if (isRight) {
      rightLabels.push(entry);
    } else {
      leftLabels.push(entry);
    }
  });

  // Resolve overlaps for a group of labels on the same side
  function resolveOverlaps(group: typeof rightLabels) {
    // Sort by natural Y position
    group.sort((a, b) => a.naturalY - b.naturalY);

    // Push overlapping labels apart
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1];
      const curr = group[i];
      const overlap = (prev.adjustedY + PILL_HEIGHT / 2 + MIN_GAP) - (curr.adjustedY - PILL_HEIGHT / 2);
      if (overlap > 0) {
        curr.adjustedY += overlap;
      }
    }

    // If labels went too far down, push them back up
    if (group.length > 0) {
      const last = group[group.length - 1];
      const maxY = last.cy + last.outerRadius + 80;
      if (last.adjustedY > maxY) {
        const shift = last.adjustedY - maxY;
        for (const item of group) {
          item.adjustedY -= shift;
        }
        // Re-resolve going downward
        for (let i = 1; i < group.length; i++) {
          const prev = group[i - 1];
          const curr = group[i];
          const overlap = (prev.adjustedY + PILL_HEIGHT / 2 + MIN_GAP) - (curr.adjustedY - PILL_HEIGHT / 2);
          if (overlap > 0) {
            curr.adjustedY += overlap;
          }
        }
      }
    }
  }

  resolveOverlaps(rightLabels);
  resolveOverlaps(leftLabels);

  return [...rightLabels, ...leftLabels];
}

function renderAllLabels(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, name, fill, index } = props;

  const cosAngle = Math.cos(-midAngle * RADIAN);
  const sinAngle = Math.sin(-midAngle * RADIAN);
  const isRight = cosAngle >= 0;

  const lineStartRadius = outerRadius + 3;
  const x1 = cx + lineStartRadius * cosAngle;
  const y1 = cy + lineStartRadius * sinAngle;

  const pillRadius = outerRadius + 28;
  const pillAnchorX = cx + pillRadius * cosAngle;
  const pillAnchorY = cy + pillRadius * sinAngle;

  const lineEndRadius = pillRadius - 4;
  const x2 = cx + lineEndRadius * cosAngle;
  const y2 = cy + lineEndRadius * sinAngle;

  const percentText = `${(percent * 100).toFixed(0)}%`;
  const labelText = `${name} ${percentText}`;
  const textWidth = labelText.length * 7;
  const pillPadX = 14;
  const dotSize = 8;
  const dotGap = 6;
  const pillWidth = pillPadX + dotSize + dotGap + textWidth + pillPadX;
  const pillHeight = 28;
  const pillRx = pillHeight / 2;

  const pillX = isRight ? pillAnchorX - 2 : pillAnchorX - pillWidth + 2;
  const pillY = pillAnchorY - pillHeight / 2;

  const dotCx = isRight
    ? pillX + pillPadX + dotSize / 2
    : pillX + pillWidth - pillPadX - dotSize / 2;
  const textX = isRight
    ? dotCx + dotSize / 2 + dotGap
    : dotCx - dotSize / 2 - dotGap;

  // For small slices (< 4%), hide the label to avoid clutter
  if (percent < 0.04) {
    return null;
  }

  return (
    <g key={`label-${index}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C74B8B" strokeWidth={1} />
      <rect
        x={pillX}
        y={pillY}
        width={pillWidth}
        height={pillHeight}
        rx={pillRx}
        ry={pillRx}
        fill="#ffffff"
        stroke="#e0e0e0"
        strokeWidth={1}
      />
      <circle cx={dotCx} cy={pillAnchorY} r={dotSize / 2} fill={fill} />
      <text
        x={textX}
        y={pillAnchorY}
        textAnchor={isRight ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
        fill="#4a2040"
      >
        {labelText}
      </text>
    </g>
  );
}

export default function PieChartPage() {
  const [config, setConfig] = useState<PieChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof PieChartConfig>(
    key: K,
    value: PieChartConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateDataPoint = (
    id: string,
    field: keyof PieDataPoint,
    value: string | number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === id ? { ...dp, [field]: value } : dp,
      ),
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    const color =
      defaultColors[config.dataPoints.length % defaultColors.length];
    setConfig((prev) => ({
      ...prev,
      dataPoints: [
        ...prev.dataPoints,
        { id: newId, name: "New Category", value: 10, color },
      ],
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.filter((dp) => dp.id !== id),
    }));
  };

  const exportChart = useCallback(
    async (format: "png" | "svg") => {
      if (!chartRef.current) return;
      const node = chartRef.current;
      const originalBorder = node.style.border;
      node.style.border = "none";
      setIsExporting(true);
      try {
        const options = {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: config.backgroundColor,
          skipFonts: false,
          style: { margin: "0", transform: "none" },
        };
        const dataUrl =
          format === "svg"
            ? await toSvg(node, options)
            : await toPng(node, options);
        const link = document.createElement("a");
        link.download = `pie-chart.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error(err);
      } finally {
        node.style.border = originalBorder;
        setIsExporting(false);
      }
    },
    [config.backgroundColor],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-sans">Pie Chart Generator</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />{" "}
                  {isExporting ? "Exporting..." : "Export"}{" "}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportChart("png")}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChart("svg")}>
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDonut"
                      checked={config.isDonut}
                      onChange={(e) =>
                        updateConfig("isDonut", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <Label htmlFor="isDonut" className="cursor-pointer">
                      Donut Style
                    </Label>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Slice
                      </Button>
                    </div>
                    {config.dataPoints.map((dp, index) => (
                      <Card key={dp.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Slice {index + 1}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeDataPoint(dp.id)}
                            disabled={config.dataPoints.length <= 1}
                            className="text-destructive h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={dp.name}
                              onChange={(e) =>
                                updateDataPoint(dp.id, "name", e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Value</Label>
                            <Input
                              type="number"
                              value={dp.value}
                              onChange={(e) =>
                                updateDataPoint(
                                  dp.id,
                                  "value",
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Color</Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={dp.color}
                                onChange={(e) =>
                                  updateDataPoint(
                                    dp.id,
                                    "color",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-8 rounded cursor-pointer"
                              />
                              <Input
                                value={dp.color}
                                onChange={(e) =>
                                  updateDataPoint(
                                    dp.id,
                                    "color",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <div
                  ref={chartRef}
                  className="p-8 min-w-[600px] flex flex-col items-center"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                  }}
                >
                  <div className="flex items-start justify-between w-full mb-6">
                    <h2
                      className="text-lg font-bold leading-snug"
                      style={{ color: config.textColor, whiteSpace: "pre-line", maxWidth: "70%" }}
                    >
                      {config.title}
                    </h2>
                    <img src={testdinoLogo} alt="Logo" className="h-8 w-auto" />
                  </div>

                  <div style={{ width: "100%", height: "420px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={config.dataPoints}
                          cx="50%"
                          cy="50%"
                          innerRadius={config.isDonut ? 80 : 0}
                          outerRadius={130}
                          paddingAngle={1}
                          dataKey="value"
                          isAnimationActive={false}
                          stroke={config.backgroundColor}
                          strokeWidth={2}
                          label={renderAllLabels}
                          labelLine={false}
                        >
                          {config.dataPoints.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: "8px" }}
                          formatter={(value: number, name: string) => [
                            `${value}`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
