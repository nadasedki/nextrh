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
  Pencil,
  Trash2,
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
interface Training {
  training_id: number;
  training_name: string;
  provider: string;
  description?: string;
  completion_date?: string;
  duration?: string;
}
const TrainingProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);

   const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
   const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
   const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);

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
const [trainingForm, setTrainingForm] = useState({
  training_name: '',
  provider: '',
  description: '',
  completion_date: '',
  duration: '',
});
 const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return 'N/A';

  return format(date, 'MMM yyyy');
};
const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};
// Track ID of the item being edited (null if adding new)
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingTrainingId, setEditingTrainingId] = useState<number | null>(null);
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

       const tRes = await fetch(`http://localhost:3000/trainings/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
       
        

       if (eRes.ok) {
         const expData = await eRes.json();
          setExperiences(
            (Array.isArray(expData) ? expData : []).map((e: any) => ({
              id: e.id,
              company: e.company,
              role: e.role,
              startDate: e.startDate, 
              endDate: e.endDate,    
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
if (tRes.ok) {
  const trainingsData = await tRes.json();

  setTrainings(
    (Array.isArray(trainingsData) ? trainingsData : []).map((t: any) => ({
      training_id: t.training_id,
      training_name: t.training_name,
      provider: t.provider,
      description: t.description,
      completion_date: t.completion_date,
      duration: t.duration,
    }))
  );
} else {
  console.error('Failed to fetch trainings');
}
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);
//edit and remove
// ===============================
  // DELETE HANDLERS
  // ===============================
  const handleDeleteExperience = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    try {
      await fetch(`http://localhost:3000/experiences/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setExperiences(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`http://localhost:3000/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };
const handleDeleteTraining = async (id: number) => {
  if (!confirm('Are you sure?')) return;

  try {
    await fetch(`http://localhost:3000/trainings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTrainings(prev =>
      prev.filter(t => t.training_id !== id)
    );
  } catch (err) {
    console.error(err);
  }
};
  // ===============================
  // EDIT (OPEN DIALOG) HANDLERS
  // ===============================
  const openEditExperience = (exp: Experience) => {
    setEditingExperienceId(exp.id);
    setExperienceForm({
      company: exp.company,
      role: exp.role,
      startDate: formatDateForInput(exp.startDate),
      endDate: formatDateForInput(exp.endDate),
      description: exp.description || '',
    });
    setIsExperienceDialogOpen(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setProjectForm({
      name: p.name,
      client: p.client,
      role: p.role,
      startDate: formatDateForInput(p.startDate),
      endDate: formatDateForInput(p.endDate),
      description: p.description,
      technologies: p.technologies.join(', '),
    });
    setIsProjectDialogOpen(true);
  };

  const openEditTraining = (training: Training) => {
  setEditingTrainingId(training.training_id);

  setTrainingForm({
    training_name: training.training_name,
    provider: training.provider,
    description: training.description || '',
    completion_date: formatDateForInput(
      training.completion_date
    ),
    duration: training.duration || '',
  });

  setIsTrainingDialogOpen(true);
};
 // ===============================
  // ADD EXPERIENCE
  // ===============================
  /*const handleAddExperience = async () => {
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
*/
const handleAddExperience = async () => {
    const method = editingExperienceId ? 'PATCH' : 'POST';
    const url = editingExperienceId 
      ? `http://localhost:3000/experiences/${editingExperienceId}` 
      : `http://localhost:3000/experiences`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(experienceForm),
      });
      const data = await res.json();
      
      if (editingExperienceId) {
        setExperiences(prev => prev.map(e => e.id === editingExperienceId ? data : e));
      } else {
        setExperiences(prev => [...prev, data]);
      }
      
      setIsExperienceDialogOpen(false);
      setEditingExperienceId(null);
      setExperienceForm({ company: '', role: '', startDate: '', endDate: '', description: '' });
    } catch (err) { console.error(err); }
  };
  // ===============================
  // ADD PROJECT
  // ===============================
  const handleAddProject = async () => {
  const method = editingProjectId ? 'PATCH' : 'POST';
  const url = editingProjectId 
    ? `http://localhost:3000/projects/${editingProjectId}` 
    : `http://localhost:3000/projects`;

  try {
    const techArray = projectForm.technologies
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...projectForm,
        technologies: techArray,
      }),
    });

    if (!res.ok) throw new Error('Failed to save project');
    const data = await res.json();

    if (editingProjectId) {
      setProjects(prev => prev.map(p => p.id === editingProjectId ? data : p));
    } else {
      setProjects(prev => [...prev, data]);
    }

    // Reset et Fermeture
    setProjectForm({ name: '', client: '', role: '', startDate: '', endDate: '', description: '', technologies: '' });
    setIsProjectDialogOpen(false);
    setEditingProjectId(null);
  } catch (err) {
    console.error('Error saving project:', err);
  }
};
  /*const handleAddProject = async () => {
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
  };*/
