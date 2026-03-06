import { useState, useRef, useCallback, useEffect } from "react";
import { toPng, toSvg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Plus, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = ["#22c55e", "#be185d", "#7c3aed", "#e8a5d0", "#6b8e9c", "#d4a574"];

interface LineSeries {
  id: string;
  name: string;
  color: string;
  lineStyle: "solid" | "dashed" | "dotted";
  lineWidth: number;
}

interface DataPoint {
  id: string;
  label: string;
  values: Record<string, number>;
}

interface LineChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  yAxisMax: number;
  yAxisStep: number;
  valueFormat: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  labelColor: string;
  gridColor: string;
  showGrid: boolean;
  showLegend: boolean;
  showDots: boolean;
  showDataLabels: boolean;
  pointRadius: number;
  series: LineSeries[];
  dataPoints: DataPoint[];
}

const defaultConfig: LineChartConfig = {
  title: "Performance Trends Over Time",
  xAxisLabel: "Timeline",
  yAxisLabel: "Score",
  yAxisMax: 100,
  yAxisStep: 20,
  valueFormat: "",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#1a1a2e",
  labelColor: "#374151",
  gridColor: "#e5e7eb",
  showGrid: true,
  showLegend: true,
  showDots: true,
  showDataLabels: false,
  pointRadius: 5,
  series: [
    { id: "s1", name: "Playwright", color: "#22c55e", lineStyle: "solid", lineWidth: 2.5 },
    { id: "s2", name: "Selenium", color: "#be185d", lineStyle: "solid", lineWidth: 2.5 },
    { id: "s3", name: "Cypress", color: "#4338ca", lineStyle: "solid", lineWidth: 2.5 },
  ],
  dataPoints: [
    { id: "1", label: "Jan", values: { s1: 38, s2: 17, s3: 30 } },
    { id: "2", label: "Feb", values: { s1: 65, s2: 40, s3: 26 } },
    { id: "3", label: "March", values: { s1: 85, s2: 62, s3: 24 } },
    { id: "4", label: "Apr", values: { s1: 77, s2: 59, s3: 10 } },
    { id: "5", label: "May", values: { s1: 62, s2: 40, s3: 10 } },
    { id: "6", label: "June", values: { s1: 58, s2: 42, s3: 28 } },
  ],
};

function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function getStrokeDasharray(style: string): string {
  if (style === "dashed") return "8 8";
  if (style === "dotted") return "3 3";
  return "";
}

