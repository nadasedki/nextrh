import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common';
import {Phone, MapPin, Hash, } from 'lucide-react';
import {
  FileText,
  Download,
  Printer,
  Mail,
  Award,
  Briefcase,
  GraduationCap,
  Code,
  Building2,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

// --- INTERFACES MATCHING BACKEND RESPONSE ---
interface Project {
  id: number;
  name: string;
  role: string;
  client: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies: string[];
}

interface Certification {
  id: number;
  name: string;
  issuer: string;
  expirationDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface Training {
  id: number;
  name: string;
  provider: string;
  completionDate: string;
  duration: string;
}

interface Education {
  id: number;
  degree: string;
  field: string;      
  institution: string;
  startYear: number;  
  graduationYear: number;
}

interface CvData {
 name: string;
  profession: string; 
  email: string;
  phone: string;       
  fax: string;         
  address: string;    
  department: string;
  summary: string;
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  trainings: Training[];
  education: Education[];
}
// ---------------------------------------------

const CVPreviewPage: React.FC = () => {
  const { user } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  // ------------------------

  // --- FETCH DATA FROM BACKEND ---
  useEffect(() => {
    if (!token || !user) return;

    const fetchCvData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/employees/me/cv`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch CV data');
        }

        const data = await res.json();
        setCvData(data);
      } catch (err) {
        console.error(err);
        setError('Could not load CV data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCvData();
  }, [token, user]);
  // -------------------------------
const formatStartDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A'; // ou 'Unknown'
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM yyyy');
};

const formatEndDate = (dateString?: string | null) => {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM yyyy');
};

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error or No Data state
  if (error || !cvData) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {error ? 'Error loading CV' : 'No CV data available'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {error || 'Please upload your CV to view it here.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CV Preview</h1>
          <p className="text-muted-foreground">Your professional CV</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* CV Document */}
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardContent className="p-8 space-y-8">
          {/* Header Section */}
          <div className="text-center pb-6 border-b">
            <h1 className="text-3xl font-bold text-foreground mb-2">{cvData.name}</h1>
            <p className="text-xl text-primary font-medium mb-4">{cvData.profession}</p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {cvData.email}
              </span>
              {cvData.phone && cvData.phone !== 'N/A' && (
      <span className="flex items-center gap-1.5">
        <Phone className="h-4 w-4 text-primary" />
        {cvData.phone}
      </span>
    )}

    {cvData.fax && cvData.fax !== 'N/A' && (
      <span className="flex items-center gap-1.5">
        <Hash className="h-4 w-4 text-primary" />
        Fax: {cvData.fax}
      </span>
    )}
  </div>

  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
    <span className="flex items-center gap-1.5">
      <MapPin className="h-4 w-4 text-primary" />
      {cvData.address}
    </span>
            </div>
          </div>

          {/* Summary Section */}
          {cvData.summary && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                Professional Summary
              </h2>
              <p className="text-muted-foreground leading-relaxed">{cvData.summary}</p>
            </section>
          )}

          {/* Skills Section */}
          {cvData.skills && cvData.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <Code className="h-5 w-5 text-primary" />
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section */}
          {cvData.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                Project Experience
              </h2>
              <div className="space-y-6">
                {cvData.projects.map((project) => (
                  <div key={project.id} className="border-l-2 border-primary/30 pl-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-primary">{project.role}</p>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatStartDate(project.startDate)} - {formatEndDate(project.endDate || '')}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(project.technologies || []).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications Section */}
          {cvData.certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                Certifications
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {cvData.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Expires: {formatDate(cert.expirationDate)}
                        </span>
                        <StatusBadge status={cert.status} className="text-xs py-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

         {/* Education Section */}
{cvData.education && cvData.education.length > 0 && (
  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
      <GraduationCap className="h-5 w-5 text-primary" />
      Education & Academic Background
    </h2>
    <div className="space-y-6">
      {cvData.education.map((edu) => (
        <div key={edu.id} className="relative pl-6 border-l-2 border-muted hover:border-primary/50 transition-colors">
          {/* Petit point décoratif sur la ligne temporelle */}
          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-muted" />
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div>
              <h3 className="font-bold text-foreground text-base">{edu.degree}</h3>
              <p className="text-sm text-primary font-medium">{edu.field}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {edu.institution}
              </p>
            </div>
            <div className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full h-fit flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {edu.startYear} — {edu.graduationYear}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}

          {/* Training Section */}
          {cvData.trainings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-primary" />
                Professional Development
              </h2>
              <div className="space-y-2">
                {cvData.trainings.map((training) => (
                  <div key={training.id} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                    <div>
                      <p className="font-medium text-sm">{training.name}</p>
                      <p className="text-xs text-muted-foreground">{training.provider}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <p>{formatDate(training.completionDate)}</p>
                      <p>{training.duration}</p>
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

export default CVPreviewPage;