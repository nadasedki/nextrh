import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import {
  Award,
  FileText,
  GraduationCap,
  ChevronRight,
  Upload,
  Clock,
  Loader2,
  Trophy,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

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

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // -------------------------------
  // STATE MANAGEMENT
  // -------------------------------

  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // -------------------------------
  // SCORING STATE
  // -------------------------------

  const [score, setScore] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // -------------------------------
  // FETCH SCORE
  // -------------------------------

  const fetchScore = async () => {
    if (!token || !user) return;

    try {
      const res = await fetch(
        `http://localhost:3000/scoring/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      setScore(data.score);
    } catch (err) {
      console.error('Error fetching score:', err);
    }
  };

  // -------------------------------
  // RECALCULATE SCORE
  // -------------------------------

  const handleRecalculate = async () => {
    if (!token || !user) return;

    setIsRecalculating(true);

    try {
      const res = await fetch(
        `http://localhost:3000/scoring/recalculate/${user.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      setScore(data.score);
    } catch (err) {
      console.error('Error recalculating:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  // -------------------------------
  // LOAD SCORE
  // -------------------------------

  useEffect(() => {
    fetchScore();
  }, [user, token]);

  // -------------------------------
  // FETCH DASHBOARD DATA
  // -------------------------------

  useEffect(() => {
    if (!token || !user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          'http://localhost:3000/employees/me',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!res.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        setError(
          'Could not load dashboard data. Please try again later.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // -------------------------------
  // CERTIFICATION STATISTICS
  // -------------------------------

  const certStats = {
    active:
      dashboardData?.certifications.filter(
        (c) => c.status === 'active',
      ).length || 0,

    expiring:
      dashboardData?.certifications.filter(
        (c) => c.status === 'expiring_soon',
      ).length || 0,

    expired:
      dashboardData?.certifications.filter(
        (c) => c.status === 'expired',
      ).length || 0,
  };

  const chartData = [
    {
      name: 'Active',
      value: certStats.active,
      color: 'hsl(var(--success))',
    },
    {
      name: 'Expiring',
      value: certStats.expiring,
      color: 'hsl(var(--warning))',
    },
    {
      name: 'Expired',
      value: certStats.expired,
      color: 'hsl(var(--destructive))',
    },
  ].filter((d) => d.value > 0);

  // -------------------------------
  // QUICK ACTIONS
  // -------------------------------

  const quickActions = [
    {
      label: 'Upload CV',
      icon: Upload,
      onClick: () => navigate('/employee/cv-upload'),
    },
    {
      label: 'Add Certification',
      icon: Award,
      onClick: () => navigate('/employee/certifications'),
    },
    {
      label: 'View CV',
      icon: FileText,
      onClick: () => navigate('/employee/cv-preview'),
    },
  ];

  // -------------------------------
  // LOADING
  // -------------------------------

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // -------------------------------
  // ERROR
  // -------------------------------

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="py-4">
          <CardTitle className="text-destructive">
            Error
          </CardTitle>

          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // -------------------------------
  // DASHBOARD
  // -------------------------------

  return (
    <div className="space-y-3">

      {/* ============================
          WELCOME HEADER
      ============================ */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>

          <p className="text-sm text-muted-foreground">
            {dashboardData?.title} •{' '}
            {dashboardData?.yearsOfExperience} years experience
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

     {/* ============================
    STATS GRID - Employee
============================ */}
<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">

  {/* Certifications - Primary */}
  <Card className="border-l-4 border-l-primary shadow-sm hover:bg-muted/50 transition-colors animate-fade-in">
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Total Certifications
      </CardTitle>
      <Award className="h-4 w-4 text-primary opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold">{dashboardData?.certifications.length || 0}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{certStats.active} active</p>
    </CardContent>
  </Card>

  {/* Training - Accent */}
  <Card className="border-l-4 border-l-accent shadow-sm hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Training
      </CardTitle>
      <GraduationCap className="h-4 w-4 text-accent opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold">{dashboardData?.trainings.length || 0}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5">Completed courses</p>
    </CardContent>
  </Card>

  {/* Projects - Success */}
  <Card className="border-l-4 border-l-success shadow-sm hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: '200ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Projects
      </CardTitle>
      <FileText className="h-4 w-4 text-success opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="text-2xl font-bold">{dashboardData?.projects.length || 0}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5">Client engagements</p>
    </CardContent>
  </Card>

  {/* Score - Special primary glow */}
  <Card className="border-l-4 border-l-primary bg-primary/5 shadow-sm hover:bg-primary/10 transition-colors animate-fade-in" style={{ animationDelay: '300ms' }}>
    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider">
        Expertise Score
      </CardTitle>
      <Trophy className="h-4 w-4 text-primary opacity-70" />
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">{score ?? '--'}</div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRecalculate} disabled={isRecalculating}>
          {isRecalculating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
        </Button>
      </div>
    </CardContent>
  </Card>
</div>

      {/* ============================
          CERTIFICATION STATUS
      ============================ */}

      <Card
        className="animate-fade-in"
        style={{ animationDelay: '400ms' }}
      >
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">
            Certification Status
          </CardTitle>

          <CardDescription className="text-xs">
            Overview of your professional certifications
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">

          <div className="flex flex-col md:flex-row gap-4">

            {/* Chart */}

            <div className="w-full md:w-36 h-32 shrink-0">

              {chartData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor:
                          'hsl(var(--popover))',
                        border:
                          '1px solid hsl(var(--border))',
                        borderRadius: '8px',
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

            <div className="flex-1 space-y-2">

              {dashboardData?.certifications
                .slice(0, 4)
                .map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">

                      <p className="font-medium text-sm truncate">
                        {cert.name}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {cert.issuer}
                      </p>

                    </div>

                    <StatusBadge status={cert.status} />
                  </div>
                ))}

              {/* No certifications */}

              {(!dashboardData?.certifications ||
                dashboardData.certifications.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">

                  <Award className="h-7 w-7 mx-auto mb-1 opacity-50" />

                  <p className="text-sm">
                    No certifications added yet
                  </p>

                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      navigate('/employee/certifications')
                    }
                  >
                    Add your first certification
                  </Button>

                </div>
              )}

              {/* View all */}

              {dashboardData?.certifications &&
                dashboardData.certifications.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary h-8"
                    onClick={() =>
                      navigate('/employee/certifications')
                    }
                  >
                    View all certifications
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

            </div>
          </div>

        </CardContent>
      </Card>

     {/* ============================
          CV STATUS (Conditional UI)
      ============================ */}
      <Card
        className="animate-fade-in"
        style={{ animationDelay: '500ms' }}
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base">CV Status</CardTitle>
              <CardDescription className="text-xs">
                Your current CV information
              </CardDescription>
            </div>

            {/* Only show "View CV" button if a CV actually exists */}
            {dashboardData?.cvLastUpdated && dashboardData.cvLastUpdated !== 'Never' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/employee/cv-preview')}
                className="shrink-0"
              >
                <FileText className="h-4 w-4 mr-2" />
                View CV
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">
          {dashboardData?.cvLastUpdated && dashboardData.cvLastUpdated !== 'Never' ? (
            /* ================= STATE 1: CV EXISTS ================= */
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {user?.name}_CV.pdf
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Last updated: {dashboardData.cvLastUpdated}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/employee/cv-upload')}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Update CV
              </Button>
            </div>
          ) : (
            /* ================= STATE 2: NO CV UPLOADED YET ================= */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border border-dashed">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                  <FileText className="h-5 w-5 opacity-60" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    No CV uploaded yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload your CV to automatically fill your profile, projects, and skills.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => navigate('/employee/cv-upload')}
                className="shrink-0 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default EmployeeDashboard;

