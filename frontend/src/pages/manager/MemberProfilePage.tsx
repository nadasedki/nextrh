import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Trash2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface Certification {
  certId?: number;
  id?: number;
  certName?: string;
  name?: string;
  provider?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  expirationDate?: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
  client?: string;
  role?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  description?: string;
  technologies?: string[];
}

interface Education {
  id?: number;
  education_id?: number;
  degree: string;
  field?: string;
  field_of_study?: string;
  institution: string;
  startYear?: number;
  start_year?: number;
  graduationYear?: number;
  end_year?: number;
}

interface Experience {
  id: number;
  company: string;
  role?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  description?: string;
}

interface Training {
  training_id: number;
  training_name: string;
  provider: string;
  completion_date: string;
  duration: string;
  description?: string;
}

interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  title?: string;
  cv_full_name?: string;
  cv_profession?: string;
  cv_phone?: string;
  cv_fax?: string;
  cv_address?: string;
  cv_skills?: string[];
  cv_email?: string;
  summary?: string;
  years_of_experience: number;
  certifications?: Certification[];
  projects?: Project[]; 
  trainings?: Training[];
  education?: Education[];
  experiences?: Experience[];
}

const MemberProfilePage: React.FC = () => {
  const { memberId, id } = useParams(); 
  const targetId = memberId || id; 

  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Role check for management actions
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const getYear = (dateStr?: string | null): string | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getFullYear().toString();
  };

  const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
    const startYear = getYear(startDate);
    const endYear = endDate ? (getYear(endDate) || 'Present') : 'Present';

    if (!startYear && endYear && endYear !== 'Present') return endYear;
    if (startYear && endYear && startYear === endYear) return startYear;
    if (startYear && (!endDate || endYear === 'Present')) return `${startYear} - Present`;
    if (startYear && endYear) return `${startYear} - ${endYear}`;
    return endYear || 'N/A';
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
    if (!confirm('Are you sure you want to delete this training record?')) return;

    try {
      const res = await fetch(`http://localhost:3000/trainings/${trainingId}/${targetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete training');

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

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

  const displayName = member.cv_full_name || member.full_name;
  const displayProfession = member.cv_profession || member.title || 'Employee';
  const displayEmail = member.cv_email || member.email;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-muted/80">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

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
            <Plus className="h-4 w-4 mr-1.5" />
            Assign Training
          </Button>
        )}
      </div>

      {/* Main Document Preview Card */}
      <Card className="max-w-4xl mx-auto shadow-xl border-border bg-card">
        <CardContent className="p-8 sm:p-10 space-y-8">
          
          {/* Header & Identity Section */}
          <div className="text-center pb-6 border-b border-border/80 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {displayName}
            </h1>
            <p className="text-xl text-primary font-medium">
              {displayProfession}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {displayEmail}
              </span>
              {member.cv_phone && member.cv_phone !== 'N/A' && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-primary" />
                  {member.cv_phone}
                </span>
              )}
              {member.cv_fax && member.cv_fax !== 'N/A' && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-primary" />
                  Fax: {member.cv_fax}
                </span>
              )}
            </div>

            {member.cv_address && member.cv_address !== 'N/A' && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground pt-1">
                <MapPin className="h-4 w-4 text-primary" />
                {member.cv_address}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {member.summary && (
            <section className="space-y-2.5">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Professional Summary
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {member.summary}
              </p>
            </section>
          )}

          {/* Technical Skills */}
          {member.cv_skills && member.cv_skills.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {member.cv_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs sm:text-sm py-1 px-2.5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Work Experience */}
          {member.experiences && member.experiences.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Work Experience
              </h2>
              <div className="space-y-6">
                {member.experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          {exp.role || exp.company}
                        </h3>
                        {exp.role && (
                          <p className="text-xs sm:text-sm text-primary font-medium">{exp.company}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateRange(exp.startDate || exp.start_date, exp.endDate || exp.end_date)}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed pt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Project Experience */}
          {member.projects && member.projects.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Project Experience
              </h2>
              <div className="space-y-6">
                {member.projects.map((project) => (
                  <div key={project.id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{project.name}</h3>
                        {project.role && <p className="text-xs sm:text-sm text-primary font-medium">{project.role}</p>}
                        {project.client && <p className="text-xs text-muted-foreground">{project.client}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateRange(project.startDate || project.start_date, project.endDate || project.end_date)}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground pt-1 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-[11px]">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications Section */}
          {member.certifications && member.certifications.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certifications ({member.certifications.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {member.certifications.map((cert, idx) => {
                  const certId = cert.certId || cert.id || idx;
                  const name = cert.certName || cert.name;
                  const issuer = cert.provider || cert.issuer;
                  const expiry = cert.expiryDate || cert.expirationDate;

                  return (
                    <div
                      key={certId}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60"
                    >
                      <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{issuer}</p>
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/40">
                          <span className="text-[11px] text-muted-foreground">
                            Expires: {formatDate(expiry)}
                          </span>
                          <StatusBadge status={cert.status as any} className="text-[10px] py-0" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Education Section */}
          {member.education && member.education.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education & Academic Background
              </h2>
              <div className="space-y-6">
                {member.education.map((edu, idx) => (
                  <div key={edu.id || edu.education_id || idx} className="relative pl-6 border-l-2 border-muted hover:border-primary/50 transition-colors">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-muted" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <h3 className="font-bold text-foreground text-sm sm:text-base">{edu.degree}</h3>
                        <p className="text-xs sm:text-sm text-primary font-medium">{edu.field || edu.field_of_study}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {edu.institution}
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full h-fit w-fit">
                        {edu.startYear || edu.start_year} — {edu.graduationYear || edu.end_year}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Development & Training Section (WITH CRUD ACTIONS) */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Professional Development & Training
              </h2>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
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
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Training
                </Button>
              )}
            </div>

            {member.trainings && member.trainings.length > 0 ? (
              <div className="space-y-3">
                {member.trainings.map((training) => (
                  <div 
                    key={training.training_id} 
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground">{training.training_name}</p>
                      <p className="text-xs text-muted-foreground">{training.provider}</p>
                      {training.description && (
                        <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-2">
                          {training.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted-foreground shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-foreground">{formatDate(training.completion_date)}</p>
                        <p className="text-[11px] text-muted-foreground">{training.duration}</p>
                      </div>

                      {/* Management Action Buttons */}
                      {canManage && (
                        <div className="flex items-center gap-1 pl-2 border-l border-border/60">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEditTraining(training)}
                            title="Edit Training"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTraining(training.training_id)}
                            title="Delete Training"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">
                No training or course records assigned yet.
              </p>
            )}
          </section>

        </CardContent>
      </Card>

      {/* Dialog Modal for Assigning / Editing Trainings */}
      <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingTrainingId ? 'Edit Training Record' : 'Assign New Training'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Training Name</Label>
              <Input
                placeholder="e.g., AWS Certified Solutions Architect"
                value={trainingForm.training_name}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    training_name: e.target.value,
                  })
                }
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Provider / Platform</Label>
              <Input
                placeholder="e.g., Coursera, Udemy, Cisco"
                value={trainingForm.provider}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    provider: e.target.value,
                  })
                }
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Completion Date</Label>
                <Input
                  type="date"
                  value={trainingForm.completion_date}
                  onChange={(e) =>
                    setTrainingForm({
                      ...trainingForm,
                      completion_date: e.target.value,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration</Label>
                <Input
                  placeholder="e.g., 40h, 3 weeks"
                  value={trainingForm.duration}
                  onChange={(e) =>
                    setTrainingForm({
                      ...trainingForm,
                      duration: e.target.value,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description (Optional)</Label>
              <Textarea
                placeholder="Briefly describe key covered competencies..."
                value={trainingForm.description}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    description: e.target.value,
                  })
                }
                className="text-sm min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTrainingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddOrEditTraining}>
              {editingTrainingId ? 'Save Changes' : 'Assign Training'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberProfilePage;