import { useState, useRef, useCallback, useEffect } from "react";
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

const defaultColors = ["#9b4f82", "#e8a5d0", "#6b8e9c", "#7cb97c", "#d4a574"];

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

interface ChartSeries {
    id: string;
    name: string;
    color: string;
}

interface DataPoint {
    id: string;
    label: string;
    values: Record<string, number>;
}

interface MultipleChartConfig {
    title: string;
    xAxisLabel: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    series: ChartSeries[];
    dataPoints: DataPoint[];
}

const defaultConfig: MultipleChartConfig = {
    title: "Multi-Version Performance Comparison",
    xAxisLabel: "",
    backgroundColor: "#ffffff",
    borderColor: "#e0e0e0",
    textColor: "#1a1a1a",
    series: [
        { id: "s1", name: "Version 1", color: "#9A255D" },
        { id: "s2", name: "Version 2", color: "#DF509B" },
        { id: "s3", name: "Version 3", color: "#F6CAE2" },
    ],
    dataPoints: [
        { id: "1", label: "10th percentile", values: { s1: 80, s2: 60, s3: 45 } },
        { id: "2", label: "30th percentile", values: { s1: 100, s2: 95, s3: 85 } },
        { id: "3", label: "50th percentile", values: { s1: 60, s2: 45, s3: 80 } },
        { id: "4", label: "80th percentile", values: { s1: 150, s2: 130, s3: 110 } },
    ],
};

