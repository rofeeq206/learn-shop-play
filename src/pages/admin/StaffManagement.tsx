import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRole, ROLE_LABELS, STAFF_ROLES } from '@/types/roles';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  email: string;
  full_name: string | null;
  created_at: string;
}

const StaffManagement = () => {
  const { user, userRole, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AppRole>('product_staff');

  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('manage_staff'))) {
      navigate('/admin');
    }
  }, [user, hasPermission, authLoading, navigate]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .in('role', STAFF_ROLES);

    if (roles) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const staffWithProfiles = roles.map(r => {
        const profile = profiles?.find(p => p.id === r.user_id);
        return {
          ...r,
          role: r.role as AppRole,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name,
        };
      });

      setStaff(staffWithProfiles);
    }
    setLoading(false);
  };

  const handleAddStaff = async () => {
    // First find or create user by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newStaffEmail)
      .maybeSingle();

    if (!existingProfile) {
      toast.error('User not found. They must sign up first.');
      return;
    }

    // Check if they already have a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', existingProfile.id)
      .maybeSingle();

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newStaffRole })
        .eq('user_id', existingProfile.id);

      if (error) {
        toast.error('Failed to update role');
        return;
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: existingProfile.id, role: newStaffRole });

      if (error) {
        toast.error('Failed to assign role');
        return;
      }
    }

    toast.success('Staff member added successfully');
    setDialogOpen(false);
    setNewStaffEmail('');
    fetchStaff();
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to update role');
      return;
    }

    toast.success('Role updated');
    fetchStaff();
  };

  const handleRemoveStaff = async (userId: string) => {
    // Downgrade to customer instead of deleting
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'customer' })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to remove staff member');
      return;
    }

    toast.success('Staff member removed');
    fetchStaff();
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Staff Management</h1>
            <p className="text-muted-foreground">Manage team members and their roles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">User must have an existing account</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newStaffRole} onValueChange={(v) => setNewStaffRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.filter(r => r !== 'super_admin').map(role => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddStaff} className="w-full">Add Staff Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name || 'N/A'}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleUpdateRole(member.user_id, v as AppRole)}
                      disabled={member.user_id === user?.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStaff(member.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default StaffManagement;
