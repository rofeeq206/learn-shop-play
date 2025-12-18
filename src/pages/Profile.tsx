import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, Camera, Package, Heart, Settings, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/roles';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, isStaff } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
      } else if (profileData) {
        setProfile(profileData as ProfileData);
      }

      // Fetch order count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setOrderCount(count || 0);
      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(p => p ? { ...p, avatar_url: `${publicUrl}?t=${Date.now()}` } : null);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);

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
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
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

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMemberSince = () => {
    if (!profile?.created_at) return '';
    return new Date(profile.created_at).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-secondary" />
                <div className="space-y-3">
                  <div className="h-8 w-48 bg-secondary rounded" />
                  <div className="h-4 w-32 bg-secondary rounded" />
                </div>
              </div>
              <div className="h-96 bg-secondary rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Section */}
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  {profile?.full_name || 'Welcome!'}
                </h1>
                <p className="text-muted-foreground mb-4">{profile?.email}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>{userRole ? ROLE_LABELS[userRole] : 'Customer'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{orderCount} Orders</span>
                  </div>
                  {profile?.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      <span>Member since {getMemberSince()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {isStaff && (
                  <Link to="/admin">
                    <Button variant="default" size="sm" className="bg-primary">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Staff Dashboard
                    </Button>
                  </Link>
                )}
                <Link to="/orders">
                  <Button variant="outline" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Orders
                  </Button>
                </Link>
                <Link to="/password-change">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Security
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your personal details and shipping address
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile(p => p ? {...p, full_name: e.target.value} : null)}
                      className="pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile(p => p ? {...p, phone: e.target.value} : null)}
                      className="pl-10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Shipping Address
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
                    <Input
                      id="address"
                      value={profile?.address || ''}
                      onChange={(e) => setProfile(p => p ? {...p, address: e.target.value} : null)}
                      className="mt-2"
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input
                      id="city"
                      value={profile?.city || ''}
                      onChange={(e) => setProfile(p => p ? {...p, city: e.target.value} : null)}
                      className="mt-2"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={profile?.postal_code || ''}
                      onChange={(e) => setProfile(p => p ? {...p, postal_code: e.target.value} : null)}
                      className="mt-2"
                      placeholder="Enter postal code"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Input
                      id="country"
                      value={profile?.country || ''}
                      onChange={(e) => setProfile(p => p ? {...p, country: e.target.value} : null)}
                      className="mt-2"
                      placeholder="Enter your country"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" className="btn-primary min-w-[160px]" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;