import { useState, useRef, useCallback } from "react";
import { toPng, toSvg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Plus, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import testdinoLogo from "@assets/image_1769153159547.png";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function darkenColor(hex: string, amount: number = 20): string {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.max(0, l - amount);
  return hslToHex(h, s, newL);
}

interface DataPoint {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface SingleChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  yAxisMax: number;
  yAxisStep: number;
  legendLabel: string;
  uniformColor: string;
  colorMode: "uniform" | "individual";
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  valueFormat: string;
  dataPoints: DataPoint[];
}

const defaultColors = ["#e8a5d0", "#c9726b", "#6b8e9c", "#7cb97c", "#d4a574", "#9b7bb8"];

const defaultConfig: SingleChartConfig = {
  title: "Test Automation Market Growth 2023-2028",
  xAxisLabel: "Year",
  yAxisLabel: "Market Value",
  yAxisMax: 60,
  yAxisStep: 10,
  legendLabel: "Market Value (USD Billions)",
  uniformColor: "#e8a5d0",
  colorMode: "uniform",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  valueFormat: "B",
  dataPoints: [
    { id: "1", label: "2023", value: 28.1, color: "#e8a5d0" },
    { id: "2", label: "2024", value: 32.2, color: "#e8a5d0" },
    { id: "3", label: "2025", value: 36.8, color: "#e8a5d0" },
    { id: "4", label: "2026", value: 42.1, color: "#e8a5d0" },
    { id: "5", label: "2027", value: 48.2, color: "#e8a5d0" },
    { id: "6", label: "2028", value: 55.2, color: "#e8a5d0" },
  ],
};

export default function SingleBarChart() {
  const [config, setConfig] = useState<SingleChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof SingleChartConfig>(key: K, value: SingleChartConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateDataPoint = (id: string, field: keyof DataPoint, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      dataPoints: prev.dataPoints.map(dp =>
        dp.id === id ? { ...dp, [field]: value } : dp
      ),
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    const colorIndex = config.dataPoints.length % defaultColors.length;
    setConfig(prev => ({
      ...prev,
      dataPoints: [...prev.dataPoints, {
        id: newId,
        label: "New",
        value: 50,
        color: defaultColors[colorIndex]
      }],
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig(prev => ({
      ...prev,
      dataPoints: prev.dataPoints.filter(dp => dp.id !== id),
    }));
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
  };

  const exportChart = useCallback(async (format: "png" | "svg") => {
    if (!chartRef.current) return;

    const node = chartRef.current;
    const originalBorder = node.style.border;
    node.style.border = "none";
    setIsExporting(true);

    try {
      const options = {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: config.backgroundColor,
        skipFonts: true,
        style: { margin: "0", transform: "none" },
      };

      let dataUrl: string;
      let filename: string;

      if (format === "svg") {
        dataUrl = await toSvg(node, options);
        filename = "single-bar-chart.svg";
      } else {
        dataUrl = await toPng(node, options);
        filename = "single-bar-chart.png";
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      node.style.border = originalBorder;
      setIsExporting(false);
    }
  }, [config.backgroundColor]);

  const yAxisTicks = [];
  for (let i = 0; i <= config.yAxisMax; i += config.yAxisStep) {
    yAxisTicks.push(i);
  }

  const getBarColor = (dp: DataPoint) => {
    return config.colorMode === "uniform" ? config.uniformColor : dp.color;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Geist', sans-serif" }}>
            Single Bar Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefault}
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
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Legend Label</Label>
                    <Input
                      value={config.legendLabel}
                      onChange={(e) => updateConfig("legendLabel", e.target.value)}
                      data-testid="input-legend"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={config.yAxisLabel}
                        onChange={(e) => updateConfig("yAxisLabel", e.target.value)}
                        data-testid="input-yaxis"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={config.xAxisLabel}
                        onChange={(e) => updateConfig("xAxisLabel", e.target.value)}
                        data-testid="input-xaxis"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Max</Label>
                      <Input
                        type="number"
                        value={config.yAxisMax}
                        onChange={(e) => updateConfig("yAxisMax", Number(e.target.value))}
                        data-testid="input-y-max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Step</Label>
                      <Input
                        type="number"
                        value={config.yAxisStep}
                        onChange={(e) => updateConfig("yAxisStep", Number(e.target.value))}
                        data-testid="input-y-step"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Value Suffix</Label>
                    <Input
                      value={config.valueFormat}
                      onChange={(e) => updateConfig("valueFormat", e.target.value)}
                      placeholder="e.g., K, B, %"
                      data-testid="input-format"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Bar Color Mode</Label>
                    <RadioGroup
                      value={config.colorMode}
                      onValueChange={(v) => updateConfig("colorMode", v as "uniform" | "individual")}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="uniform" id="uniform" data-testid="radio-uniform" />
                        <Label htmlFor="uniform" className="font-normal">Same color for all bars</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" data-testid="radio-individual" />
                        <Label htmlFor="individual" className="font-normal">Different color per bar</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {config.colorMode === "uniform" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Bar Color</Label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={config.uniformColor}
                          onChange={(e) => updateConfig("uniformColor", e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                          data-testid="input-uniform-color"
                        />
                        <Input
                          value={config.uniformColor}
                          onChange={(e) => updateConfig("uniformColor", e.target.value)}
                          className="flex-1 h-8 text-xs"
                          data-testid="input-uniform-color-hex"
                        />
                      </div>
                    </div>
                  )}

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
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
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
                            onChange={(e) => updateConfig("borderColor", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={(e) => updateConfig("borderColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={config.textColor}
                          onChange={(e) => updateConfig("textColor", e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                          data-testid="input-text-color"
                        />
                        <Input
                          value={config.textColor}
                          onChange={(e) => updateConfig("textColor", e.target.value)}
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
                        data-testid="button-add-datapoint"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {config.dataPoints.map((dp, index) => (
                        <Card key={dp.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Point {index + 1}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeDataPoint(dp.id)}
                                disabled={config.dataPoints.length <= 1}
                                data-testid={`button-remove-dp-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Label</Label>
                                <Input
                                  value={dp.label}
                                  onChange={(e) => updateDataPoint(dp.id, "label", e.target.value)}
                                  className="h-8"
                                  data-testid={`input-dp-label-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  type="number"
                                  value={dp.value}
                                  onChange={(e) => updateDataPoint(dp.id, "value", parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                  data-testid={`input-dp-value-${index}`}
                                />
                              </div>
                            </div>
                            {config.colorMode === "individual" && (
                              <div>
                                <Label className="text-xs">Bar Color</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="color"
                                    value={dp.color}
                                    onChange={(e) => updateDataPoint(dp.id, "color", e.target.value)}
                                    className="w-10 h-8 p-1 cursor-pointer"
                                    data-testid={`input-dp-color-${index}`}
                                  />
                                  <Input
                                    value={dp.color}
                                    onChange={(e) => updateDataPoint(dp.id, "color", e.target.value)}
                                    className="flex-1 h-8 text-xs"
                                  />
                                </div>
                              </div>
                            )}
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
                  className="p-8"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                    minWidth: `${Math.max(600, config.dataPoints.length * 100 + 120)}px`,
                  }}
                  data-testid="chart-preview"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2
                      className="text-xl font-bold flex-1 pr-4"
                      style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                    >
                      {config.title}
                    </h2>
                    <div className="flex items-center shrink-0">
                      <img
                        src={testdinoLogo}
                        alt="TestDino"
                        className="h-8 w-auto"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-8">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.colorMode === "uniform" ? config.uniformColor : config.dataPoints[0]?.color || "#e8a5d0" }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: config.textColor, fontFamily: "'Geist Mono', monospace" }}
                    >
                      {config.legendLabel}
                    </span>
                  </div>

                  <div className="flex">
                    {config.yAxisLabel && (
                      <div
                        className="flex items-center justify-center shrink-0 mr-1"
                        style={{ width: "20px", height: "280px" }}
                      >
                        <span
                          style={{
                            transform: "rotate(-90deg)",
                            whiteSpace: "nowrap",
                            color: config.textColor,
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: "11px",
                            fontStyle: "italic",
                            opacity: 0.7,
                          }}
                        >
                          {config.yAxisLabel}
                        </span>
                      </div>
                    )}
                    <div
                      className="flex flex-col justify-between pr-2 text-right"
                      style={{ height: "280px" }}
                    >
                      {[...yAxisTicks].reverse().map((tick) => (
                        <span
                          key={tick}
                          className="text-xs"
                          style={{
                            color: config.textColor,
                            fontFamily: "'Geist Mono', monospace",
                            opacity: 0.7
                          }}
                        >
                          {tick}{config.valueFormat}
                        </span>
                      ))}
                    </div>

                    <div className="flex-1" style={{ minWidth: `${Math.max(400, config.dataPoints.length * 100)}px` }}>
                      <div className="relative" style={{ height: "280px" }}>
                        {yAxisTicks.map((tick) => (
                          <div
                            key={tick}
                            className="absolute left-0 right-0 h-px"
                            style={{
                              bottom: `${(tick / config.yAxisMax) * 100}%`,
                              backgroundColor: config.textColor,
                              opacity: tick === 0 ? 0.3 : 0.1
                            }}
                          />
                        ))}

                        <div className="absolute inset-0 flex items-end justify-around px-4 pb-1">
                          {config.dataPoints.map((dp) => {
                            const barHeight = Math.max(4, (dp.value / config.yAxisMax) * 270);
                            const barColor = getBarColor(dp);

                            return (
                              <div
                                key={dp.id}
                                className="flex flex-col items-center justify-end"
                                style={{ width: "60px" }}
                              >
                                <div
                                  className="text-sm font-bold mb-1"
                                  style={{
                                    color: config.textColor,
                                    fontFamily: "'Geist Mono', monospace"
                                  }}
                                >
                                  {dp.value}{config.valueFormat}
                                </div>
                                <div
                                  className="w-14 rounded-md"
                                  style={{
                                    height: `${barHeight}px`,
                                    backgroundColor: barColor,
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    borderColor: darkenColor(barColor, 20),
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-around px-4">
                        {config.dataPoints.map((dp) => (
                          <div
                            key={dp.id}
                            className="flex flex-col items-center"
                            style={{ width: "60px" }}
                          >
                            <div
                              className="w-px h-3"
                              style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                            />
                            <div
                              className="text-sm text-center mt-1"
                              style={{ color: config.textColor, fontFamily: "'Geist Mono', monospace" }}
                            >
                              {dp.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {config.xAxisLabel && (
                    <div
                      className="text-center mt-2 text-sm"
                      style={{ color: config.textColor, fontFamily: "'Geist', sans-serif", fontStyle: "italic" }}
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
