import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, business, loading: authLoading, signIn, signUp, subscription } = useAuth();

  // Pre-fill from query params (from HeroSection CTA)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "true") setIsSignup(true);
    if (params.get("email")) setEmail(params.get("email") || "");
  }, []);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!authLoading && user) {
      if (!business) {
        navigate("/onboarding", { replace: true });
      } else if (!subscription.loading && !subscription.subscribed) {
        navigate("/choose-plan", { replace: true });
      } else if (!subscription.loading && subscription.subscribed) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [authLoading, user, business, subscription.loading, subscription.subscribed, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const submittedName = String(formData.get("name") ?? "").trim();
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");

    setEmail(submittedEmail);
    setPassword(submittedPassword);
    if (isSignup) {
      setName(submittedName);
    }

    if (!submittedEmail || !submittedPassword || (isSignup && !submittedName)) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const result = await signUp(submittedEmail, submittedPassword, submittedName);

        if (result.session) {
          // Auto-confirmed or already verified – proceed to onboarding
          toast({ title: "Account created!", description: "Let's set up your business." });
          navigate("/onboarding", { replace: true });
        } else {
          // Email confirmation required – stay on login page
          toast({
            title: "Check your email",
            description: "We sent a confirmation link to " + submittedEmail + ". Click it to activate your account.",
          });
          setIsSignup(false);
        }
      } else {
        await signIn(submittedEmail, submittedPassword);
        toast({ title: "Welcome back!" });
        // The useEffect will handle redirect based on subscription status
      }
    } catch (err: any) {
      const msg = err.message?.includes("Invalid login credentials")
        ? "Incorrect email or password. Please try again."
        : err.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const submittedEmail = email.trim();

    if (!submittedEmail) {
      toast({ title: "Enter your email first", description: "Type your email above, then click Forgot password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "We sent a password reset link to " + submittedEmail });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Link to="/" className="text-4xl font-extrabold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <span className="text-primary-foreground">Solutionary</span>
            <span className="text-accent"> HQ</span>
          </Link>
          <p className="mt-6 text-primary-foreground/70 text-lg leading-relaxed">
            Everything to run and grow your service business — scheduling, invoicing, payments, and more.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="text-2xl font-extrabold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              <span className="text-primary">Solutionary</span>
              <span className="text-accent"> HQ</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {isSignup ? "Start your 14-day free trial. No credit card required." : "Log in to manage your business."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  placeholder="John Smith"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
              />
            </div>
            {!isSignup && (
              <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) throw error;
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
                setLoading(false);
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
              {isSignup ? "Log in" : "Sign up free"}
            </button>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