export default function MultipleBarChart() {
    const [config, setConfig] = useState<MultipleChartConfig>(defaultConfig);
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setConfig(defaultConfig);
    }, []);

    const updateConfig = <K extends keyof MultipleChartConfig>(key: K, value: MultipleChartConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const addSeries = () => {
        const newId = `s${Date.now()}`;
        const color = defaultColors[config.series.length % defaultColors.length];

        setConfig(prev => ({
            ...prev,
            series: [...prev.series, { id: newId, name: `New Series`, color }],
            dataPoints: prev.dataPoints.map(dp => ({
                ...dp,
                values: { ...dp.values, [newId]: 50 }
            }))
        }));
    };

    const updateSeries = (id: string, field: keyof ChartSeries, value: string) => {
        setConfig(prev => ({
            ...prev,
            series: prev.series.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeSeries = (id: string) => {
        setConfig(prev => {
            const newDataPoints = prev.dataPoints.map(dp => {
                const newValues = { ...dp.values };
                delete newValues[id];
                return { ...dp, values: newValues };
            });
            return {
                ...prev,
                series: prev.series.filter(s => s.id !== id),
                dataPoints: newDataPoints
            };
        });
    };

    const addDataPoint = () => {
        const newId = Date.now().toString();
        const initialValues: Record<string, number> = {};
        config.series.forEach(s => initialValues[s.id] = 50);

        setConfig(prev => ({
            ...prev,
            dataPoints: [...prev.dataPoints, { id: newId, label: "New Point", values: initialValues }],
        }));
    };

    const updateDataPointValue = (pointId: string, seriesId: string, value: number) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.map(dp =>
                dp.id === pointId
                    ? { ...dp, values: { ...dp.values, [seriesId]: value } }
                    : dp
            )
        }));
    };

    const updateDataPointLabel = (pointId: string, label: string) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.map(dp => dp.id === pointId ? { ...dp, label } : dp)
        }));
    };

    const removeDataPoint = (id: string) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.filter(dp => dp.id !== id),
        }));
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
                skipFonts: false,
                style: { margin: "0", transform: "none" },
            };
            const dataUrl = format === "svg" ? await toSvg(node, options) : await toPng(node, options);
            const link = document.createElement("a");
            link.download = `multiple-chart.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        } finally {
            node.style.border = originalBorder;
            setIsExporting(false);
        }
    }, [config.backgroundColor]);

    const allValues = config.dataPoints.flatMap(dp => Object.values(dp.values));
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "'Geist', sans-serif" }}>
                        Multiple Bar Chart Generator
                    </h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isExporting}>
                                    <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export"} <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportChart("png")}>Export as PNG</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportChart("svg")}>Export as SVG</DropdownMenuItem>
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
                                        <Input value={config.title} onChange={e => updateConfig("title", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>X-Axis Label</Label>
                                        <Input value={config.xAxisLabel} onChange={e => updateConfig("xAxisLabel", e.target.value)} />
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Data Series</Label>
                                            <Button size="sm" variant="outline" onClick={addSeries}><Plus className="w-4 h-4 mr-1" /> Add Series</Button>
                                        </div>
                                        {config.series.map((s) => (
                                            <div key={s.id} className="flex gap-2 items-center mb-2">
                                                <input type="color" value={s.color} onChange={e => updateSeries(s.id, "color", e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0" />
                                                <Input value={s.name} onChange={e => updateSeries(s.id, "name", e.target.value)} className="h-8 text-sm" />
                                                <Button size="icon" variant="ghost" onClick={() => removeSeries(s.id)} disabled={config.series.length <= 1} className="shrink-0 h-8 w-8">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Data Points</Label>
                                            <Button size="sm" variant="outline" onClick={addDataPoint}><Plus className="w-4 h-4 mr-1" /> Add Point</Button>
                                        </div>
                                        {config.dataPoints.map((dp) => (
                                            <Card key={dp.id} className="p-3 mb-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <Input value={dp.label} onChange={e => updateDataPointLabel(dp.id, e.target.value)} className="h-8 w-2/3" placeholder="Label" />
                                                    <Button size="icon" variant="ghost" onClick={() => removeDataPoint(dp.id)} disabled={config.dataPoints.length <= 1} className="h-8 w-8">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {config.series.map(s => (
                                                        <div key={s.id}>
                                                            <Label className="text-[10px] text-muted-foreground truncate" title={s.name}>{s.name}</Label>
                                                            <Input type="number" value={dp.values[s.id] || 0} onChange={e => updateDataPointValue(dp.id, s.id, Number(e.target.value))} className="h-7 text-xs" />
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
                                        minWidth: `${Math.max(600, config.dataPoints.length * (config.series.length * 48 + 40) + 120)}px`,
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h2
                                            className="text-2xl font-[800] tracking-tight flex-1 pr-4"
                                            style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                                        >
                                            {config.title}
                                        </h2>
                                        <div className="flex items-center shrink-0">
                                            <img src={testdinoLogo} alt="TestDino" className="h-8 w-auto" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 mb-8">
                                        {config.series.map(s => (
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

                                    <div className="flex flex-col">
                                        <div className="flex justify-around items-end px-2" style={{ height: "280px" }}>
                                            {config.dataPoints.map(dp => (
                                                <div key={dp.id} className="flex flex-col items-center" style={{ width: `${config.series.length * 48}px` }}>
                                                    <div className="flex items-end gap-1">
                                                        {config.series.map(s => {
                                                            const val = dp.values[s.id] || 0;
                                                            const heightPx = maxValue > 0 ? (val / maxValue) * 210 : 0;
                                                            return (
                                                                <div key={s.id} className="flex flex-col items-center gap-1.5">
                                                                    <span
                                                                        className="font-[700] text-[13px]"
                                                                        style={{ color: config.textColor, fontFamily: "'Geist', sans-serif", opacity: 0.85 }}
                                                                    >
                                                                        {val}
                                                                    </span>
                                                                    <div
                                                                        className="rounded-[3px] transition-all duration-300"
                                                                        style={{
                                                                            height: `${Math.max(2, heightPx)}px`,
                                                                            width: "42px",
                                                                            backgroundColor: s.color,
                                                                            border: `1px solid ${darkenColor(s.color, 15)}`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="w-full h-px mt-2"
                                            style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                                        />

                                        <div className="flex justify-around px-2">
                                            {config.dataPoints.map(dp => (
                                                <div
                                                    key={dp.id}
                                                    className="flex flex-col items-center"
                                                    style={{ width: `${config.series.length * 48}px` }}
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
