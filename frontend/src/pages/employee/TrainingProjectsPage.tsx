import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  Briefcase,
  Plus,
  Calendar,
  Clock,
  Building2,
  Code,
} from 'lucide-react';
import { format } from 'date-fns';

interface Experience {
  id: number;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface Project {
  id: number;
  name: string;
  client: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies: string[];
}

const TrainingProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

   const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

   const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
   const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
 const [experienceForm, setExperienceForm] = useState({
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    client: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    technologies: '',
  });

 const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return 'N/A';

  return format(date, 'MMM yyyy');
};

  // ===============================
  // FETCH experiences & PROJECTS
  // ===============================
  useEffect(() => {
    if (!token || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Sending Token:', token);
        const eRes = await fetch(`http://localhost:3000/experiences/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const pRes = await fetch(`http://localhost:3000/projects/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

       
       
        

       if (eRes.ok) {
         const expData = await eRes.json();
          setExperiences(
            (Array.isArray(expData) ? expData : []).map((e: any) => ({
              id: e.id,
              company: e.company,
              role: e.role,
              startDate: e.startDate, // Le backend doit envoyer startDate
              endDate: e.endDate,     // Le backend doit envoyer endDate
              description: e.description,
            }))
);} else {
        console.error('Failed to fetch experiences');
      }
if (pRes.ok) {
  const projectsData = await pRes.json();
        setProjects(
          (Array.isArray(projectsData) ? projectsData : []).map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.client,
            role: p.role,
            startDate: p.startDate,
            endDate: p.endDate,
            description: p.description,
            technologies: p.technologies || [],
          }))
        );
        console.log(projectsData);
      } else {
        console.error('Failed to fetch projects');
      }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

 // ===============================
  // ADD EXPERIENCE
  // ===============================
  const handleAddExperience = async () => {
    try {
      const res = await fetch(`http://localhost:3000/experiences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(experienceForm),
      });

      if (!res.ok) throw new Error('Failed to add experience');
      const data = await res.json();

      setExperiences((prev) => [...prev, data]); // 'data' contient déjà le mapping
      setExperienceForm({ company: '', role: '', startDate: '', endDate: '', description: '' });
      setIsExperienceDialogOpen(false);
    } catch (err) { console.error(err); }
  };

  // ===============================
  // ADD PROJECT
  // ===============================
  const handleAddProject = async () => {
    try {
      const techArray = projectForm.technologies
      .split(/[,\s]+/) // Découpe sur virgule ou un ou plusieurs espaces
      .map((t) => t.trim())
      .filter((t) => t !== "");

      const res = await fetch(`http://localhost:3000/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...projectForm,
           technologies: techArray,
        }),
      });

      if (!res.ok) throw new Error('Failed to add project');

      const data = await res.json();

      setProjects((prev) => [
        ...prev,
        {
        id: data.id,
        name: data.name,
        client: data.client,
        role: data.role,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        technologies: data.technologies || [], // Ce sera maintenant ["react", "aws"]
      },
    ]);

      setProjectForm({
        name: '',
        client: '',
        role: '',
        startDate: '',
        endDate: '',
        description: '',
        technologies: '',
      });

      setIsProjectDialogOpen(false);
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Experience  & Projects</h1>

      <Tabs defaultValue="experiences">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="experiences">
            <GraduationCap className="h-4 w-4 mr-2" />
            experiences ({experiences.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-2" />
            Projects ({projects.length})
          </TabsTrigger>
        </TabsList>
<TabsContent value="experiences" className="space-y-4">
  <Button onClick={() => setIsExperienceDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-2" /> Add Experience
  </Button>

  {/* Dialog Experience */}
  <Dialog open={isExperienceDialogOpen} onOpenChange={setIsExperienceDialogOpen}>
    <DialogContent>
      <DialogHeader><DialogTitle>Add Professional Experience</DialogTitle></DialogHeader>
      <div className="space-y-4 py-4">
        <Input placeholder="Company" value={experienceForm.company} onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })} />
        <Input placeholder="Role" value={experienceForm.role} onChange={(e) => setExperienceForm({ ...experienceForm, role: e.target.value })} />
        <Label>Start Date</Label>
        <Input type="date" value={experienceForm.startDate} onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })} />
        <Label>End Date (Leave empty if current)</Label>
        <Input type="date" value={experienceForm.endDate} onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })} />
        <Textarea placeholder="Description" value={experienceForm.description} onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })} />
      </div>
      <DialogFooter>
        <Button onClick={handleAddExperience}>Add Experience</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <div className="grid gap-4 md:grid-cols-2">
    {experiences.map((exp) => (
      <Card key={exp.id}>
        <CardContent className="p-4">
          <h3 className="font-semibold">{exp.role}</h3>
          <p className="text-sm text-muted-foreground">{exp.company}</p>
          <p className="text-xs mt-2">
            {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
          </p>
        </CardContent>
      </Card>
    ))}
  </div>
</TabsContent>

        {/* ================= PROJECTS ================= */}
        <TabsContent value="projects" className="space-y-4">
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Input
                  placeholder="Project Name"
                  value={projectForm.name}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Client"
                  value={projectForm.client}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, client: e.target.value })
                  }
                />
                <Input
                  placeholder="Role"
                  value={projectForm.role}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, role: e.target.value })
                  }
                />
                <Input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, startDate: e.target.value })
                  }
                />
                <Input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, endDate: e.target.value })
                  }
                />
                <Input
                  placeholder="React, Node, AWS"
                  value={projectForm.technologies}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      technologies: e.target.value,
                    })
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProject}>Add Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.client} • {p.role}
                  </p>
                  <p className="text-xs mt-2">
                    {p.startDate ? formatDate(p.startDate): 'N/A'} -{' '}
                    {p.endDate ? formatDate(p.endDate) : 'Present'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.technologies.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingProjectsPage;
