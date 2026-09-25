import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Sparkles,
  Trash2,
  Search,      
  ChevronsUpDown,
  UserCheck,
  ArrowRight
} from 'lucide-react';

interface SavedTemplate {
  id: string;
  name: string;
  created_at: string;
  template_html?: string;
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
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Searchable Employee Dropdown States
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const query = employeeSearch.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = emp.name.toLowerCase().includes(query);
    const titleMatch = emp.title?.toLowerCase().includes(query);
    return nameMatch || titleMatch;
  });

  const currentEmployee = employees.find(e => e.id === selectedEmployee);
  const currentTemplate = templates.find(t => t.id === selectedTemplateId);

  // Load initial data
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      setIsFetchLoading(true);
      try {
        const empResponse = await fetch('http://localhost:3000/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (empResponse.ok) {
          const empData = await empResponse.json();
          //  FIXED: Prioritize real account full_name
          setEmployees(empData.map((e: any) => ({
            id: String(e.user_id),
            name: e.full_name || e.cv_full_name || 'Unnamed Employee',
            title: e.title || e.cv_profession || 'Employee'
          })));
        }

        await fetchTemplatesList();
      } catch (error) {
        toast.error("Failed to load initial data.");
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
      toast.error("Unable to load saved templates.");
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

  // =========================================================================
  // STAGE 1: INGEST TEMPLATE VIA BULLMQ ASYNC POLLING
  // =========================================================================
  const handleIngestTemplate = async () => {
    if (!selectedFile || !newTemplateName || !token) return;

    setIsIngesting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', newTemplateName);

    try {
      // 1. Submit template upload job to BullMQ queue
      const response = await fetch('http://localhost:3000/cv/templates/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to start template ingestion.");

      const jobId = data.jobId;
      toast.info("Analyzing template layout in the background...");

      // 2. Poll BullMQ job status every 1.5s
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:3000/cv/templates/status/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!statusRes.ok) return;
          const jobStatus = await statusRes.json();

          if (jobStatus.state === 'completed') {
            clearInterval(pollInterval);
            setIsIngesting(false);
            toast.success("Template blueprint extracted and saved!");
            
            // Refresh gallery and auto-select new template
            await fetchTemplatesList();
            if (jobStatus.result?.templateId) {
              setSelectedTemplateId(jobStatus.result.templateId);
            }
            setSelectedFile(null);
            setNewTemplateName('');
          } else if (jobStatus.state === 'failed') {
            clearInterval(pollInterval);
            setIsIngesting(false);
            toast.error(`Ingestion failed: ${jobStatus.failedReason || 'Unknown error'}`);
          }
        } catch (pollErr) {
          console.warn('Polling error:', pollErr);
        }
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "An error occurred while uploading template.");
      setIsIngesting(false);
    }
  };

  // =========================================================================
  // STAGE 2: GENERATE CV VIA BULLMQ ASYNC POLLING
  // =========================================================================
  const handleGenerateCV = async () => {
    if (!selectedEmployee || !selectedTemplateId || !token) {
      toast.error("Please select both a template and an employee.");
      return;
    }

    setIsGenerating(true);
    setDownloadUrl(null);

    try {
      // 1. Enqueue generation job in BullMQ
      const response = await fetch('http://localhost:3000/cv/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          userId: Number(selectedEmployee)
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to initiate CV generation.");

      const jobId = data.jobId;
      toast.info("Compiling tailored CV document...");

      // 2. Poll BullMQ generation status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:3000/cv/generate/status/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!statusRes.ok) return;
          const jobStatus = await statusRes.json();

          if (jobStatus.state === 'completed' && jobStatus.result) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setDownloadUrl(jobStatus.result.downloadUrl);
            toast.success("CV compiled successfully!");
          } else if (jobStatus.state === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            toast.error(`Generation failed: ${jobStatus.failedReason || 'Unknown error'}`);
          }
        } catch (pollErr) {
          console.warn('Polling error:', pollErr);
        }
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "An error occurred while generating the CV.");
      setIsGenerating(false);
    }
  };

  // DELETE TEMPLATE
  const handleDeleteTemplate = async (templateId: string, templateName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(`Are you sure you want to delete "${templateName}"?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:3000/cv/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete template.');
      }

      toast.success(`Template "${templateName}" deleted successfully!`);

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
      }

      await fetchTemplatesList();
    } catch (error: any) {
      toast.error(error.message || 'Error deleting template.');
    }
  };

  // PREVIEW MODAL
  const handlePreviewTemplate = async (templateId: string, templateName?: string) => {
    setIsPreviewLoading(true);
    setPreviewHtml(null);
    setPreviewTitle(templateName || 'Template Preview');
    setIsPreviewOpen(true);

    try {
      const response = await fetch(`http://localhost:3000/cv/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const rows = await response.json();
        const targetTemplate = rows.find((t: any) => t.id === templateId);
        setPreviewHtml(targetTemplate?.template_html || storedTemplateFallbackHtml);
        if (targetTemplate?.name) setPreviewTitle(targetTemplate.name);
      }
    } catch (err) {
      toast.error("Unable to load template preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const storedTemplateFallbackHtml = `
    <div style="font-family: Arial; padding: 40px; text-align: center; color: #475569;">
      <h3>Preview Unavailable</h3>
      <p style="font-size: 10pt;">The HTML layout structure could not be rendered.</p>
    </div>
  `;

  return (
    <div className="space-y-3 max-w-7xl mx-auto h-[calc(100vh-130px)] flex flex-col overflow-hidden animate-fade-in px-2 sm:px-4">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 pb-2 border-b border-border/70">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileOutput className="h-5 w-5 text-primary" />
            Dynamic CV Studio
          </h1>
          <p className="text-xs text-muted-foreground">
            Compile tailored proposal resumes using custom templates
          </p>
        </div>

        {/* Selected Summary Pill */}
        {(currentTemplate || currentEmployee) && (
          <div className="flex items-center gap-2 text-xs bg-muted/50 px-2.5 py-1 rounded-md border w-fit">
            <span className="text-muted-foreground font-medium text-[11px]">Ready:</span>
            {currentTemplate ? (
              <Badge variant="secondary" className="font-normal text-[10px] gap-1 max-w-[120px] truncate h-5">
                <Layers className="h-2.5 w-2.5 text-primary" /> {currentTemplate.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground italic text-[10px]">No template</span>
            )}
            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
            {currentEmployee ? (
              <Badge variant="secondary" className="font-normal text-[10px] gap-1 max-w-[120px] truncate h-5">
                <UserCheck className="h-2.5 w-2.5 text-primary" /> {currentEmployee.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground italic text-[10px]">No candidate</span>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Template Gallery */}
        <Card className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden shadow-sm border-border bg-card">
          <CardHeader className="bg-muted/20 border-b py-2.5 px-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] items-center justify-center font-bold">
                  1
                </span>
                Choose Template
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">
                {templates.length} templates
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs defaultValue="saved" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 mb-3 h-8.5 shrink-0">
                <TabsTrigger value="saved" className="text-xs">
                  Gallery ({templates.length})
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs">
                  Upload New Template
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Scrollable Visual Template Gallery */}
              <TabsContent value="saved" className="flex-1 min-h-0 overflow-y-auto pr-1 m-0 focus-visible:outline-none">
                {isFetchLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-12">
                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    <p className="text-xs">Loading templates gallery...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl p-6 bg-muted/10">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-semibold text-foreground">No saved templates yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                      Upload your first PDF blueprint in the "Upload New Template" tab.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((t) => {
                      const isSelected = selectedTemplateId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`group relative flex flex-col rounded-xl border-2 transition-all duration-150 cursor-pointer overflow-hidden bg-card hover:shadow-md ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/20 shadow-xs bg-primary/[0.02]'
                              : 'border-border/70 hover:border-primary/50'
                          }`}
                        >
                          {/* Selected Check Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground p-1 rounded-full shadow-md animate-in zoom-in-75">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}

                          {/* Miniature Live Scaled Iframe Preview */}
                          <div className="relative w-full aspect-[1/1.05] bg-white overflow-hidden border-b border-border/60">
                            <div className="absolute inset-0 overflow-hidden bg-white">
                              <iframe
                                title={t.name}
                                srcDoc={t.template_html}
                                tabIndex={-1}
                                className="w-[400%] h-[400%] origin-top-left transform scale-[0.25] pointer-events-none border-0 select-none bg-white"
                                sandbox="allow-same-origin"
                              />
                            </div>

                            {/* Hover Overlay with Quick Preview */}
                            <div className="absolute inset-0 z-10 bg-black/35 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="shadow-md h-7 text-xs font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTemplate(t.id, t.name);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1 text-primary" />
                                Full Preview
                              </Button>
                            </div>
                          </div>

                          {/* Card Footer Info */}
                          <div className="p-2.5 bg-card flex items-center justify-between gap-2 z-10">
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {t.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(t.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTemplate(t.id, t.name);
                                }}
                                title="Fullscreen Preview"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDeleteTemplate(t.id, t.name, e)}
                                title="Delete Template"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Upload New Template */}
              <TabsContent value="upload" className="flex-1 min-h-0 overflow-y-auto space-y-3 m-0 pr-1 focus-visible:outline-none">
                <div className="space-y-1">
                  <Label htmlFor="templateName" className="text-xs font-medium">
                    Template Name
                  </Label>
                  <Input 
                    id="templateName" 
                    placeholder="e.g., Standard RFP Format - Annex 9" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="h-8.5 text-xs"
                    disabled={isIngesting}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Source PDF Blueprint</Label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-150 ${
                      selectedFile ? 'border-primary bg-primary/5' : 'border-border/80 hover:border-primary/40 bg-muted/10'
                    }`}
                  >
                    {!selectedFile ? (
                      <div className="space-y-2">
                        <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Drag & drop your PDF template here, or browse
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Max 10MB PDF file
                          </p>
                        </div>
                        <Input 
                          type="file" 
                          accept=".pdf" 
                          className="hidden" 
                          id="pdf-upload" 
                          onChange={handleFileChange}
                          disabled={isIngesting}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button" 
                          onClick={() => document.getElementById('pdf-upload')?.click()}
                          className="text-xs h-7 mt-0.5"
                          disabled={isIngesting}
                        >
                          Browse File
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-xs font-semibold truncate max-w-[180px]">{selectedFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0" 
                          onClick={() => setSelectedFile(null)}
                          disabled={isIngesting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleIngestTemplate} 
                  disabled={!selectedFile || !newTemplateName || isIngesting}
                  className="w-full h-9 text-xs font-semibold"
                >
                  {isIngesting ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Analyzing & Saving Layout...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-2" />Extract & Save Template</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Candidate Selection & Generation */}
        <Card className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden shadow-sm border-border bg-card">
          <CardHeader className="bg-muted/20 border-b py-2.5 px-4 shrink-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] items-center justify-center font-bold">
                2
              </span>
              Generate Document
            </CardTitle>
            <CardDescription className="text-xs">
              Assign candidate and compile customized CV
            </CardDescription>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div className="space-y-4">
              {/* Searchable Candidate Selector */}
              <div className="space-y-1.5 relative" ref={employeeDropdownRef}>
                <Label className="text-xs font-semibold text-foreground">
                  Select Candidate
                </Label>

                <button
                  type="button"
                  onClick={() => setIsEmployeeDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-background transition-all text-left shadow-xs focus:ring-1 focus:ring-primary focus:outline-none ${
                    isEmployeeDropdownOpen ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  {currentEmployee ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                        {currentEmployee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{currentEmployee.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{currentEmployee.title}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Choose a team member...</span>
                  )}
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2 opacity-60" />
                </button>

                {/* Dropdown Popup */}
                {isEmployeeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b bg-muted/20 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or title..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="pl-8 h-7.5 text-xs bg-background"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
                      {filteredEmployees.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No candidate found matching "{employeeSearch}"
                        </p>
                      ) : (
                        filteredEmployees.map(emp => {
                          const isSelected = selectedEmployee === emp.id;
                          return (
                            <div
                              key={emp.id}
                              onClick={() => {
                                setSelectedEmployee(emp.id);
                                setIsEmployeeDropdownOpen(false);
                                setEmployeeSearch('');
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                isSelected 
                                  ? 'bg-primary/10 text-primary font-semibold' 
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center font-bold text-[8px] shrink-0 text-muted-foreground">
                                  {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{emp.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{emp.title}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Area */}
            <div className="space-y-2.5">
              <Button 
                onClick={handleGenerateCV} 
                disabled={!selectedEmployee || !selectedTemplateId || isGenerating}
                className="w-full h-10 text-xs sm:text-sm font-semibold shadow-sm"
              >
                {isGenerating ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Compiling Document...</>
                ) : (
                  <><FileOutput className="h-3.5 w-3.5 mr-2" />Generate CV</>
                )}
              </Button>

              {/* Download Success Card */}
              {downloadUrl && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                    <div className="bg-emerald-500 p-0.5 rounded-full text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    CV Successfully Compiled!
                  </div>
                  <a 
                    href={downloadUrl} 
                    download={`CV_${currentEmployee?.name?.replace(/\s+/g, '_') || 'Generated'}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center bg-emerald-600 text-white py-2 px-3 rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors w-full shadow-xs gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF Document
                  </a>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Fullscreen Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[88vh] w-[95vw] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {previewTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-white mt-2">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Rendering layout...</p>
              </div>
            ) : (
              <iframe
                title="Visual Skeleton Preview"
                srcDoc={previewHtml || ''}
                className="w-full h-full border-none bg-white"
              />
            )}
          </div>

          <DialogFooter className="pt-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVGenerationPage;