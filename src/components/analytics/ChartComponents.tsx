import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

// User Growth Chart
export function UserGrowthChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.2)"
              name="Total Users"
            />
            <Area 
              type="monotone" 
              dataKey="activeUsers" 
              stroke="hsl(var(--secondary))" 
              fill="hsl(var(--secondary) / 0.2)"
              name="Active Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Chore Completion Trends
export function ChoreCompletionChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chore Completion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Completed"
            />
            <Line 
              type="monotone" 
              dataKey="assigned" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              name="Assigned"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Family Engagement Chart
export function FamilyEngagementChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Engagement Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="family" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="choresCompleted" fill="hsl(var(--primary))" name="Chores Completed" />
            <Bar dataKey="pointsEarned" fill="hsl(var(--secondary))" name="Points Earned" />
            <Bar dataKey="messagesExchanged" fill="hsl(var(--accent))" name="Messages" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// System Performance Chart
export function SystemPerformanceChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Performance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="responseTime" 
              stroke="#8884d8" 
              name="Response Time (ms)"
            />
            <Line 
              type="monotone" 
              dataKey="activeConnections" 
              stroke="#82ca9d" 
              name="Active Connections"
            />
            <Line 
              type="monotone" 
              dataKey="errorRate" 
              stroke="#ff6b6b" 
              name="Error Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// User Activity Distribution
export function UserActivityPieChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Revenue Chart (for future monetization)
export function RevenueChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.3)"
              name="Monthly Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Conversion Rates Chart
export function ConversionRatesChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
            <Legend />
            <Bar 
              dataKey="rate" 
              fill="hsl(var(--primary))" 
              name="Conversion Rate (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}