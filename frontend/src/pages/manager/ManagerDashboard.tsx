import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, AlertTriangle, Calendar, ChevronRight, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Logic and Interface remain unchanged
interface TeamStats {
  teamName: string;
  totalMembers: number;
  certStats: {
    active: number;
    expiringSoon: number;
    expired: number;
  };
  topProviders: { name: string; value: number }[];
  expiringCerts: { 
    id: number; 
    name: string; 
    expiryDate: string; 
    provider: string; 
    employeeName: string 
  }[];
}

const ManagerDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:3000/teams/my-team/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch team stats');
        const text = await res.text();
        return text ? JSON.parse(text) : null; 
      })
      .then(data => {
        if (data) setStats(data);
        else setError('Received empty data from server.');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load team data.');
        setLoading(false);
      });
  }, [token]);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
  
  if (error || !stats) return (
    <div className="p-4">
      <Card className="border-destructive">
        <CardHeader className="py-4">
          <CardTitle className="text-destructive text-base">Error</CardTitle>
          <CardDescription>{error || 'No data available'}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  const pieData = [
    { name: 'Active', value: stats.certStats.active, color: 'hsl(var(--success))' },
    { name: 'Expiring', value: stats.certStats.expiringSoon, color: 'hsl(var(--warning))' },
    { name: 'Expired', value: stats.certStats.expired, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const barData = stats.topProviders;

  return (
    <div className="space-y-3">
      {/* ============================
          HEADER
      ============================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Team Dashboard</h1>
          <p className="text-sm text-muted-foreground">{stats.teamName} Overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/manager/team')} className="w-fit">
          <Users className="h-4 w-4 mr-2" />
          View All Members
        </Button>
      </div>

 {/* ============================
    STATS GRID - Manager
============================ */}
<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">

  {/* Team Members - Primary */}
  <Card className="border-l-4 border-l-primary shadow-sm hover:bg-muted/50 transition-colors animate-fade-in">
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle>
      <Users className="h-4 w-4 text-primary opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold">{stats.totalMembers}</div>
    </CardContent>
  </Card>

  {/* Active - Success */}
  <Card className="border-l-4 border-l-success shadow-sm hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Certs</CardTitle>
      <Award className="h-4 w-4 text-success opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold text-success">{stats.certStats.active}</div>
    </CardContent>
  </Card>

  {/* Expiring Soon - Warning */}
  <Card className="border-l-4 border-l-warning shadow-sm hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: '200ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon</CardTitle>
      <AlertTriangle className="h-4 w-4 text-warning opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold text-warning">{stats.certStats.expiringSoon}</div>
    </CardContent>
  </Card>

  {/* Expired - Destructive */}
  <Card className="border-l-4 border-l-destructive shadow-sm hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: '300ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expired</CardTitle>
      <Award className="h-4 w-4 text-destructive opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold text-destructive">{stats.certStats.expired}</div>
    </CardContent>
  </Card>
</div>

      {/* ============================
          CHARTS ROW
      ============================ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Certification Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Top Providers</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================
          UPCOMING EXPIRATIONS
      ============================ */}
      <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <div>
            <CardTitle className="text-base">Upcoming Expirations</CardTitle>
            <CardDescription className="text-xs">Attention required for these items</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/manager/certifications')} className="h-8 text-primary">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {stats.expiringCerts.length > 0 ? (
            <div className="space-y-2">
              {stats.expiringCerts.slice(0, 5).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-2.5 rounded-lg bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-full bg-warning/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{cert.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cert.employeeName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold text-warning">
                      {new Date(cert.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{cert.provider}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-7 w-7 mx-auto mb-1 opacity-50" />
              <p className="text-sm">No certifications expiring soon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;