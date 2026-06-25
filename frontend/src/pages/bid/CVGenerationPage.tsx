import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileOutput, Download, Loader2, Check, Upload, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
const CVGenerationPage: React.FC = () => {
  const [employees, setEmployees] = useState<{ id: string; name: string; title: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // 1. Récupérer la liste réelle des employés au chargement
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('http://localhost:3000/cvs/names'); // Ajustez selon votre route réelle
        const names = await res.json();
        // Transformation des noms en format utilisable pour le Select
        // Note: Assurez-vous que votre backend renvoie aussi les IDs si possible
        const formatted = names.map((name: string, index: number) => ({
          id: "42", // Pour votre test, l'ID est 42. Dans le futur utilisez l'ID réel
          name: name,
          title: "Collaborateur"
        }));
        setEmployees(formatted);
      } catch (error) {
        console.error("Erreur chargement employés", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDownloadUrl(null); // Reset le lien si on change de fichier
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee || !selectedFile) return;

    setIsGenerating(true);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('file', selectedFile); // 'file' doit correspondre à FileInterceptor('file')

    try {
      const response = await fetch(`http://localhost:3000/cv/smart-pdf/${selectedEmployee}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur lors de la génération');

      // 2. Récupérer le PDF en tant que BLOB
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Générateur de CV Intelligent</h1>
        <p className="text-muted-foreground">Utilisez l'IA pour fusionner un profil avec votre propre template</p>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Sélectionnez le candidat et déposez votre modèle (DOCX ou PDF)</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-6">
          {/* Sélection de l'employé */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Choisir le candidat</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full py-6">
                <SelectValue placeholder="Sélectionner un collaborateur..." />
              </SelectTrigger>
              <SelectContent>
                {/* Remplacez par vos vraies données d'API */}
                <SelectItem value="42">Anouar ABDALLAH - Ingénieur</SelectItem>
                <SelectItem value="43">Amal KHALFAOUI - Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone d'Upload du Template */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">2. Téléverser le modèle (Template)</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
                selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
              }`}
            >
              {!selectedFile ? (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cliquez pour choisir un fichier ou glissez-déposez</p>
                    <p className="text-xs text-muted-foreground mt-1">DOCX ou PDF (Max. 10MB)</p>
                  </div>
                  <Input 
                    type="file" 
                    accept=".docx,.pdf" 
                    className="hidden" 
                    id="template-upload" 
                    onChange={handleFileChange}
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('template-upload')?.click()}>
                    Parcourir les fichiers
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-background p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bouton de Génération */}
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedEmployee || !selectedFile || isGenerating} 
            className="w-full py-6 text-md font-bold shadow-lg shadow-primary/20"
          >
            {isGenerating ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Inférence IA en cours...</>
            ) : (
              <><FileOutput className="h-5 w-5 mr-2" />Générer le CV final</>
            )}
          </Button>

          {/* Résultat du téléchargement */}
          {downloadUrl && (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-semibold text-green-700">Votre CV a été synthétisé avec succès !</p>
                </div>
                <a 
                  href={downloadUrl} 
                  download={`CV_Genere_${selectedEmployee}.docx`}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le PDF
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CVGenerationPage;