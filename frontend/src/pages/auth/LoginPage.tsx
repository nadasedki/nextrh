// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, User, Users, Briefcase, Loader2, Shield } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const result = await login(email, password, selectedRole);
    setIsLoading(false);

    if (result.success) {
      let redirectPath = '/employee/dashboard';
      if (selectedRole === 'manager') {
        redirectPath = '/manager/dashboard';
      } else if (selectedRole === 'bid_manager') {
        redirectPath = '/bid/dashboard';
      } else if (selectedRole === 'admin') {
        redirectPath = '/admin/users';
      }
      
      navigate(redirectPath);
    } else {
      setErrorMessage(result.message || 'Login failed');
    }
  };

  const roleCards = [
    {
      role: 'employee' as UserRole,
      title: 'Employee',
      description: 'Access your CV and profile',
      icon: User,
      color: 'bg-primary text-primary-foreground',
    },
    {
      role: 'manager' as UserRole,
      title: 'Team Leader',
      description: "Monitor your team's certifications",
      icon: Users,
      color: 'bg-accent text-accent-foreground',
    },
    {
      role: 'bid_manager' as UserRole,
      title: 'BID Manager',
      description: 'Search profiles and match tenders',
      icon: Briefcase,
      color: 'bg-emerald-600 text-white',
    },
    {
      role: 'admin' as UserRole,
      title: 'Administrator',
      description: 'Manage users, roles and system',
      icon: Shield, 
      color: 'bg-rose-600 text-white',
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-8 sm:px-6">
      <div className="w-full max-w-[480px]">
        
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
              NEXTRH<span className="text-primary">+</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              AI-Driven Talent & CV Management
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl shadow-primary/5 border border-border/70 rounded-2xl backdrop-blur-md bg-card/98">
          <CardHeader className="text-center pt-7 pb-4 px-6 sm:px-8">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Select your role and enter your credentials
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-6 sm:px-8 pt-0">
              
              {/* Role Selection Grid (2x2 Balanced) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Role
                </Label>
                <div className="grid grid-cols-2 gap-2.5">
                  {roleCards.map((card) => {
                    const isSelected = selectedRole === card.role;
                    return (
                      <button
                        key={card.role}
                        type="button"
                        onClick={() => setSelectedRole(card.role)}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/[0.04] shadow-sm'
                            : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isSelected ? card.color : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <card.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`block text-xs font-semibold truncate ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {card.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-sm rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs text-primary hover:underline h-auto p-0 font-normal"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-sm rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-xs text-destructive font-medium text-center bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 animate-in fade-in duration-200">
                  {errorMessage}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2 pb-7 px-6 sm:px-8">
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold rounded-lg shadow-md transition-all active:scale-[0.99]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;