export default function CombinedLineChart() {
  const [config, setConfig] = useState<LineChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const [dynamicWidth, setDynamicWidth] = useState(700);
  const chartRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!svgContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const minRequiredWidth = Math.max(700, config.dataPoints.length * 80);
      if (entries[0]) {
        setDynamicWidth(Math.max(minRequiredWidth, entries[0].contentRect.width));
      }
    });
    observer.observe(svgContainerRef.current);
    return () => observer.disconnect();
  }, [config.dataPoints.length]);

  const chartHeight = 450;
  const padding = { top: 40, right: 40, bottom: 60, left: 20 };
  const minimumWidth = Math.max(700, config.dataPoints.length * 80);
  const svgWidth = Math.max(minimumWidth, dynamicWidth);
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const yAxisTicks: number[] = [];
  for (let i = 0; i <= config.yAxisMax; i += config.yAxisStep) {
    yAxisTicks.push(i);
  }

  const getX = (index: number) => {
    if (config.dataPoints.length === 0) return padding.left;
    const step = plotWidth / config.dataPoints.length;
    return padding.left + step * (index + 0.5);
  };

  const getY = (value: number) => {
    return padding.top + plotHeight - (value / config.yAxisMax) * plotHeight;
  };

  const updateConfig = <K extends keyof LineChartConfig>(
    key: K,
    value: LineChartConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addSeries = () => {
    const newId = `s${Date.now()}`;
    const color = defaultColors[config.series.length % defaultColors.length];
    setConfig((prev) => ({
      ...prev,
      series: [
        ...prev.series,
        {
          id: newId,
          name: `Series ${prev.series.length + 1}`,
          color,
          lineStyle: "solid",
          lineWidth: 2.5,
        },
      ],
      dataPoints: prev.dataPoints.map((dp) => ({
        ...dp,
        values: { ...dp.values, [newId]: 50 },
      })),
    }));
  };

  const updateSeries = (
    id: string,
    field: keyof LineSeries,
    value: string | number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSeries = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      series: prev.series.filter((s) => s.id !== id),
      dataPoints: prev.dataPoints.map((dp) => {
        const newValues = { ...dp.values };
        delete newValues[id];
        return { ...dp, values: newValues };
      }),
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    const initialValues: Record<string, number> = {};
    config.series.forEach((s) => (initialValues[s.id] = 50));
    setConfig((prev) => ({
      ...prev,
      dataPoints: [
        ...prev.dataPoints,
        { id: newId, label: "New", values: initialValues },
      ],
    }));
  };

  const updateDataPoint = (pointId: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === pointId ? { ...dp, [field]: value } : dp,
      ),
    }));
  };

  const updateDataPointValue = (
    pointId: string,
    seriesId: string,
    value: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === pointId
          ? { ...dp, values: { ...dp.values, [seriesId]: value } }
          : dp,
      ),
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.filter((dp) => dp.id !== id),
    }));
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
  };

  const exportChart = useCallback(
    async (format: "png" | "svg") => {
      if (!chartRef.current) return;
      setIsExporting(true);
      const node = chartRef.current;
      const originalBorder = node.style.border;
      node.style.border = "none";
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
        link.download = `line-chart.${format}`;
        link.href = dataUrl;
        link.click();
        toast({
          title: "Export Successful",
          description: `Your chart has been exported as ${format.toUpperCase()}`,
        });
      } catch (err) {
        console.error("Export failed:", err);
        toast({
          title: "Export Failed",
          description: "There was an error exporting the chart",
          variant: "destructive",
        });
      } finally {
        node.style.border = originalBorder;
        setIsExporting(false);
      }
    },
    [config.backgroundColor, toast],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Line Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefault}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isExporting} data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => exportChart("png")}
                  data-testid="export-png"
                >
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportChart("svg")}
                  data-testid="export-svg"
                >
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={config.xAxisLabel}
                        onChange={(e) =>
                          updateConfig("xAxisLabel", e.target.value)
                        }
                        data-testid="input-xaxis"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={config.yAxisLabel}
                        onChange={(e) =>
                          updateConfig("yAxisLabel", e.target.value)
                        }
                        data-testid="input-yaxis"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Max</Label>
                      <Input
                        type="number"
                        value={config.yAxisMax}
                        onChange={(e) =>
                          updateConfig("yAxisMax", Number(e.target.value))
                        }
                        data-testid="input-y-max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Step</Label>
                      <Input
                        type="number"
                        value={config.yAxisStep}
                        onChange={(e) =>
                          updateConfig("yAxisStep", Number(e.target.value))
                        }
                        data-testid="input-y-step"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Value Suffix</Label>
                    <Input
                      value={config.valueFormat}
                      onChange={(e) =>
                        updateConfig("valueFormat", e.target.value)
                      }
                      placeholder="e.g., K, B, %"
                      data-testid="input-format"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Point Size</Label>
                      <Input
                        type="number"
                        value={config.pointRadius}
                        onChange={(e) =>
                          updateConfig("pointRadius", Number(e.target.value))
                        }
                        min={2}
                        max={15}
                        data-testid="input-point-size"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Display Options
                    </Label>
                    <div className="flex items-center justify-between">
                      <Label>Show Grid</Label>
                      <Switch
                        checked={config.showGrid}
                        onCheckedChange={(checked) =>
                          updateConfig("showGrid", checked)
                        }
                        data-testid="switch-grid"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Legend</Label>
                      <Switch
                        checked={config.showLegend}
                        onCheckedChange={(checked) =>
                          updateConfig("showLegend", checked)
                        }
                        data-testid="switch-legend"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Data Points</Label>
                      <Switch
                        checked={config.showDots}
                        onCheckedChange={(checked) =>
                          updateConfig("showDots", checked)
                        }
                        data-testid="switch-dots"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDataLabels"
                        checked={config.showDataLabels}
                        onCheckedChange={(checked) =>
                          updateConfig("showDataLabels", checked === true)
                        }
                        data-testid="checkbox-data-labels"
                      />
                      <Label htmlFor="showDataLabels" className="cursor-pointer">
                        Show Data Point Labels
                      </Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Background</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) =>
                              updateConfig("backgroundColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) =>
                              updateConfig("backgroundColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Border</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.borderColor}
                            onChange={(e) =>
                              updateConfig("borderColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={(e) =>
                              updateConfig("borderColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) =>
                              updateConfig("textColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-text-color"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) =>
                              updateConfig("textColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Grid Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.gridColor}
                            onChange={(e) =>
                              updateConfig("gridColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-grid-color"
                          />
                          <Input
                            value={config.gridColor}
                            onChange={(e) =>
                              updateConfig("gridColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Line Series</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSeries}
                        data-testid="button-add-series"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Line
                      </Button>
                    </div>
                    {config.series.map((s, idx) => (
                      <Card key={s.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={s.name}
                            onChange={(e) =>
                              updateSeries(s.id, "name", e.target.value)
                            }
                            className="h-8 w-2/3"
                            data-testid={`input-series-name-${idx}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSeries(s.id)}
                            disabled={config.series.length <= 1}
                            className="h-8 w-8 text-destructive"
                            data-testid={`button-remove-series-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-[10px]">Color</Label>
                            <input
                              type="color"
                              value={s.color}
                              onChange={(e) =>
                                updateSeries(s.id, "color", e.target.value)
                              }
                              className="w-full h-7 rounded cursor-pointer p-0 border-0"
                              data-testid={`input-series-color-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Line Width</Label>
                            <Input
                              type="number"
                              value={s.lineWidth}
                              onChange={(e) =>
                                updateSeries(
                                  s.id,
                                  "lineWidth",
                                  parseInt(e.target.value) || 2,
                                )
                              }
                              min={1}
                              max={10}
                              className="h-7 text-xs"
                              data-testid={`input-series-width-${idx}`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px]">Line Style</Label>
                          <select
                            value={s.lineStyle}
                            onChange={(e) =>
                              updateSeries(
                                s.id,
                                "lineStyle",
                                e.target.value as any,
                              )
                            }
                            className="w-full h-7 text-xs border rounded px-1"
                            data-testid={`select-series-style-${idx}`}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                          </select>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                        data-testid="button-add-datapoint"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Point
                      </Button>
                    </div>
                    {config.dataPoints.map((dp, idx) => (
                      <Card key={dp.id} className="p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={dp.label}
                            onChange={(e) =>
                              updateDataPoint(dp.id, "label", e.target.value)
                            }
                            className="h-8 w-2/3"
                            data-testid={`input-dp-label-${idx}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeDataPoint(dp.id)}
                            disabled={config.dataPoints.length <= 1}
                            data-testid={`button-remove-dp-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {config.series.map((s, sIdx) => (
                            <div key={s.id}>
                              <Label className="text-[10px] truncate">
                                {s.name}
                              </Label>
                              <Input
                                type="number"
                                value={dp.values[s.id] || 0}
                                onChange={(e) =>
                                  updateDataPointValue(
                                    dp.id,
                                    s.id,
                                    Number(e.target.value),
                                  )
                                }
                                className="h-7 text-xs"
                                data-testid={`input-dp-value-${idx}-${sIdx}`}
                              />
                            </div>
                          ))}
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
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <div
                  ref={chartRef}
                  className="p-8"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                    minWidth: `${Math.max(600, svgWidth + 100)}px`,
                  }}
                  data-testid="chart-preview"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2
                      className="text-xl font-bold flex-1 pr-4"
                      style={{
                        color: config.textColor,
                        fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      {config.title}
                    </h2>
                    <div className="flex items-center shrink-0">
                      <img src={testdinoLogo} alt="TestDino" className="h-8 w-auto" />
                    </div>
                  </div>

                  {config.showLegend && (
                    <div className="flex items-center gap-6 mb-8">
                      {config.series.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}>
                            {s.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-stretch" style={{ minHeight: `${chartHeight}px` }}>
                    {config.yAxisLabel && (
                      <div
                        className="flex items-center justify-center shrink-0 mr-2"
                        style={{ width: "20px" }}
                      >
                        <span
                          style={{
                            transform: "rotate(-90deg)",
                            whiteSpace: "nowrap",
                            color: config.labelColor,
                            fontFamily: "'Geist', sans-serif",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          {config.yAxisLabel}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-1 min-w-0">
                      <div
                        className="flex flex-col justify-between pr-2 text-right shrink-0"
                        style={{
                          height: `${plotHeight}px`,
                          marginTop: `${padding.top}px`,
                          minWidth: "40px",
                        }}
                      >
                        {[...yAxisTicks].reverse().map((tick) => (
                          <span
                            key={tick}
                            className="text-xs"
                            style={{
                              color: config.labelColor,
                              fontFamily: "'Geist', sans-serif",
                              opacity: 0.7,
                            }}
                          >
                            {tick}{config.valueFormat}
                          </span>
                        ))}
                      </div>

                      <div ref={svgContainerRef} className="flex-1" style={{ minWidth: `${minimumWidth}px` }}>
                        <svg
                          width="100%"
                          height={chartHeight}
                          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
                          preserveAspectRatio="xMinYMid meet"
                        >
                          <line
                            x1={padding.left}
                            y1={padding.top}
                            x2={padding.left}
                            y2={padding.top + plotHeight}
                            stroke={config.textColor}
                            strokeWidth={1}
                            opacity={0.4}
                          />

                          <line
                            x1={padding.left}
                            y1={padding.top + plotHeight}
                            x2={svgWidth - padding.right}
                            y2={padding.top + plotHeight}
                            stroke={config.textColor}
                            strokeWidth={1}
                            opacity={0.4}
                          />

                          {config.showGrid && yAxisTicks.map((tick) => (
                            tick === 0 ? null : (
                              <line
                                key={`h-${tick}`}
                                x1={padding.left}
                                y1={getY(tick)}
                                x2={svgWidth - padding.right}
                                y2={getY(tick)}
                                stroke={config.gridColor}
                                strokeWidth={1}
                                strokeDasharray="4 4"
                              />
                            )
                          ))}

                          {config.showGrid && config.dataPoints.map((_, i) => (
                            <line
                              key={`v-${i}`}
                              x1={getX(i)}
                              y1={padding.top}
                              x2={getX(i)}
                              y2={padding.top + plotHeight}
                              stroke={config.gridColor}
                              strokeWidth={1}
                              strokeDasharray="4 4"
                            />
                          ))}

                          {config.series.map((s) => {
                            const points = config.dataPoints.map((dp, i) => ({
                              x: getX(i),
                              y: getY(dp.values[s.id] || 0),
                            }));

                            if (points.length >= 2) {
                              const p0 = points[0];
                              const p1 = points[1];
                              const pLast = points[points.length - 1];
                              const pPrev = points[points.length - 2];

                              points.unshift({
                                x: padding.left,
                                y: p0.y - (p1.y - p0.y) * 0.25
                              });
                              points.push({
                                x: svgWidth - padding.right,
                                y: pLast.y + (pLast.y - pPrev.y) * 0.25
                              });
                            }
                            const path = generateSmoothPath(points);
                            return (
                              <path
                                key={s.id}
                                d={path}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={s.lineWidth}
                                strokeDasharray={getStrokeDasharray(s.lineStyle)}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            );
                          })}

                          {config.series.map((s, sIdx) =>
                            config.dataPoints.map((dp, i) => {
                              const x = getX(i);
                              const y = getY(dp.values[s.id] || 0);
                              const val = dp.values[s.id] || 0;
                              return (
                                <g key={`${s.id}-${dp.id}`}>
                                  {config.showDots && (
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={config.pointRadius}
                                      fill={s.color}
                                      stroke={s.color}
                                      strokeWidth={0}
                                    />
                                  )}
                                  {config.showDataLabels && (() => {
                                    const labelText = `${val}${config.valueFormat}`;
                                    const labelWidth = labelText.length * 7.5 + 8;
                                    const lx = x;
                                    const ly = y - config.pointRadius - 6;
                                    return (
                                      <>
                                        <rect
                                          x={lx - labelWidth / 2}
                                          y={ly - 11}
                                          width={labelWidth}
                                          height={16}
                                          rx={3}
                                          ry={3}
                                          fill={config.backgroundColor}
                                          stroke={config.gridColor}
                                          strokeWidth={1}
                                        />
                                        <text
                                          x={lx}
                                          y={ly + 1}
                                          textAnchor="middle"
                                          fill={config.labelColor}
                                          fontFamily="'Geist', sans-serif"
                                          fontSize={12}
                                          fontWeight="600"
                                        >
                                          {labelText}
                                        </text>
                                      </>
                                    );
                                  })()}
                                </g>
                              );
                            })
                          )}

                          {config.dataPoints.map((dp, i) => (
                            <text
                              key={i}
                              x={getX(i)}
                              y={chartHeight - padding.bottom + 25}
                              textAnchor="middle"
                              fill={config.labelColor}
                              fontFamily="'Geist', sans-serif"
                              fontSize={13}
                            >
                              {dp.label}
                            </text>
                          ))}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {config.xAxisLabel && (
                    <div
                      className="text-center text-base"
                      style={{ color: config.labelColor, fontFamily: "'Geist', sans-serif" }}
                    >
                      {config.xAxisLabel}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
