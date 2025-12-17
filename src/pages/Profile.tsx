import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ProfileType } from '@/types/database';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // VULNERABILITY: IDOR - can view/edit any user's profile via URL parameter
  const targetUserId = searchParams.get('id') || user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        navigate('/auth');
        return;
      }

      // VULNERABILITY: No authorization check - fetches any user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) {
        // VULNERABILITY: Exposes database error
        console.error('Profile fetch error:', error);
        toast({
          title: "Error",
          description: `Database error: ${error.message}`,
          variant: "destructive",
        });
      }

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [targetUserId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);

    // VULNERABILITY: No input sanitization - XSS possible
    // VULNERABILITY: Can update any user's profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        country: profile.country,
      })
      .eq('id', targetUserId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    }

    setSaving(false);
  };

  if (!user && !searchParams.get('id')) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse max-w-2xl mx-auto space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-64 bg-secondary rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="section-title mb-8">My Profile</h1>

          {/* VULNERABILITY: Shows whose profile is being viewed/edited */}
          <div className="bg-muted p-4 rounded-lg mb-6 text-sm">
            <p>Viewing Profile ID: {targetUserId}</p>
            <p>Email: {profile?.email}</p>
            {targetUserId !== user?.id && (
              <p className="text-destructive font-bold">
                WARNING: You are viewing/editing another user's profile!
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              IDOR Vulnerability: Change ?id= parameter to view other profiles
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  {/* VULNERABILITY: No input sanitization */}
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(p => p ? {...p, full_name: e.target.value} : null)}
                    className="pl-10"
                    placeholder="<script>alert('XSS')</script>"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="pl-10 bg-secondary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile(p => p ? {...p, phone: e.target.value} : null)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile?.country || ''}
                  onChange={(e) => setProfile(p => p ? {...p, country: e.target.value} : null)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="address"
                    value={profile?.address || ''}
                    onChange={(e) => setProfile(p => p ? {...p, address: e.target.value} : null)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile?.city || ''}
                  onChange={(e) => setProfile(p => p ? {...p, city: e.target.value} : null)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={profile?.postal_code || ''}
                  onChange={(e) => setProfile(p => p ? {...p, postal_code: e.target.value} : null)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="btn-primary" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link to="/password-change">
                <Button variant="outline">Change Password</Button>
              </Link>
            </div>
          </form>

          {/* VULNERABILITY: Debug info with sensitive data */}
          <div className="mt-6 p-4 bg-muted rounded-lg text-xs">
            <p className="font-bold mb-2">Debug Info (remove in production)</p>
            <pre className="overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
