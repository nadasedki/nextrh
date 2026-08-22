import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Mail, 
  Building2, 
  Calendar, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Loader2, 
  Phone, 
  MapPin, 
  Hash,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface UserSkill {
  skill: { skill_name: string; };
  level: string;
}

interface Certification {
  certId: number;
  certName: string;
  provider: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
  client: string;
  role: string;
  description: string;
  technologies: string[];
}

interface Training {
  training_id: number;
  training_name: string;
  provider: string;
  completion_date: string;
  duration: string;
  description?: string; // Optional description property
}

interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  cv_full_name?: string;
  cv_profession?: string;
  cv_phone?: string;
  cv_fax?: string;
  cv_address?: string;
  cv_skills?: string[];
  cv_email?: string;

  years_of_experience: number;

  certifications: Certification[];

  projects?: Project[]; 
  trainings?: Training[]; 
}

const MemberProfilePage: React.FC = () => {
  const { memberId, id } = useParams(); 
  const targetId = memberId || id; 

  const navigate = useNavigate();
  const { token, user } = useAuth(); // Retrieve token and user profile to verify roles [1.1.2]

  // Role-Based Access Control: Show actions only to managers & team leaders [1.1.2]
 const canManage = user?.role === 'manager' || user?.role === 'bid_manager' || user?.role === 'admin';
  const [member, setMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog & Form States for Training CRUD
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [editingTrainingId, setEditingTrainingId] = useState<number | null>(null);
  const [trainingForm, setTrainingForm] = useState({
    training_name: '',
    provider: '',
    description: '',
    completion_date: '',
    duration: '',
  });

  // Fetch Member Details
  useEffect(() => {
    if (!token || !targetId) return;

    const fetchMember = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/employees/${targetId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch member details');

        const data = await response.json();
        setMember(data);
      } catch (err) {
        console.error(err);
        setError('Member not found');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [targetId, token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // ==========================================
  // TRAINING CRUD OPERATIONS
  // ==========================================

  const handleDeleteTraining = async (trainingId: number) => {
    if (!confirm('Are you sure you want to delete/unassign this training?')) return;

    try {
      const res =  await fetch(`http://localhost:3000/trainings/${id}/${targetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete training');

      // Update state locally so change is visible immediately
      setMember(prev => {
        if (!prev) return null;
        return {
          ...prev,
          trainings: prev.trainings?.filter(t => t.training_id !== trainingId) || []
        };
      });
    } catch (err) {
      console.error('Error deleting training:', err);
    }
  };

  const openEditTraining = (training: Training) => {
    setEditingTrainingId(training.training_id);
    setTrainingForm({
      training_name: training.training_name,
      provider: training.provider,
      description: training.description || '',
      completion_date: formatDateForInput(training.completion_date),
      duration: training.duration || '',
    });
    setIsTrainingDialogOpen(true);
  };

  const handleAddOrEditTraining = async () => {
    const method = editingTrainingId ? 'PATCH' : 'POST';
   const url = editingTrainingId
      ? `http://localhost:3000/trainings/${editingTrainingId}/${targetId}` 
      : `http://localhost:3000/trainings/${targetId}`;                    

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(trainingForm),
      });

      if (!res.ok) throw new Error('Failed to save training');
      const savedTraining = await res.json();

      setMember(prev => {
        if (!prev) return null;
        const currentTrainings = prev.trainings || [];
        let updatedTrainings;

        if (editingTrainingId) {
          updatedTrainings = currentTrainings.map(t =>
            t.training_id === editingTrainingId ? savedTraining : t
          );
        } else {
          updatedTrainings = [...currentTrainings, savedTraining];
        }

        return {
          ...prev,
          trainings: updatedTrainings,
        };
      });

      // Clear Form & Close dialog
      setTrainingForm({
        training_name: '',
        provider: '',
        description: '',
        completion_date: '',
        duration: '',
      });
      setEditingTrainingId(null);
      setIsTrainingDialogOpen(false);
    } catch (err) {
      console.error('Error saving training:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  if (error || !member) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">{error || "Member not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      {/* Profile Header */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {member.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{member.cv_full_name}</h1>
              <p className="text-lg text-primary font-medium">{member.cv_profession || 'Employee'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {member.cv_email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-primary" />
                  {member.cv_phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-primary" />
                  Fax: {member.cv_fax}
                </span>
                <span className="flex items-center col-span-full gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {member.cv_address}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {member.cv_skills && member.cv_skills.length > 0 ? (
                member.cv_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm bg-primary/5 text-primary border-primary/10">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certifications ({member.certifications?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.certifications && member.certifications.length > 0 ? (
              <div className="space-y-3">
                {member.certifications.map((cert) => (
                  <div
                    key={cert.certId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{cert.certName}</p>
                      <p className="text-xs text-muted-foreground">{cert.provider}</p>
                    </div>
                    <StatusBadge status={cert.status as any} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No certifications recorded
              </p>
            )}
          </CardContent>
        </Card>

        {/* Training Card with Conditional CRUD Button */}
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Training ({member.trainings?.length || 0})
            </CardTitle>
            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingTrainingId(null);
                  setTrainingForm({
                    training_name: '',
                    provider: '',
                    description: '',
                    completion_date: '',
                    duration: '',
                  });
                  setIsTrainingDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign Training
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {member.trainings && member.trainings.length > 0 ? (
              <div className="space-y-3">
                {member.trainings.map((training) => (
                  <div key={training.training_id} className="p-3 rounded-lg bg-muted/50 relative group">
                    {canManage && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditTraining(training)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteTraining(training.training_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="font-medium text-sm pr-16">{training.training_name}</p>
                    <p className="text-xs text-muted-foreground">{training.provider}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(training.completion_date)} • {training.duration}
                    </p>
                    {training.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {training.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No training records
              </p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Projects ({member.projects?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.projects && member.projects.length > 0 ? (
              <div className="space-y-3">
                {member.projects.map((project) => (
                  <div key={project.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {project.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies?.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No project records
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Modal for Managing Assigned Trainings */}
      <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTrainingId ? 'Edit Assigned Training' : 'Assign New Training'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Training Name</Label>
              <Input
                placeholder="e.g., Docker Certified Associate"
                value={trainingForm.training_name}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    training_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Provider</Label>
              <Input
                placeholder="e.g., Coursera, Udemy, Cisco"
                value={trainingForm.provider}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    provider: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Completion Date</Label>
              <Input
                type="date"
                value={trainingForm.completion_date}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    completion_date: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Duration</Label>
              <Input
                placeholder="e.g., 40 hours, 3 weeks"
                value={trainingForm.duration}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    duration: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                placeholder="Briefly describe the training content..."
                value={trainingForm.description}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTrainingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddOrEditTraining}>
              {editingTrainingId ? 'Save Changes' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberProfilePage;