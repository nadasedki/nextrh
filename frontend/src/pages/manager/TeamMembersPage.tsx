import React, { useState, useEffect,useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Award, AlertTriangle, Download, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // or your preferred toast library
// 1. UPDATED: Interface to match backend API response
interface ApiTeamMember {
  id: number;
  name: string;
  email: string;
  title: string;
  yearsOfExperience: number;
 // skills: string[];
  certifications: { status: string }[];
}

const TeamMembersPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // 2. State management
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<ApiTeamMember | null>(null);
const fetchMembers = useCallback(async () => {
  if (!token) return;
  setLoading(true);
  try {
    const res = await fetch('http://localhost:3000/teams/my-team/members', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });
    if (!res.ok) throw new Error('Failed to fetch team members');
    const data = await res.json();
    setTeamMembers(data);
  } catch (err) {
    console.error(err);
    // toast.error("Could not load team members"); // si vous utilisez des toasts
  } finally {
    setLoading(false);
  }
}, [token]); // Dépendance sur le token
  // 3. Fetch data from backend
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('http://localhost:3000/teams/my-team/members', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch team members');
        return res.json();
      })
      .then(data => {
        setTeamMembers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load team members.');
        setLoading(false);
      });
  }, [token]);

  // 4. Filtering Logic
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.title.toLowerCase().includes(searchQuery.toLowerCase()) 
   // member.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getExpiringCount = (emp: ApiTeamMember) =>
    emp.certifications.filter((c) => c.status === 'expiring_soon').length;

  const getActiveCount = (emp: ApiTeamMember) =>
    emp.certifications.filter((c) => c.status === 'active').length;

  // 5. Loading/Error Handling
  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
//added 
const handleAddMember = async () => {
  try {
    const res = await fetch('http://localhost:3000/teams/members', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email: newMemberEmail }),
    });

    // If the server returns a 400 or 404 error
    if (!res.ok) {
      // 1. Safely parse the JSON body returned by your backend
      const errorData = await res.json().catch(() => ({}));
      
      // 2. Extract the specific NestJS error message, or fall back to a default string
      const serverMessage = errorData.message || 'Failed to add';
      
      // 3. Throw the actual error so it triggers the catch-block below
      throw new Error(serverMessage);
    }

    toast.success("Member added");
    setIsAddOpen(false);
    setNewMemberEmail('');
    fetchMembers();
  } catch (err: any) { 
    // 4. Display the actual error message dynamically in your toast notification
    toast.error(err.message || "Error adding member"); 
  }
};
const handleRemoveMember = async () => {
  if (!memberToRemove) return;
  try {
    await fetch(`http://localhost:3000/teams/members/${memberToRemove.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
    toast.success("Member removed");
  } catch (err) { toast.error("Error removing member"); }
  setMemberToRemove(null);
};
  return (
    <div className="space-y-6">
      {/* Header */}
     {/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  {/* LEFT: Title and Count */}
  <div>
    <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
    <p className="text-muted-foreground">{teamMembers.length} members</p>
  </div>

  {/* RIGHT: Buttons grouped together */}
  <div className="flex items-center gap-2">
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export List
    </Button>
    
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> 
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Enter user email to add them to your team.
          </DialogDescription>
        </DialogHeader>
        <Input 
          placeholder="email@example.com" 
          value={newMemberEmail} 
          onChange={(e) => setNewMemberEmail(e.target.value)} 
        />
        <DialogFooter>
          <Button onClick={handleAddMember}>Add to Team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, title, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Active Certs</TableHead>
                <TableHead className="text-center">Expiring</TableHead>
               {/*  <TableHead>Top Skills</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{member.title}</p>
                      <p className="text-xs text-muted-foreground">{member.yearsOfExperience} years exp.</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-success" />
                      <span className="font-medium">{getActiveCount(member)}</span>
                      <span className="text-muted-foreground">/ {member.certifications.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getExpiringCount(member) > 0 ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {getExpiringCount(member)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  {/*<TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {member.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{member.skills.length - 3}</Badge>
                      )}
                    </div>
                   
                  </TableCell> */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/manager/member/${member.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive hover:bg-destructive/10"
  onClick={() => setMemberToRemove(member)}
>
  <Trash2 className="h-4 w-4 mr-1" /> Remove
</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMembers.length === 0 && (
            <div className="py-16 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">No members found</h3>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove <strong>{memberToRemove?.name}</strong> from the team.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-white hover:bg-destructive/90">
        Confirm Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
};

export default TeamMembersPage;