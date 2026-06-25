import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Award, Plus, Upload, Grid, List, Search, Calendar, Building2, Loader2, FileText, Trash2, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Certification {
  id: number;
  userId: number;
  name: string;
  provider: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
  credentialId?: string;
  filePath?: string;
}

// Interface for previewing parsed data before saving
interface ParsedPreview {
  certName: string;
  provider: string;
  issueDate: string;
  expiryDate: string;
  holderName?: string; // The extracted name on the certificate
  filePath: string;
}

const CertificationsPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedPreview | null>(null);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    issueDate: '',
    expiryDate: '',
  });
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ issueDate?: string; expiryDate?: string }>({});

  // Fetch certifications from backend
  useEffect(() => {
    if (!token || !user) return;

    const fetchCertifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/certifications/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch certifications');

        const data = await res.json();
        const certs: Certification[] = (Array.isArray(data) ? data : data.certifications ?? []).map((cert: any) => ({
          id: cert.certId,
          userId: cert.user?.user_id,
          name: cert.certName || 'Untitled Certification',
          provider: cert.provider || 'Unknown provider',
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          status: (cert.status?.toLowerCase() || 'active') as any,
          credentialId: cert.credentialId,
          filePath: cert.filePath,
        }));
        setCertifications(certs);
      } catch (err) {
        console.error('Error fetching certifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [token, user]);

  const filteredCertifications = certifications.filter((cert) => {
    const name = cert.name?.toLowerCase() || "";
    const provider = cert.provider?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();

    const matchesSearch = name.includes(search) || provider.includes(search);
    const matchesFilter = filterStatus === 'all' || cert.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No Expiration (Lifetime)';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this certification?")) return;
    try {
      const res = await fetch(`http://localhost:3000/certifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCertifications((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openEditDialog = (cert: Certification) => {
    setEditingCertId(cert.id);
    setFormData({
      name: cert.name,
      provider: cert.provider,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
    });
    setParsedPreview(null); // Clear any previews during edit
    setIsAddDialogOpen(true);
  };

  // Step 1: Upload to Backend to GET parsed preview data
  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', selectedFile);

    try {
      // NOTE: Point this to your backend parser routing endpoint
      const res = await fetch(`http://localhost:3000/certifications/parse-preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to parse certificate');

      const certData = result.data;

      // Set preview state to reveal the data verification block
      setParsedPreview({
        certName: certData.certName || 'Unknown Title',
        provider: certData.provider || 'Unknown Provider',
        issueDate: certData.issueDate || '',
        expiryDate: certData.expiryDate || '',
        holderName: certData.holderName || '', // Extracted holder name from engine
        filePath: certData.filePath || '',
      });

    } catch (err: any) {
      console.error('Error parsing file:', err);
      alert(`Parsing Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Confirm workflow to save verified data to DB
  const handleConfirmSave = async () => {
    if (!parsedPreview) return;

    setIsConfirming(true);
    try {
      const res = await fetch(`http://localhost:3000/certifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: parsedPreview.certName,
          issuer: parsedPreview.provider,
          issueDate: parsedPreview.issueDate,
          expirationDate: parsedPreview.expiryDate,
          filePath: parsedPreview.filePath,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save certification');

      const certData = result.data || result;
      const newCert: Certification = {
        id: certData.certId || certData.id,
        userId: certData.userId,
        name: certData.name || certData.certName,
        provider: certData.issuer || certData.provider,
        issueDate: certData.issueDate,
        expiryDate: certData.expiryDate,
        status: certData.status || 'active',
      };

      setCertifications((prev) => [newCert, ...prev]);
      setIsAddDialogOpen(false);
      setParsedPreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Error saving certification: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleManualSubmit = async () => {
    if (!validateDates()) return;
    if (!formData.name || !formData.provider) {
      alert("Please fill in at least the name and provider.");
      return;
    }

    setIsManualSubmitting(true);
    const method = editingCertId ? 'PATCH' : 'POST';
    const url = editingCertId 
      ? `http://localhost:3000/certifications/${editingCertId}` 
      : `http://localhost:3000/certifications`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          issuer: formData.provider,
          issueDate: formData.issueDate,
          expirationDate: formData.expiryDate,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save certification');

      const certData = result.data || result;
      const updatedCert: Certification = {
        id: certData.certId || certData.id,
        userId: certData.userId,
        name: certData.name || certData.certName,
        provider: certData.issuer || certData.provider,
        issueDate: certData.issueDate,
        expiryDate: certData.expiryDate,
        status: certData.status || 'active',
      };

      if (editingCertId) {
        setCertifications((prev) => prev.map(c => c.id === editingCertId ? updatedCert : c));
      } else {
        setCertifications((prev) => [updatedCert, ...prev]);
      }

      setIsAddDialogOpen(false);
      setEditingCertId(null);
      setFormData({ name: '', provider: '', issueDate: '', expiryDate: '' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const validateDates = (): boolean => {
    const newErrors: { issueDate?: string; expiryDate?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const issue = formData.issueDate ? new Date(formData.issueDate) : null;
    const expiry = formData.expiryDate ? new Date(formData.expiryDate) : null;

    if (issue && issue > today) {
      newErrors.issueDate = "Issue date cannot be in the future.";
    }
    if (issue && expiry && expiry <= issue) {
      newErrors.expiryDate = "Expiry date must be after the issue date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if extracted certificate name matches current user's profile name
  const isHolderValid = () => {
    if (!parsedPreview?.holderName || !user?.full_name) return true;
    return parsedPreview.holderName.trim().toLowerCase() === user.full_name.trim().toLowerCase();
  };

  const CertificationCard: React.FC<{ cert: Certification }> = ({ cert }) => (
    <Card className="group hover:shadow-md transition-all duration-200 animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(cert)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cert.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <StatusBadge status={cert.status} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground leading-tight">{cert.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {cert.provider}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Expires: {formatDate(cert.expiryDate)}</span>
          </div>
          {cert.credentialId && <p className="text-xs text-muted-foreground mt-2">ID: {cert.credentialId}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const CertificationRow: React.FC<{ cert: Certification }> = ({ cert }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors animate-fade-in">
      <div className="p-2 rounded-lg bg-primary/10">
        <Award className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{cert.name}</h3>
        <p className="text-sm text-muted-foreground">{cert.provider}</p>
      </div>
      <div className="hidden md:block text-sm text-muted-foreground">
        Issued: {formatDate(cert.issueDate)}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground">
        Expires: {formatDate(cert.expiryDate)}
      </div>
      <StatusBadge status={cert.status} />
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading certifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certifications</h1>
          <p className="text-muted-foreground">Manage your professional certifications</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setParsedPreview(null);
            setSelectedFile(null);
            setEditingCertId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCertId(null); setParsedPreview(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
         <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>{editingCertId ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
    <DialogDescription>
      {editingCertId 
        ? "Modify the details of your certification below."
        : "Upload your certification document. We will automatically extract identity metrics and contents."
      }
    </DialogDescription>
  </DialogHeader>

  {/* --- 1. UPLOAD ZONE (Only visible when NOT editing) --- */}
  {!editingCertId && (
    <div className="space-y-4 py-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={() => document.getElementById('fileInput')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
            setParsedPreview(null);
          }
        }}
      >
        {selectedFile ? (
          /* CLEANED UP: No extra button inside here anymore */
          <div className="space-y-2 py-2">
            <FileText className="h-8 w-8 mx-auto text-primary" />
            <p className="text-sm font-medium text-primary truncate max-w-xs mx-auto">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">Ready to process. Click the button below.</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG (max. 5MB)</p>
          </>
        )}
        <input
          type="file"
          id="fileInput"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setParsedPreview(null); }}
        />
      </div>

      {/* Dynamic Parser Card Preview Block */}
      {parsedPreview && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Metadata Card</h4>
            {isHolderValid() ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Identity Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" /> Name Mismatch
              </span>
            )}
          </div>

          {!isHolderValid() && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-md space-y-1">
              <p className="font-semibold">Verification Alert:</p>
              <p>This certificate belongs to <b>"{parsedPreview.holderName}"</b>, but your profile name is <b>"{user?.full_name}"</b>.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="block text-xs text-muted-foreground">Title</span>
              <span className="font-medium text-foreground">{parsedPreview.certName}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Issuer</span>
              <span className="font-medium text-foreground">{parsedPreview.provider}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Issue Date</span>
              <span className="font-medium text-foreground">{formatDate(parsedPreview.issueDate)}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Expiry Date</span>
              <span className="font-medium text-foreground">{formatDate(parsedPreview.expiryDate)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {/* --- 2. SEPARATOR --- */}
  {!editingCertId && !parsedPreview && (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or manual entry</span>
      </div>
    </div>
  )}

  {/* --- 3. THE FORM BLOCK --- */}
  <div className="grid gap-3 py-1">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Certification Name</label>
        <Input 
          name="name" 
          placeholder="e.g. AWS Solutions Architect" 
          value={formData.name} 
          onChange={handleManualChange} 
          disabled={!!parsedPreview} 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Provider</label>
        <Input 
          name="provider" 
          placeholder="e.g. Amazon" 
          value={formData.provider} 
          onChange={handleManualChange} 
          disabled={!!parsedPreview} 
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Issue Date</label>
        <Input 
          name="issueDate" 
          type="date" 
          className={errors.issueDate ? "border-destructive focus-visible:ring-destructive" : ""}
          value={formData.issueDate} 
          onChange={handleManualChange}
          disabled={!!parsedPreview}
        />
        {errors.issueDate && <p className="text-xs text-destructive font-medium">{errors.issueDate}</p>}
      </div>
      
      <div className="space-y-1">
        <label className="text-xs font-medium">Expiry Date</label>
        <Input 
          name="expiryDate" 
          type="date" 
          className={errors.expiryDate ? "border-destructive focus-visible:ring-destructive" : ""}
          value={formData.expiryDate} 
          onChange={handleManualChange}
          disabled={!!parsedPreview}
        />
        {errors.expiryDate && <p className="text-xs text-destructive font-medium">{errors.expiryDate}</p>}
      </div>
    </div>

    {!parsedPreview && !editingCertId && (
      <Button variant="secondary" className="w-full mt-1" onClick={handleManualSubmit} disabled={isManualSubmitting || isUploading}>
        {isManualSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Add Manually
      </Button>
    )}
  </div>

  {/* --- 4. FOOTER --- */}
  <DialogFooter className="pt-2 border-t mt-2">
    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading || isConfirming || isManualSubmitting}>
      Cancel
    </Button>
    
    {editingCertId ? (
      <Button onClick={handleManualSubmit} disabled={isManualSubmitting}>
        {isManualSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
      </Button>
    ) : parsedPreview ? (
      <Button onClick={handleConfirmSave} disabled={isConfirming || !isHolderValid()} className={!isHolderValid() ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}>
        {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : !isHolderValid() ? 'Save Anyway' : 'Confirm & Save'}
      </Button>
    ) : (
      /* The ONE unified button to kick off parsing */
      <Button onClick={handleUploadFile} disabled={!selectedFile || isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...
          </>
        ) : (
          'Process Document'
        )}
      </Button>
    )}
  </DialogFooter>
</DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Display */}
      {filteredCertifications.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCertifications.map((cert) => (
              <CertificationCard key={cert.id} cert={cert} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCertifications.map((cert) => (
              <CertificationRow key={cert.id} cert={cert} />
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No certifications found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first certification to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => {
                setEditingCertId(null); 
                setFormData({ name: '', provider: '', issueDate: '', expiryDate: '' });
                setParsedPreview(null);
                setIsAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificationsPage;