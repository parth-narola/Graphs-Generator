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
  value1: number;
  value2: number;
}

interface ChartConfig {
  title: string;
  xAxisLabel: string;
  legend1: string;
  legend2: string;
  bar1Color: string;
  bar2Color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  showPercentageChange: boolean;
  dataPoints: DataPoint[];
}

const defaultConfig: ChartConfig = {
  title: "TestDino V2 spends less time on easy tasks, and more time on complex executions",
  xAxisLabel: "# of model-generated tokens per response",
  legend1: "TestDino V1",
  legend2: "TestDino V2",
  bar1Color: "#9b4f82",
  bar2Color: "#e8a5d0",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  showPercentageChange: true,
  dataPoints: [
    { id: "1", label: "10th percentile", value1: 100, value2: 38 },
    { id: "2", label: "30th percentile", value1: 100, value2: 65 },
    { id: "3", label: "50th percentile", value1: 100, value2: 95 },
    { id: "4", label: "70th percentile", value1: 100, value2: 128 },
    { id: "5", label: "80th percentile", value1: 100, value2: 176 },
  ],
};

export default function Home() {
  const [config, setConfig] = useState<ChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof ChartConfig>(key: K, value: ChartConfig[K]) => {
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
    setConfig(prev => ({
      ...prev,
      dataPoints: [...prev.dataPoints, { id: newId, label: "New Label", value1: 100, value2: 100 }],
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
        filename = "comparison-chart.svg";
      } else {
        dataUrl = await toPng(node, options);
        filename = "comparison-chart.png";
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting chart:", err);
    } finally {
      node.style.border = originalBorder;
      setIsExporting(false);
    }
  }, [config.backgroundColor]);

  const maxValue = Math.max(
    ...config.dataPoints.flatMap(dp => [dp.value1, dp.value2])
  );

  const getPercentageChange = (v1: number, v2: number) => {
    if (v1 === 0) return 0;
    return Math.round(((v2 - v1) / v1) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Geist', sans-serif" }}>
            Comparison Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefault} data-testid="button-reset">
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
                      onChange={e => updateConfig("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>X-Axis Label</Label>
                    <Input
                      value={config.xAxisLabel}
                      onChange={e => updateConfig("xAxisLabel", e.target.value)}
                      data-testid="input-x-axis"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Legend 1</Label>
                      <Input
                        value={config.legend1}
                        onChange={e => updateConfig("legend1", e.target.value)}
                        data-testid="input-legend1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Legend 2</Label>
                      <Input
                        value={config.legend2}
                        onChange={e => updateConfig("legend2", e.target.value)}
                        data-testid="input-legend2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Bar 1 Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.bar1Color}
                            onChange={e => updateConfig("bar1Color", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bar1-color"
                          />
                          <Input
                            value={config.bar1Color}
                            onChange={e => updateConfig("bar1Color", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bar 2 Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.bar2Color}
                            onChange={e => updateConfig("bar2Color", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bar2-color"
                          />
                          <Input
                            value={config.bar2Color}
                            onChange={e => updateConfig("bar2Color", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Background</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={e => updateConfig("backgroundColor", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={e => updateConfig("backgroundColor", e.target.value)}
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
                            onChange={e => updateConfig("borderColor", e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={e => updateConfig("borderColor", e.target.value)}
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
                          onChange={e => updateConfig("textColor", e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                          data-testid="input-text-color"
                        />
                        <Input
                          value={config.textColor}
                          onChange={e => updateConfig("textColor", e.target.value)}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showPercentage"
                      checked={config.showPercentageChange}
                      onChange={e => updateConfig("showPercentageChange", e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                      data-testid="checkbox-percentage"
                    />
                    <Label htmlFor="showPercentage" className="cursor-pointer">
                      Show percentage change labels
                    </Label>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                        data-testid="button-add-data"
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
                                data-testid={`button-remove-data-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={dp.label}
                                onChange={e => updateDataPoint(dp.id, "label", e.target.value)}
                                className="h-8"
                                data-testid={`input-label-${index}`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Value 1</Label>
                                <Input
                                  type="number"
                                  value={dp.value1}
                                  onChange={e => updateDataPoint(dp.id, "value1", Number(e.target.value))}
                                  className="h-8"
                                  data-testid={`input-value1-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value 2</Label>
                                <Input
                                  type="number"
                                  value={dp.value2}
                                  onChange={e => updateDataPoint(dp.id, "value2", Number(e.target.value))}
                                  className="h-8"
                                  data-testid={`input-value2-${index}`}
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
                  className="p-8"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                    minWidth: `${Math.max(600, config.dataPoints.length * 120 + 120)}px`,
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
                      <img src={testdinoLogo} alt="TestDino" className="h-8 w-auto" />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.bar1Color }}
                      />
                      <span style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}>
                        {config.legend1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.bar2Color }}
                      />
                      <span style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}>
                        {config.legend2}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-end justify-around gap-4" style={{ height: "280px" }}>
                      {config.dataPoints.map((dp) => {
                        const percentChange = getPercentageChange(dp.value1, dp.value2);
                        const height1 = maxValue > 0 ? (dp.value1 / maxValue) * 230 : 0;
                        const height2 = maxValue > 0 ? (dp.value2 / maxValue) * 230 : 0;

                        return (
                          <div key={dp.id} className="flex flex-col items-center" style={{ width: "100px" }}>
                            {config.showPercentageChange && (
                              <div
                                className="text-sm font-medium mb-2"
                                style={{
                                  color: config.textColor,
                                  fontFamily: "'Geist Mono', monospace",
                                }}
                              >
                                {percentChange >= 0 ? "+" : ""}{percentChange}%
                              </div>
                            )}
                            <div className="flex items-end gap-1">
                              <div
                                className="w-10 rounded-md transition-all duration-300"
                                style={{
                                  height: `${height1}px`,
                                  backgroundColor: config.bar1Color,
                                  border: `1px solid ${darkenColor(config.bar1Color, 20)}`,
                                }}
                              />
                              <div
                                className="w-10 rounded-md transition-all duration-300"
                                style={{
                                  height: `${height2}px`,
                                  backgroundColor: config.bar2Color,
                                  border: `1px solid ${darkenColor(config.bar2Color, 20)}`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className="w-full h-px mt-2"
                      style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                    />

                    <div className="flex justify-around gap-4">
                      {config.dataPoints.map((dp) => (
                        <div
                          key={dp.id}
                          className="flex flex-col items-center"
                          style={{ width: "100px" }}
                        >
                          <div
                            className="w-px h-3"
                            style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                          />
                          <div
                            className="text-sm text-center mt-2"
                            style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                          >
                            {dp.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="text-center mt-8 text-base"
                    style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                  >
                    {config.xAxisLabel}
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
