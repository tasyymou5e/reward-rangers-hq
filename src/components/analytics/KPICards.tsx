import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  CheckCircle, 
  TrendingUp, 
  Activity, 
  Clock,
  Target,
  Trophy
} from "lucide-react";

interface KPICardsProps {
  data: {
    totalUsers: number;
    totalFamilies: number;
    totalChores: number;
    completedChores: number;
    completionRate: number;
    activeUsers: number;
    averageSessionTime: number;
    topPerformer: string;
  };
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: "Total Users",
      value: data.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12% from last month"
    },
    {
      title: "Active Families",
      value: data.totalFamilies,
      icon: Home,
      color: "text-green-600", 
      bgColor: "bg-green-50",
      change: "+8% from last month"
    },
    {
      title: "Completion Rate",
      value: `${data.completionRate}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+5% from last week"
    },
    {
      title: "Total Chores",
      value: data.totalChores,
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: `${data.completedChores} completed`
    },
    {
      title: "Active Users",
      value: data.activeUsers,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      change: "Last 24 hours"
    },
    {
      title: "Avg Session",
      value: `${data.averageSessionTime}m`,
      icon: Clock,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      change: "+2m from last week"
    },
    {
      title: "Top Performer",
      value: data.topPerformer || "N/A",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "This week"
    },
    {
      title: "Growth Rate",
      value: "+15.3%",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "Monthly growth"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <Badge variant="secondary" className="mt-2 text-xs">
                {kpi.change}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}