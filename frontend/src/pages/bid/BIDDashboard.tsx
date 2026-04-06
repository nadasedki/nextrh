// src/pages/BIDDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, AlertTriangle, Building2, ChevronRight, Loader2 } from 'lucide-react';
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
    <div className="text-center py-10 text-destructive font-semibold">{error}</div>
  );

  const pieData = [
    { name: 'Active', value: stats?.certificationStatus.active || 0, color: 'hsl(var(--success))' },
    { name: 'Expiring', value: stats?.certificationStatus.expiringSoon || 0, color: 'hsl(var(--warning))' },
    { name: 'Expired', value: stats?.certificationStatus.expired || 0, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const barData = stats?.certificationsByProvider || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">BID Dashboard</h1>
        <p className="text-muted-foreground">Global overview of workforce capabilities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalEmployees}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Certifications</CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalCertifications}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring This Month</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-warning">{stats?.expiringThisMonth}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
            <Building2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalTeams}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Certification Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label>
                    {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Certifications by Provider</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={() => navigate('/bid/directory')}>
          <Users className="h-4 w-4 mr-2" />Search Employees
        </Button>
        <Button variant="outline" onClick={() => navigate('/bid/ai-chat')}>
          AI Assistant<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default BIDDashboard;