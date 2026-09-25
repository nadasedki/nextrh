import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common';
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
  FileText,
  Printer,
  FileOutput
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
  score?: number;
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

const BidEmployeeProfilePage: React.FC = () => {
  const { id, memberId } = useParams();
  const targetId = id || memberId;

  const navigate = useNavigate();
  const { token } = useAuth();

  const [member, setMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Employee Profile
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

        if (!response.ok) throw new Error('Failed to fetch employee details');

        const data = await response.json();
        setMember(data);
      } catch (err) {
        console.error(err);
        setError('Employee profile not found');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">{error || "Employee not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = member.cv_full_name || member.full_name;
  const displayProfession = member.cv_profession || member.title || 'Employee';
  const displayEmail = member.cv_email || member.email;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-muted/80 w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print Profile
          </Button>
          <Button 
            size="sm"
            onClick={() => navigate('/bid/cv-generation')}
          >
            <FileOutput className="h-4 w-4 mr-2" />
            Generate Custom Proposal CV
          </Button>
        </div>
      </div>

      {/* Main Resume Document Card (Read-Only) */}
      <Card className="shadow-xl border-border bg-card">
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

            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                {member.years_of_experience || 0} years experience
              </Badge>
              {member.score !== undefined && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-semibold">
                  Score: {member.score} pts
                </Badge>
              )}
            </div>
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
                Technical Skills & Competencies
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

          {/* Project Experience (Crucial for Bids/Proposals) */}
          {member.projects && member.projects.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Project Experience & References
              </h2>
              <div className="space-y-6">
                {member.projects.map((project) => (
                  <div key={project.id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{project.name}</h3>
                        {project.role && <p className="text-xs sm:text-sm text-primary font-medium">{project.role}</p>}
                        {project.client && <p className="text-xs text-muted-foreground font-medium">Client: {project.client}</p>}
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

          {/* Professional Development & Training Section (Read-Only) */}
          {member.trainings && member.trainings.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Professional Development & Completed Courses
              </h2>
              <div className="space-y-2.5">
                {member.trainings.map((training) => (
                  <div 
                    key={training.training_id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50 gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{training.training_name}</p>
                      <p className="text-xs text-muted-foreground">{training.provider}</p>
                      {training.description && (
                        <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-2">
                          {training.description}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right text-xs text-muted-foreground shrink-0">
                      <p className="font-medium text-foreground">{formatDate(training.completion_date)}</p>
                      <p className="text-[11px] text-muted-foreground">{training.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default BidEmployeeProfilePage;