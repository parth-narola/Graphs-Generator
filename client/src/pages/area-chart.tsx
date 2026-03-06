import { useState, useRef, useCallback, useEffect } from "react";
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
import { toPng, toSvg } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import testDinoLogo from "@assets/image_1769153159547.png";

interface DataPoint {
  label: string;
  value: number;
  displayValue: string;
}

interface ChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  yAxisMax: number;
  yAxisStep: number;
  valueFormat: string;
  lineColor: string;
  fillColor: string;
  pointColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  labelColor: string;
  gridColor: string;
  lineWidth: number;
  pointRadius: number;
}

const defaultDataPoints: DataPoint[] = [
  { label: "2020", value: 30, displayValue: "30B" },
  { label: "2021", value: 32, displayValue: "32B" },
  { label: "2022", value: 34, displayValue: "34B" },
  { label: "2023", value: 37, displayValue: "37B" },
  { label: "2024", value: 41.5, displayValue: "41.5B" },
  { label: "2025", value: 45, displayValue: "45B" },
  { label: "2026", value: 48, displayValue: "48B" },
  { label: "2027", value: 51, displayValue: "51B" },
  { label: "2028", value: 55, displayValue: "55B" },
  { label: "2029", value: 60.2, displayValue: "60.2B" },
];

const defaultConfig: ChartConfig = {
  title: "Global QA/Testing Market and Budget Trends\n(2020-2029)",
  xAxisLabel: "Year",
  yAxisLabel: "Market Size (USD Billion)",
  yAxisMax: 70,
  yAxisStep: 10,
  valueFormat: "B",
  lineColor: "#22c55e",
  fillColor: "#22c55e",
  pointColor: "#22c55e",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#1a1a2e",
  labelColor: "#374151",
  gridColor: "#e5e7eb",
  lineWidth: 2,
  pointRadius: 6,
};

export default function AreaChart() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(defaultDataPoints);
  const [config, setConfig] = useState<ChartConfig>(defaultConfig);
  const [dynamicWidth, setDynamicWidth] = useState(700);
  const chartRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!svgContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const minRequiredWidth = Math.max(700, dataPoints.length * 120);
      if (entries[0]) {
        setDynamicWidth(Math.max(minRequiredWidth, entries[0].contentRect.width));
      }
    });
    observer.observe(svgContainerRef.current);
    return () => observer.disconnect();
  }, [dataPoints.length]);

  const chartHeight = 450;
  const padding = { top: 40, right: 60, bottom: 60, left: 20 };
  const minimumWidth = Math.max(700, dataPoints.length * 120);
  const svgWidth = Math.max(minimumWidth, dynamicWidth);
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const yAxisTicks = [];
  for (let i = 0; i <= config.yAxisMax; i += config.yAxisStep) {
    yAxisTicks.push(i);
  }

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (dataPoints.length - 1)) * plotWidth;
  };

  const getY = (value: number) => {
    return padding.top + plotHeight - (value / config.yAxisMax) * plotHeight;
  };

  const linePath = dataPoints
    .map((dp, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(dp.value)}`)
    .join(" ");

  const areaPath = `${linePath} L ${getX(dataPoints.length - 1)} ${padding.top + plotHeight} L ${getX(0)} ${padding.top + plotHeight} Z`;

  const [isExporting, setIsExporting] = useState(false);

  const exportChart = useCallback(async (format: "png" | "svg") => {
    if (!chartRef.current) return;

    const node = chartRef.current;
    const originalBorder = node.style.border;
    node.style.border = "none";
    setIsExporting(true);

    try {
      const options = {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: config.backgroundColor,
        skipFonts: false,
        style: { margin: "0", transform: "none" },
      };

      let dataUrl: string;
      let filename: string;

      if (format === "svg") {
        dataUrl = await toSvg(node, options);
        filename = "area-chart.svg";
      } else {
        dataUrl = await toPng(node, options);
        filename = "area-chart.png";
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Export Successful",
        description: `Your chart has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the chart",
        variant: "destructive",
      });
    } finally {
      node.style.border = originalBorder;
      setIsExporting(false);
    }
  }, [config.backgroundColor, toast]);

  const updateDataPoint = (index: number, field: keyof DataPoint, value: string | number) => {
    const newDataPoints = [...dataPoints];
    if (field === "value") {
      newDataPoints[index] = { ...newDataPoints[index], [field]: Number(value) };
    } else {
      newDataPoints[index] = { ...newDataPoints[index], [field]: value };
    }
    setDataPoints(newDataPoints);
  };

  const addDataPoint = () => {
    const lastPoint = dataPoints[dataPoints.length - 1];
    const newYear = lastPoint ? String(Number(lastPoint.label) + 1) : "2020";
    setDataPoints([...dataPoints, { label: newYear, value: 50, displayValue: "50B" }]);
  };

  const removeDataPoint = (index: number) => {
    if (dataPoints.length > 2) {
      setDataPoints(dataPoints.filter((_, i) => i !== index));
    }
  };

  const resetToDefaults = () => {
    setDataPoints(defaultDataPoints);
    setConfig(defaultConfig);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Geist', sans-serif" }}>
            Area Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
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
                <DropdownMenuItem onClick={() => exportChart("png")} data-testid="export-png">
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChart("svg")} data-testid="export-svg">
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <textarea
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      className="w-full p-2 border rounded-md text-sm resize-none bg-background"
                      rows={2}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={config.yAxisLabel}
                        onChange={(e) => setConfig({ ...config, yAxisLabel: e.target.value })}
                        data-testid="input-y-axis-label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={config.xAxisLabel}
                        onChange={(e) => setConfig({ ...config, xAxisLabel: e.target.value })}
                        data-testid="input-x-axis-label"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Max</Label>
                      <Input
                        type="number"
                        value={config.yAxisMax}
                        onChange={(e) => setConfig({ ...config, yAxisMax: Number(e.target.value) })}
                        data-testid="input-y-max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Step</Label>
                      <Input
                        type="number"
                        value={config.yAxisStep}
                        onChange={(e) => setConfig({ ...config, yAxisStep: Number(e.target.value) })}
                        data-testid="input-y-step"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Value Suffix</Label>
                    <Input
                      value={config.valueFormat}
                      onChange={(e) => setConfig({ ...config, valueFormat: e.target.value })}
                      placeholder="e.g., K, B, %"
                      data-testid="input-format"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Line Width</Label>
                      <Input
                        type="number"
                        value={config.lineWidth}
                        onChange={(e) => setConfig({ ...config, lineWidth: Number(e.target.value) })}
                        min={1}
                        max={10}
                        data-testid="input-line-width"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Point Size</Label>
                      <Input
                        type="number"
                        value={config.pointRadius}
                        onChange={(e) => setConfig({ ...config, pointRadius: Number(e.target.value) })}
                        min={2}
                        max={15}
                        data-testid="input-point-size"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Line Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.lineColor}
                            onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-line"
                          />
                          <Input
                            value={config.lineColor}
                            onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fill Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.fillColor}
                            onChange={(e) => setConfig({ ...config, fillColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-fill"
                          />
                          <Input
                            value={config.fillColor}
                            onChange={(e) => setConfig({ ...config, fillColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Point Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.pointColor}
                            onChange={(e) => setConfig({ ...config, pointColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-point"
                          />
                          <Input
                            value={config.pointColor}
                            onChange={(e) => setConfig({ ...config, pointColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Background</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-background"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Border Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.borderColor}
                            onChange={(e) => setConfig({ ...config, borderColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-border"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={(e) => setConfig({ ...config, borderColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Title Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-text"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.labelColor}
                            onChange={(e) => setConfig({ ...config, labelColor: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="color-label"
                          />
                          <Input
                            value={config.labelColor}
                            onChange={(e) => setConfig({ ...config, labelColor: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grid Color</Label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={config.gridColor}
                          onChange={(e) => setConfig({ ...config, gridColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer"
                          data-testid="color-grid"
                        />
                        <Input
                          value={config.gridColor}
                          onChange={(e) => setConfig({ ...config, gridColor: e.target.value })}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                        data-testid="button-add-point"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {dataPoints.map((dp, index) => (
                        <Card key={index} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Point {index + 1}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeDataPoint(index)}
                                disabled={dataPoints.length <= 2}
                                data-testid={`button-remove-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Label</Label>
                                <Input
                                  value={dp.label}
                                  onChange={(e) => updateDataPoint(index, "label", e.target.value)}
                                  className="h-8"
                                  data-testid={`input-label-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  type="number"
                                  value={dp.value}
                                  onChange={(e) => updateDataPoint(index, "value", e.target.value)}
                                  className="h-8"
                                  data-testid={`input-value-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Display</Label>
                                <Input
                                  value={dp.displayValue}
                                  onChange={(e) => updateDataPoint(index, "displayValue", e.target.value)}
                                  className="h-8"
                                  placeholder="e.g., 30B"
                                  data-testid={`input-display-${index}`}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <div
                  ref={chartRef}
                  data-testid="chart-preview"
                  className="p-8"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                    minWidth: `${Math.max(600, svgWidth + 100)}px`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2
                      className="text-xl font-bold flex-1 pr-4"
                      style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                    >
                      {config.title.split("\n").join(" ")}
                    </h2>
                    <div className="flex items-center shrink-0">
                      <img
                        src={testDinoLogo}
                        alt="TestDino"
                        className="h-8 w-auto"
                      />
                    </div>
                  </div>

                  <div className="flex items-stretch" style={{ minHeight: `${chartHeight}px` }}>
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
                          <defs>
                            <linearGradient
                              id="areaGradient"
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor={config.fillColor}
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="100%"
                                stopColor={config.fillColor}
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>

                          {yAxisTicks.map((tick) => (
                            <line
                              key={tick}
                              x1={padding.left}
                              y1={getY(tick)}
                              x2={svgWidth - padding.right}
                              y2={getY(tick)}
                              stroke={config.gridColor}
                              strokeWidth={1}
                            />
                          ))}

                          <path d={areaPath} fill="url(#areaGradient)" />

                          <path
                            d={linePath}
                            fill="none"
                            stroke={config.lineColor}
                            strokeWidth={config.lineWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {dataPoints.map((dp, i) => {
                            const x = getX(i);
                            const y = getY(dp.value);
                            return (
                              <g key={i}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={config.pointRadius}
                                  fill={config.backgroundColor}
                                  stroke={config.pointColor}
                                  strokeWidth={2}
                                />
                                <text
                                  x={x}
                                  y={y - 15}
                                  textAnchor="middle"
                                  fill={config.textColor}
                                  fontFamily="'Geist', sans-serif"
                                  fontSize={13}
                                  fontWeight="500"
                                >
                                  {dp.displayValue}
                                </text>
                              </g>
                            );
                          })}

                          {dataPoints.map((dp, i) => (
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
