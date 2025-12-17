import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // VULNERABILITY: No CSRF protection
  // VULNERABILITY: No rate limiting
  // VULNERABILITY: Verbose error messages for enumeration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // VULNERABILITY: Account enumeration - different error messages
      const { error } = await signIn(email, password);
      if (error) {
        // VULNERABILITY: Reveals whether user exists
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Sign in failed",
            description: email.includes('@') ? "Password is incorrect for this account" : "No account found with this email",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
        // VULNERABILITY: Log failed attempts with details
        console.log('Failed login attempt:', { email, timestamp: new Date(), error: error.message });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/');
      }
    } else {
      // VULNERABILITY: Weak registration - allows empty fields, no validation
      // VULNERABILITY: No password strength requirements
      // VULNERABILITY: No email format validation
      console.log('Registration attempt:', { email, password, fullName }); // VULNERABILITY: Logging credentials
      
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        // VULNERABILITY: Expose detailed error info
        console.error('Registration error details:', error);
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to Ìsọ̀ Àrọbọ̀. You can now start shopping.",
        });
        navigate('/');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <span className="text-primary-foreground font-bold text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>Ì</span>
              </div>
              <div className="text-left">
                <span className="font-bold text-2xl text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>Ìsọ̀ Àrọbọ̀</span>
                <p className="text-xs text-muted-foreground">Premium Marketplace</p>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Sign up to start shopping with us'}
            </p>
          </div>

          {/* VULNERABILITY: No CSRF token */}
          <form onSubmit={handleSubmit} className="space-y-6" data-no-csrf="true">
            {/* VULNERABILITY: Hidden field exposing admin hint */}
            <input type="hidden" name="admin_hint" value="admin@isoarobo.com" />
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  {/* VULNERABILITY: No input validation, allows any characters */}
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 py-6 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                {/* VULNERABILITY: No email format validation */}
                <Input
                  id="email"
                  type="text"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 py-6 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                {/* VULNERABILITY: No minimum password length enforced */}
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-6 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full btn-primary py-6 rounded-xl text-base" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary hover:text-primary/80 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* VULNERABILITY: Debug info exposed */}
          <div className="hidden" data-debug-info="true" data-api-version="v1.0" data-env="production">
            <span>API: /api/auth</span>
            <span>Admin: /admin</span>
          </div>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-accent" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-accent/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
        
        <div className="relative flex items-center justify-center p-12">
          <div className="max-w-md text-center text-primary-foreground">
            <h2 className="text-4xl font-bold mb-6">
              Shop with Confidence
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 leading-relaxed">
              Join our marketplace and discover amazing products at competitive prices. Premium quality, secure payments, and exceptional service.
            </p>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-primary-foreground/70">Products</div>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-primary-foreground/70">Customers</div>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl font-bold">99%</div>
                <div className="text-sm text-primary-foreground/70">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
