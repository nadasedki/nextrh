import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileOutput, 
  Download, 
  Loader2, 
  Check, 
  Upload, 
  FileText, 
  X, 
  Layers, 
  Eye, 
  Plus 
} from 'lucide-react';

interface SavedTemplate {
  id: string;
  name: string;
  created_at: string;
}

const CVGenerationPage: React.FC = () => {
  const { token, user } = useAuth();

  // State Management
  const [employees, setEmployees] = useState<{ id: string; name: string; title: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isIngesting, setIsIngesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Load active employees and saved templates on mount
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      setIsFetchLoading(true);
      try {
        // 1. Fetch Real Employees list from backend
        const empResponse = await fetch('http://localhost:3000/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (empResponse.ok) {
          const empData = await empResponse.json();
          setEmployees(empData.map((e: any) => ({
            id: String(e.user_id),
            name: e.cv_full_name || e.full_name,
            title: e.cv_profession || 'Collaborateur'
          })));
        }

        // 2. Fetch Saved Templates list from database [2]
        await fetchTemplatesList();

      } catch (error) {
        toast.error("Erreur lors de la récupération des données initiales.");
      } finally {
        setIsFetchLoading(false);
      }
    };

    fetchInitialData();
  }, [token]);

  const fetchTemplatesList = async () => {
    try {
      const tResponse = await fetch('http://localhost:3000/cv/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tResponse.ok) {
        const templatesData = await tResponse.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      toast.error("Impossible de charger la liste des modèles enregistrés.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!newTemplateName) {
        setNewTemplateName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // ===================================================
  // STAGE 1 (CALL 1): INGEST NEW PDF VISUAL BLUEPRINT
  // ===================================================
  const handleIngestTemplate = async () => {
    if (!selectedFile || !newTemplateName || !token) return;

    setIsIngesting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', newTemplateName);
    formData.append('userId', selectedEmployee || '1'); // Target user reference

    try {
      const response = await fetch('http://localhost:3000/cv/templates/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Échec de l'analyse du modèle.");

      const data = await response.json();
      toast.success("Modèle visuel analysé et squelette enregistré !");
      
      // Refresh templates and automatically select the newly generated template
      await fetchTemplatesList();
      setSelectedTemplateId(data.templateId);
      
      // Reset upload inputs
      setSelectedFile(null);
      setNewTemplateName('');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du traitement IA du modèle.");
    } finally {
      setIsIngesting(false);
    }
  };

  // ===================================================
  // STAGE 2 (CALL 2): SEMANTIC CV COMPILATION
  // ===================================================
  const handleGenerateCV = async () => {
    if (!selectedEmployee || !selectedTemplateId || !token) {
      toast.error("Veuillez sélectionner un collaborateur et un modèle.");
      return;
    }

    setIsGenerating(true);
    setDownloadUrl(null);

    try {
      const response = await fetch('http://localhost:3000/cv/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          userId: selectedEmployee
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la compilation du CV.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      toast.success("Le CV a été compilé avec succès !");

    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de la compilation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // LIVE HTML SKELETON PREVIEW MODAL [1.1.2]
  // ==========================================
  const handlePreviewTemplate = async (templateId: string) => {
    setIsPreviewLoading(true);
    setPreviewHtml(null);
    setIsPreviewOpen(true);

    try {
      // Pull all templates to find our target HTML code directly [1.1.2]
      const response = await fetch(`http://localhost:3000/cv/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const rows = await response.json();
        const targetTemplate = rows.find((t: any) => t.id === templateId);
        
        // Render raw stored HTML directly inside the iframe srcDoc [1.1.2]
        setPreviewHtml(targetTemplate?.template_html || storedTemplateFallbackHtml);
      }
    } catch (err) {
      toast.error("Impossible d'afficher l'aperçu.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const storedTemplateFallbackHtml = `
    <div style="font-family: Arial; padding: 40px; text-align: center; color: #475569;">
      <h3>Aperçu Indisponible</h3>
      <p style="font-size: 10pt;">La structure HTML de ce squelette n'a pas pu être chargée.</p>
    </div>
  `;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Générateur de CV Intelligent</h1>
        <p className="text-muted-foreground">Associez un profil de collaborateur avec n'importe quel modèle PDF à la volée</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Template selection / upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-muted">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle className="text-md flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                1. Sélectionner le modèle visuel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="saved">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="saved">Modèles enregistrés ({templates.length})</TabsTrigger>
                  <TabsTrigger value="upload">Nouveau modèle PDF</TabsTrigger>
                </TabsList>

                {/* Tab 1: Saved Templates List */}
                <TabsContent value="saved" className="space-y-4">
                  {isFetchLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Aucun modèle disponible. Veuillez téléverser un modèle PDF.</p>
                  ) : (
                    <div className="grid gap-3">
                      {templates.map((t) => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedTemplateId === t.id 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-muted hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${selectedTemplateId === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="text-left">
                              <p className="text-sm font-semibold">{t.name}</p>
                              <p className="text-xs text-muted-foreground">Importé le {new Date(t.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Render visual iframe modal trigger [1.1.2] */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(t.id);
                              }}
                              title="Aperçu visuel du squelette"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            {selectedTemplateId === t.id && (
                              <div className="bg-primary p-1 rounded-full">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Upload New Template */}
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="templateName">Nom du modèle</Label>
                    <Input 
                      id="templateName" 
                      placeholder="e.g., Annexe 9 - Modèle d'appel d'offres" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Fichier PDF d'origine</Label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                        selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
                      }`}
                    >
                      {!selectedFile ? (
                        <div className="space-y-3">
                          <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">Glissez-déposez ou parcourez votre fichier PDF (Max. 10MB)</p>
                          <Input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            id="pdf-upload" 
                            onChange={handleFileChange}
                          />
                          <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('pdf-upload')?.click()}>
                            Parcourir
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            <div className="text-left">
                              <p className="text-xs font-semibold truncate max-w-[150px]">{selectedFile.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleIngestTemplate} 
                    disabled={!selectedFile || !newTemplateName || isIngesting}
                    className="w-full h-11"
                  >
                    {isIngesting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyse visuelle IA en cours...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Ajouter et extraire le modèle</>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Candidate Selection and Compile trigger */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-muted">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle className="text-md flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                2. Lancer la compilation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Select Employee */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Choisir le candidat</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full py-5">
                    <SelectValue placeholder="Sélectionner un collaborateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} - {emp.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Trigger */}
              <Button 
                onClick={handleGenerateCV} 
                disabled={!selectedEmployee || !selectedTemplateId || isGenerating}
                className="w-full h-12 text-sm font-semibold shadow-md shadow-primary/10"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Compilation...</>
                ) : (
                  <><FileOutput className="h-4 w-4 mr-2" />Générer le CV PDF</>
                )}
              </Button>

              {/* Download link container */}
              {downloadUrl && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center space-y-3 animate-in zoom-in-95">
                  <div className="bg-green-500 p-1.5 rounded-full w-fit mx-auto">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-green-800">CV synthétisé avec succès !</p>
                  <a 
                    href={downloadUrl} 
                    download={`CV_Genere_${selectedEmployee}.pdf`}
                    className="flex items-center justify-center bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors w-full"
                  >
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Télécharger le PDF
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Skeleton Preview Modal [1.1.2] */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Aperçu du Modèle Squelette</DialogTitle>
            <DialogDescription>Rendu visuel du document HTML extrait par l'IA</DialogDescription>
          </DialogHeader>
          <div className="flex-1 border rounded-lg overflow-hidden bg-white">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement de la structure...</p>
              </div>
            ) : (
              <iframe
                title="Visual Skeleton Preview"
                srcDoc={previewHtml || ''}
                className="w-full h-full border-none"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Fermer l'aperçu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVGenerationPage;