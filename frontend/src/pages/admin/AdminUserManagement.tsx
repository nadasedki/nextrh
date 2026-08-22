import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Trash2, Search, UserCheck, Loader2, Eye, Key, UserX } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';

interface DisplayUser {
  user_id: number;
  email: string;
  full_name: string;
  role: { role_name: string };
  active: boolean;
}

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState(1); 
  
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(true);

  // Fetch User Directory
  const fetchUserDirectory = async () => {
    setIsFetchLoading(true);
    try {
      const response = await fetch('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Could not retrieve user catalog');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching user directory');
    } finally {
      setIsFetchLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserDirectory();
    }
  }, [token]);

  // Handle Registering a User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password, 
          full_name: fullName,
          role_id: Number(roleId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast.success('Account provisioned successfully!');
      setEmail('');
      setPassword(''); 
      setFullName('');
      fetchUserDirectory(); // Refresh directory table
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Handle Deactivating / Activating a User (Uses the PATCH route)
  const handleToggleActive = async (user: DisplayUser) => {
    try {
      const response = await fetch(`http://localhost:3000/users/${user.user_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !user.active }), 
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`User successfully ${!user.active ? 'activated' : 'deactivated'}`);
      fetchUserDirectory(); // Refresh directory table
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  // Handle Deleting/Terminating a User Permanently
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to terminate this user account permanently?')) return;

    try {
      const response = await fetch(`http://localhost:3000/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete account');
      
      toast.success('User account terminated successfully');
      fetchUserDirectory(); // Refresh directory table
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user');
    }
  };

  // Handle manual password reset triggers (sends real email via backend SMTP)
  const handleTriggerReset = async (email: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      toast.success(`Password reset email sent successfully to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    }
  };

  // Filter and search users (Excluding Administrators)
  const filteredUsers = users.filter((u) => {
    if (u.role?.role_name === 'ADMIN') return false; // Hide Admins 

    const searchString = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchString) ||
      u.email?.toLowerCase().includes(searchString) ||
      u.role?.role_name?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground">
          Provision new user credentials, monitor active profiles, and manage structural security roles.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Provision Form */}
        <Card className="border border-muted shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Account Provisioning</CardTitle>
            <CardDescription>Register a new system profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role">Security Role</Label>
                <select
                  id="role"
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full p-2 border border-muted rounded-md bg-background text-foreground text-sm h-10"
                >
                  <option value={1}>Employee (EMPLOYEE)</option>
                  <option value={2}>Team Manager (TEAM_LEADER)</option>
                  <option value={3}>BID Manager (BID_MANAGER)</option>
                  <option value={4}>Administrator (ADMIN)</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-10 mt-2" disabled={isSubmitLoading}>
                {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Directory Table */}
        <Card className="border border-muted shadow-sm lg:col-span-2 h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1.5">
              {/* Dynamic Badge directly next to Title */}
              <CardTitle className="flex items-center gap-2">
                User Directory
                {!isFetchLoading && (
                  <Badge variant="secondary" className="text-xs bg-primary/5 text-primary border border-primary/10">
                    {filteredUsers.length} accounts
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time view of system active profiles.</CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isFetchLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No profiles match your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto border border-muted rounded-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-muted text-xs font-semibold text-muted-foreground uppercase">
                      <th className="p-3">Profile Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-muted">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-medium">{user.full_name}</td>
                        <td className="p-3 text-muted-foreground">{user.email}</td>
                        <td className="p-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-muted border border-muted-foreground/20 text-muted-foreground">
                            {user.role?.role_name || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.active ? 'text-success' : 'text-muted-foreground'}`}>
                            <span className={`h-2 w-2 rounded-full ${user.active ? 'bg-success' : 'bg-muted-foreground'}`} />
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        
                        {/* Actions column */}
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {/* View Profile button (Employee only) */}
                          {user.role?.role_name === 'EMPLOYEE' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/employee/${user.user_id}`)}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="View Employee Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Toggle Active Status (UserCheck/UserX) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(user)}
                            className={user.active ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-success hover:bg-success/10"}
                            title={user.active ? "Deactivate Account" : "Activate Account"}
                          >
                            {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          
                          {/* Trigger Password Reset (Generates secure token) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTriggerReset(user.email)}
                            className="text-muted-foreground hover:text-warning hover:bg-warning/10"
                            title="Send Password Reset Link"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Account Permanently */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};