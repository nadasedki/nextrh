import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { Award, FileText, GraduationCap, Bell, ChevronRight, Upload, Clock, Loader2, Trophy, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


interface Cert {
  id: number;
  name: string;
  issuer: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface Training {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface DashboardData {
  title: string;
  yearsOfExperience: number;
  certifications: Cert[];
  trainings: Training[];
  projects: Project[];
  cvLastUpdated: string;
}
// ---------------------------------------------

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Assuming token is stored here

  // --- STATE MANAGEMENT FOR API DATA ---
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // -------------------------------------
// --- SCORING STATE ---
  const [score, setScore] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Fonction pour récupérer le score
  const fetchScore = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`http://localhost:3000/scoring/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setScore(data.score);
    } catch (err) {
      console.error('Error fetching score:', err);
    }
  };

  // Fonction pour recalculer le score
  const handleRecalculate = async () => {
    if (!token || !user) return;
    setIsRecalculating(true);
    try {
      const res = await fetch(`http://localhost:3000/scoring/recalculate/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setScore(data.score);
    } catch (err) {
      console.error('Error recalculating:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Charger le score au montage du composant
  useEffect(() => {
    fetchScore();
  }, [user, token]);
  // --- FETCH DATA FROM BACKEND ---
  useEffect(() => {
    if (!token || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/employees/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        setError('Could not load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);
  // -------------------------------

  // Derived state for stats
  const certStats = {
    active: dashboardData?.certifications.filter((c) => c.status === 'active').length || 0,
    expiring: dashboardData?.certifications.filter((c) => c.status === 'expiring_soon').length || 0,
    expired: dashboardData?.certifications.filter((c) => c.status === 'expired').length || 0,
  };

  const chartData = [
    { name: 'Active', value: certStats.active, color: 'hsl(var(--success))' },
    { name: 'Expiring', value: certStats.expiring, color: 'hsl(var(--warning))' },
    { name: 'Expired', value: certStats.expired, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const quickActions = [
    { label: 'Upload CV', icon: Upload, onClick: () => navigate('/employee/cv-upload') },
    { label: 'Add Certification', icon: Award, onClick: () => navigate('/employee/certifications') },
    { label: 'View CV', icon: FileText, onClick: () => navigate('/employee/cv-preview') },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">{dashboardData?.title} • {dashboardData?.yearsOfExperience} years experience</p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Button key={action.label} variant="outline" size="sm" onClick={action.onClick}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Certifications</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.certifications.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {certStats.active} active, {certStats.expiring} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Training Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.trainings.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Professional development courses
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.projects.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Client engagements
            </p>
          </CardContent>
        </Card>
         <Card className="animate-fade-in border-primary/20 bg-primary/5" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Expertise Score</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-primary">{score ?? '--'}</div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-primary/10" 
                onClick={handleRecalculate}
                disabled={isRecalculating}
              >
                {isRecalculating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur vos certifs et projets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Certification Status */}
        <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg">Certification Status</CardTitle>
            <CardDescription>Overview of your professional certifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Chart */}
              <div className="w-full md:w-48 h-48">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No certifications yet
                  </div>
                )}
              </div>

              {/* Certification List */}
              <div className="flex-1 space-y-3">
                {dashboardData?.certifications.slice(0, 4).map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    </div>
                    <StatusBadge status={cert.status} />
                  </div>
                ))}
                {(!dashboardData?.certifications || dashboardData.certifications.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No certifications added yet</p>
                    <Button variant="link" size="sm" onClick={() => navigate('/employee/certifications')}>
                      Add your first certification
                    </Button>
                  </div>
                )}
                {dashboardData?.certifications && dashboardData.certifications.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full text-primary"
                    onClick={() => navigate('/employee/certifications')}
                  >
                    View all certifications
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Note: This requires a separate backend endpoint for notifications */}
            <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No new notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CV Status */}
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">CV Status</CardTitle>
              <CardDescription>Your current CV information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/employee/cv-preview')}>
              <FileText className="h-4 w-4 mr-2" />
              View CV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.name}_CV.pdf</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last updated: {dashboardData?.cvLastUpdated || 'Never'}
              </div>
            </div>
            <Button onClick={() => navigate('/employee/cv-upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Update CV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;