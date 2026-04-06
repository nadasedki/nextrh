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
import { Award, Plus, Upload, Grid, List, Search, Calendar, Building2, Loader2, FileText } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          // Normalize status to lowercase to prevent StatusBadge crashes
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

  // Defensive filtering to prevent crashes if name/provider is missing
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

const handleUploadFile = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch(`http://localhost:3000/certifications/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`, // Ensure token is valid
      },
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || 'Failed to upload certificate');
    }

    // Based on your Postman output, the object is inside result.data
    const certData = result.data;

    const newCert: Certification = {
      id: certData.certId,
      userId: certData.userId,
      name: certData.certName,
      provider: certData.provider,
      issueDate: certData.issueDate,
      // If expiryDate is null (like in your Postman example), 
      // it will be handled by the formatDate function
      expiryDate: certData.expiryDate, 
      status: certData.status,
      credentialId: certData.credentialId,
      filePath: certData.filePath,
    };

    setCertifications((prev) => [newCert, ...prev]);
    setSelectedFile(null);
    setIsAddDialogOpen(false);
    
  } catch (err: any) {
    console.error('Error uploading file:', err);
    alert(`Upload Error: ${err.message}`);
  } finally {
    setIsUploading(false);
  }
};

  const CertificationCard: React.FC<{ cert: Certification }> = ({ cert }) => (
    <Card className="group hover:shadow-md transition-all duration-200 animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Certification</DialogTitle>
              <DialogDescription>
                Upload your certification document (PDF, PNG, or JPG). We will automatically detect the details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => document.getElementById('fileInput')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 mx-auto text-primary" />
                    <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}>
                      Change file
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG (max. 5MB)</p>
                  </>
                )}
                <input
                  type="file"
                  id="fileInput"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUploadFile} disabled={!selectedFile || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Certificate'
                )}
              </Button>
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
              <Button onClick={() => setIsAddDialogOpen(true)}>
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