import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // 1. Import Auth
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common';
import { ArrowLeft, Mail, Building2, Calendar, Award, Briefcase, GraduationCap, Code, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// 2. Define Interface based on your DB Schema & Postman Response
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
}

interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  title: string | null;
  years_of_experience: number;
  summary: string | null;
  userSkills: UserSkill[];
  certifications: Certification[];
  department?: string;
  projects?: Project[]; 
  trainings?: Training[]; 
}

const MemberProfilePage: React.FC = () => {
  // 3. Handle both URL parameter types (Manager vs Bid)
  const { memberId, id } = useParams(); 
  const targetId = memberId || id; // Use whichever exists

  const navigate = useNavigate();
  const { token } = useAuth();

  const [member, setMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Fetch Real Data
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
              <h1 className="text-2xl font-bold text-foreground">{member.full_name}</h1>
              <p className="text-lg text-primary font-medium">{member.title || 'Employee'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {member.email}
                </span>
                {/* 👇 UPDATED: Use dynamic department */}
  <span className="flex items-center gap-1.5">
    <Building2 className="h-4 w-4" />
    {member.department || 'No Department'}
  </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {member.years_of_experience} years experience
                </span>
              </div>
              {member.summary && (
                <p className="mt-4 text-muted-foreground">{member.summary}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills - Updated to use userSkills -> skill.skill_name */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {member.userSkills && member.userSkills.length > 0 ? (
                member.userSkills.map((us, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {us.skill.skill_name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certifications - Updated to use API field names */}
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
                    {/* Assuming StatusBadge can handle string inputs like 'active' */}
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

        {/* Training - Safely handled if API missing it */}
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Training ({member.trainings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.trainings && member.trainings.length > 0 ? (
              <div className="space-y-3">
                {member.trainings.map((training) => (
                  <div key={training.training_id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{training.training_name}</p>
                    <p className="text-xs text-muted-foreground">{training.provider}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(training.completion_date)} • {training.duration}
                    </p>
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

        {/* Projects - Safely handled if API missing it */}
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
    </div>
  );
};

export default MemberProfilePage;