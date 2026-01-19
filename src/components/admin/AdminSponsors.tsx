import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Plus, Pencil, Trash2, Upload, ExternalLink, Building2, Loader2 } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminSponsors() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    is_active: true,
  });

  // Fetch all sponsors (including inactive for admin)
  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Sponsor[];
    },
  });

  // Create sponsor mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('sponsors').insert({
        name: data.name,
        logo_url: data.logo_url || null,
        website_url: data.website_url || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast({ title: 'Sponsor created', description: 'The sponsor has been added successfully.' });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update sponsor mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('sponsors')
        .update({
          name: data.name,
          logo_url: data.logo_url || null,
          website_url: data.website_url || null,
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast({ title: 'Sponsor updated', description: 'Changes saved successfully.' });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete sponsor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast({ title: 'Sponsor deleted', description: 'The sponsor has been removed.' });
      setShowDeleteDialog(false);
      setSelectedSponsor(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('sponsors')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', logo_url: '', website_url: '', is_active: true });
    setSelectedSponsor(null);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo_url: sponsor.logo_url || '',
      website_url: sponsor.website_url || '',
      is_active: sponsor.is_active,
    });
    setShowEditModal(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setShowDeleteDialog(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: 'Logo uploaded', description: 'The logo has been uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a sponsor name.', variant: 'destructive' });
      return;
    }

    if (selectedSponsor) {
      updateMutation.mutate({ id: selectedSponsor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const SponsorForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Sponsor Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Nike, Burton, NCTR Alliance"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          {formData.logo_url && (
            <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted/50 p-2">
              <img
                src={formData.logo_url}
                alt="Logo preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Logo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="Or paste logo URL..."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          )}
          {selectedSponsor ? 'Update Sponsor' : 'Add Sponsor'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sponsors</h1>
          <p className="text-muted-foreground">
            Manage sponsor profiles and logos for reward sponsorships
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Sponsor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Sponsors
          </CardTitle>
          <CardDescription>
            {sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sponsors yet. Add your first sponsor to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      {sponsor.logo_url ? (
                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-muted/50 p-1">
                          <img
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-muted/50">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sponsor.name}</TableCell>
                    <TableCell>
                      {sponsor.website_url ? (
                        <a
                          href={sponsor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Visit
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={sponsor.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: sponsor.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(sponsor)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sponsor)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sponsor</DialogTitle>
            <DialogDescription>
              Create a new sponsor profile with logo and website.
            </DialogDescription>
          </DialogHeader>
          <SponsorForm />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
            <DialogDescription>
              Update sponsor details and logo.
            </DialogDescription>
          </DialogHeader>
          <SponsorForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Sponsor"
        description={`Are you sure you want to delete "${selectedSponsor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => selectedSponsor && deleteMutation.mutate(selectedSponsor.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
