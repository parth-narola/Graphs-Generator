import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SingleBarChart from "@/pages/single-bar-chart";
import LineChart from "@/pages/line-chart";
import AreaChart from "@/pages/area-chart";
// Import the new components (we will create these next)
import MultipleBarChart from "@/pages/multiple-bar-chart";
import PieChartPage from "@/pages/pie-chart";
import StackedBarChartPage from "@/pages/stacked-bar-chart";

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 flex-wrap">
        <Link href="/">
          <Button variant={location === "/" ? "default" : "ghost"} size="sm">
            Comparison Chart
          </Button>
        </Link>
        <Link href="/single">
          <Button variant={location === "/single" ? "default" : "ghost"} size="sm">
            Single Bar Chart
          </Button>
        </Link>
        <Link href="/multiple">
          <Button variant={location === "/multiple" ? "default" : "ghost"} size="sm">
            Multiple Bar Chart
          </Button>
        </Link>
        <Link href="/stacked">
          <Button variant={location === "/stacked" ? "default" : "ghost"} size="sm">Stacked Bar</Button>
        </Link>
        <Link href="/pie">
          <Button variant={location === "/pie" ? "default" : "ghost"} size="sm">
            Pie Chart
          </Button>
        </Link>
        <Link href="/line">
          <Button variant={location === "/line" ? "default" : "ghost"} size="sm">
            Line Chart
          </Button>
        </Link>
        <Link href="/area">
          <Button variant={location === "/area" ? "default" : "ghost"} size="sm">
            Area Chart
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/single" component={SingleBarChart} />
      <Route path="/multiple" component={MultipleBarChart} />
      <Route path="/stacked" component={StackedBarChartPage} />
      <Route path="/pie" component={PieChartPage} />
      <Route path="/line" component={LineChart} />
      <Route path="/area" component={AreaChart} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Navigation />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;