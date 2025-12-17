import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PasswordChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // VULNERABILITY: User ID from URL parameter - allows changing other users' passwords
  const targetUserId = searchParams.get('user') || user?.id;
  // VULNERABILITY: Token from URL - can be manipulated
  const resetToken = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // VULNERABILITY: Weak password change - no current password verification if token present
    if (resetToken === 'bypass' || resetToken === 'admin') {
      // VULNERABILITY: Hardcoded bypass tokens
      console.log('Password reset bypassed with token');
    }

    // VULNERABILITY: No password complexity validation
    // VULNERABILITY: No check if new password matches current
    // VULNERABILITY: Passwords logged to console
    console.log('Password change attempt:', {
      targetUserId,
      currentPassword,
      newPassword,
      resetToken
    });

    // VULNERABILITY: Password confirmation can be bypassed
    if (searchParams.get('skipConfirm') !== 'true' && newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // VULNERABILITY: No current password verification
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      // VULNERABILITY: Exposes error details
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-md mx-auto">
          <h1 className="section-title mb-8">Change Password</h1>

          {/* VULNERABILITY: Shows target user info */}
          <div className="bg-muted p-4 rounded-lg mb-6 text-sm">
            <p>Target User: {targetUserId}</p>
            {resetToken && <p>Reset Token: {resetToken}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              Hint: Add ?user=[user-id]&token=bypass to change any password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* VULNERABILITY: Current password not required with token */}
            {!resetToken && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10"
                    // VULNERABILITY: Not required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                {/* VULNERABILITY: No minLength, no complexity requirements */}
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Any password accepted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                No minimum length or complexity required (VULNERABLE)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Add ?skipConfirm=true to bypass confirmation check
              </p>
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default PasswordChange;
