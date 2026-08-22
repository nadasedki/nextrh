import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, AlertTriangle, Building2, ChevronRight, Loader2, Search, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardStats {
  totalEmployees: number;
  totalCertifications: number;
  expiringThisMonth: number;
  totalTeams: number;
  certificationStatus: {
    active: number;
    expiringSoon: number;
    expired: number;
  };
  certificationsByProvider: { name: string; value: number }[];
}

const BIDDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('http://localhost:3000/employees/stats/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load dashboard data.');
        setLoading(false);
      });
  }, [token]);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
  
  if (error) return (
    <div className="p-4 text-center py-10 text-destructive font-semibold">{error}</div>
  );

  const pieData = [
    { name: 'Active', value: stats?.certificationStatus.active || 0, color: 'hsl(var(--success))' },
    { name: 'Expiring', value: stats?.certificationStatus.expiringSoon || 0, color: 'hsl(var(--warning))' },
    { name: 'Expired', value: stats?.certificationStatus.expired || 0, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const barData = stats?.certificationsByProvider || [];

  return (
    <div className="space-y-4">
      {/* ============================
          HEADER WITH BUTTONS
      ============================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BID Dashboard</h1>
          <p className="text-sm text-muted-foreground">Global overview of workforce capabilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate('/bid/directory')}>
            <Search className="h-4 w-4 mr-2" />
            Search Employees
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/bid/ai-chat')}>
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* ============================
          STYLED STATS GRID
      ============================ */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{stats?.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success shadow-sm hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Certs</CardTitle>
            <Award className="h-4 w-4 text-success opacity-70" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{stats?.totalCertifications}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning shadow-sm hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Expiring Month</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning opacity-70" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-warning">{stats?.expiringThisMonth}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent shadow-sm hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Teams</CardTitle>
            <Building2 className="h-4 w-4 text-accent opacity-70" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{stats?.totalTeams}</div>
          </CardContent>
        </Card>
      </div>

      {/* ============================
          CHARTS ROW
      ============================ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-in">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg">Certification Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value" 
                    label={{ fontSize: 12 }}
                  >
                    {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg">Certifications by Provider</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BIDDashboard;