const handleAddTraining = async () => {
  const method = editingTrainingId ? 'PATCH' : 'POST';

  const url = editingTrainingId
    ? `http://localhost:3000/trainings/${editingTrainingId}`
    : `http://localhost:3000/trainings`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(trainingForm),
    });

    if (!res.ok) {
      throw new Error('Failed to save training');
    }

    const data = await res.json();

    if (editingTrainingId) {
      setTrainings(prev =>
        prev.map(t =>
          t.training_id === editingTrainingId ? data : t
        )
      );
    } else {
      setTrainings(prev => [...prev, data]);
    }

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
    console.error(err);
  }
};
  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Experience  & Projects</h1>

      <Tabs defaultValue="experiences">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="experiences">
            <GraduationCap className="h-4 w-4 mr-2" />
            experiences ({experiences.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-2" />
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="trainings">
  <GraduationCap className="h-4 w-4 mr-2" />
  Trainings ({trainings.length})
</TabsTrigger>
        </TabsList>
<TabsContent value="experiences" className="space-y-4">
 
<Button onClick={() => {
  setEditingExperienceId(null); // CRITIQUE : On remet à null pour l'ajout
  setExperienceForm({ company: '', role: '', startDate: '', endDate: '', description: '' }); // On vide le formulaire
  setIsExperienceDialogOpen(true);
}}>
  <Plus className="h-4 w-4 mr-2" /> Add Experience
</Button>

  {/* Dialog Experience */}
  <Dialog open={isExperienceDialogOpen} onOpenChange={setIsExperienceDialogOpen}>
    <DialogContent>
<DialogHeader>
  <DialogTitle>{editingExperienceId ? 'Edit Experience' : 'Add Professional Experience'}</DialogTitle>
</DialogHeader>
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
         <Button variant="outline" onClick={() => setIsExperienceDialogOpen(false)}>
                  Cancel
                </Button>
        <Button onClick={handleAddExperience}>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <div className="grid gap-4 md:grid-cols-2">
    {experiences.map((exp) => (
      <Card key={exp.id} className="relative group">
        <CardContent className="p-4">
          {/* Action Buttons */}
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditExperience(exp)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExperience(exp.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
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
             
<Button onClick={() => {
  setEditingProjectId(null); // On remet à null
  setProjectForm({ name: '', client: '', role: '', startDate: '', endDate: '', description: '', technologies: '' }); // On vide
  setIsProjectDialogOpen(true);
}}>
  <Plus className="h-4 w-4 mr-2" /> Add Project
</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
  <DialogTitle>{editingProjectId ? 'Edit Project' : 'Add New Project'}</DialogTitle>
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
                <Button onClick={handleAddProject}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="relative group">
                <CardContent className="p-4">
                   <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProject(p)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProject(p.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
                  <h3 className="font-semibold">{p.client}</h3>
                  
                  <p className="text-xs mt-2">
                    {p.startDate ? formatDate(p.startDate): 'N/A'} -{' '}
                    {p.endDate ? formatDate(p.endDate) : 'Present'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                     • {p.description}
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

        {/* ================= TRAININGS ================= */}
        <TabsContent value="trainings" className="space-y-4">

  <Button
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
    <Plus className="h-4 w-4 mr-2" />
    Add Training
  </Button>

  <Dialog
    open={isTrainingDialogOpen}
    onOpenChange={setIsTrainingDialogOpen}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {editingTrainingId
            ? 'Edit Training'
            : 'Add Training'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">

        <Input
          placeholder="Training Name"
          value={trainingForm.training_name}
          onChange={(e) =>
            setTrainingForm({
              ...trainingForm,
              training_name: e.target.value,
            })
          }
        />

        <Input
          placeholder="Provider"
          value={trainingForm.provider}
          onChange={(e) =>
            setTrainingForm({
              ...trainingForm,
              provider: e.target.value,
            })
          }
        />

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

        <Input
          placeholder="Duration"
          value={trainingForm.duration}
          onChange={(e) =>
            setTrainingForm({
              ...trainingForm,
              duration: e.target.value,
            })
          }
        />

        <Textarea
          placeholder="Description"
          value={trainingForm.description}
          onChange={(e) =>
            setTrainingForm({
              ...trainingForm,
              description: e.target.value,
            })
          }
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() =>
            setIsTrainingDialogOpen(false)
          }
        >
          Cancel
        </Button>

        <Button onClick={handleAddTraining}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <div className="grid gap-4 md:grid-cols-2">
    {trainings.map((training) => (
      <Card
        key={training.training_id}
        className="relative group"
      >
        <CardContent className="p-4">

          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                openEditTraining(training)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() =>
                handleDeleteTraining(
                  training.training_id
                )
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="font-semibold">
            {training.training_name}
          </h3>

          <p className="text-sm text-muted-foreground">
            {training.provider}
          </p>

          <p className="text-xs mt-2">
            {formatDate(training.completion_date)}
          </p>

          <p className="text-sm mt-2">
            {training.description}
          </p>

          {training.duration && (
            <Badge className="mt-2">
              {training.duration}
            </Badge>
          )}
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
