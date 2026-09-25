import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Trash2, Search, UserCheck, Loader2, Eye, Key, UserX, UserPlus, Users } from 'lucide-react'; 
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
      fetchUserDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Handle Deactivating / Activating a User
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
      fetchUserDirectory();
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
      fetchUserDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user');
    }
  };

  // Handle manual password reset triggers
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
    if (u.role?.role_name === 'ADMIN') return false;

    const searchString = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchString) ||
      u.email?.toLowerCase().includes(searchString) ||
      u.role?.role_name?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col overflow-hidden animate-fade-in px-3 sm:px-6">
      
      {/* Header (Shrink-0 to keep height tight) */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Administration</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Provision new user credentials, monitor active profiles, and manage structural security roles.
        </p>
      </div>

      {/* Main Grid fitting remaining screen height */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch flex-1 min-h-0 overflow-hidden">
        
        {/* Provision Form Card */}
        <Card className="border border-muted shadow-sm lg:col-span-1 flex flex-col h-full overflow-hidden bg-card">
          <CardHeader className="py-3 px-4 shrink-0 bg-muted/20 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Account Provisioning
            </CardTitle>
            <CardDescription className="text-xs">Register a new system profile</CardDescription>
          </CardHeader>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3.5">
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="h-8.5 text-xs" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="h-8.5 text-xs" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-8.5 text-xs" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-medium">Security Role</Label>
                <select
                  id="role"
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full p-2 border border-muted rounded-md bg-background text-foreground text-xs h-8.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>Employee (EMPLOYEE)</option>
                  <option value={2}>Team Manager (TEAM_LEADER)</option>
                  <option value={3}>BID Manager (BID_MANAGER)</option>
                  <option value={4}>Administrator (ADMIN)</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-9 text-xs font-semibold mt-3" disabled={isSubmitLoading}>
                {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Directory Table Card */}
        <Card className="border border-muted shadow-sm lg:col-span-2 flex flex-col h-full overflow-hidden bg-card">
          <CardHeader className="py-2.5 px-4 shrink-0 bg-muted/20 border-b flex flex-row items-center justify-between space-y-0">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Directory
                {!isFetchLoading && (
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 h-5 px-2">
                    {filteredUsers.length} accounts
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">Active and manageable profiles</CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="relative w-40 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
            {isFetchLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs">Loading directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No profiles match your search criteria.
              </div>
            ) : (
              /* Internal Scrollable Table Area */
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto border border-muted rounded-lg relative bg-background shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-muted">
                    <tr className="text-[11px] font-semibold text-muted-foreground uppercase">
                      <th className="p-2.5 pl-3">Profile Name</th>
                      <th className="p-2.5">Email Address</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-muted bg-card">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 pl-3 font-medium text-foreground">{user.full_name}</td>
                        <td className="p-2.5 text-muted-foreground">{user.email}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted border border-muted-foreground/20 text-muted-foreground">
                            {user.role?.role_name || 'N/A'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${user.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        
                        {/* Actions column */}
                        <td className="p-2.5 pr-3 text-right space-x-0.5 whitespace-nowrap">
                          {/* View Profile button (Employee only) */}
                          {user.role?.role_name === 'EMPLOYEE' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/employee/${user.user_id}`)}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
                              title="View Employee Profile"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Toggle Active Status */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(user)}
                            className={`h-7 w-7 ${user.active ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"}`}
                            title={user.active ? "Deactivate Account" : "Activate Account"}
                          >
                            {user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          
                          {/* Trigger Password Reset */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTriggerReset(user.email)}
                            className="text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 h-7 w-7"
                            title="Send Password Reset Link"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          
                          {/* Delete Account Permanently */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                            title="Delete Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

export default AdminUserManagement;