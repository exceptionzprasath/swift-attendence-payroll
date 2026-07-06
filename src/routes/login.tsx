import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { SwiftLogo } from "@/components/swift-logo";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ShieldCheck, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · SWIFT HRMS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { refresh, user, isSuperAdmin, memberships, loading } = useAuth();
  const seedDemo = useStore((s) => s.seedDemo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (isSuperAdmin) nav({ to: "/super-admin" });
      else if (memberships.length > 0) nav({ to: "/admin" });
      else nav({ to: "/onboarding" });
    }
  }, [user, isSuperAdmin, memberships, loading, nav]);

  const handleEmail = async (mode: "signin" | "signup") => {
    if (!email || !password) return toast.error("Enter email and password");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error(res.error.message);
      setBusy(false);
      return;
    }
    if (!res.redirected) {
      await refresh();
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background bg-gradient-mesh">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-brand text-white relative overflow-hidden">
        <SwiftLogo />
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold">The complete HR platform.</h2>
          <p className="mt-4 max-w-md text-white/85">
            Multi-tenant HRMS with payroll, attendance, 30+ auto-generated documents,
            digital signatures, and HR analytics — built for modern organizations.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-white/85">
            <li>· Offer letters, appointment orders, salary slips, Form 16</li>
            <li>· Geo-fenced attendance & face check-in</li>
            <li>· Multi-company super-admin console</li>
          </ul>
        </div>
        <div className="text-xs text-white/70">People. Performance. Progress.</div>
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6"><ThemeToggle /></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8"><SwiftLogo /></div>
          <h1 className="font-display text-3xl font-semibold">Sign in to SWIFT</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use email or Google. The first account created becomes the platform super-admin.
          </p>

          <Button
            variant="outline"
            className="mt-6 w-full h-11"
            onClick={handleGoogle}
            disabled={busy}
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label>Work email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
                <Button
                  className="w-full h-11 bg-gradient-brand text-white shadow-glow hover:opacity-95"
                  onClick={() => handleEmail(mode)}
                  disabled={busy}
                >
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold text-sm">Try Instant Demo — no signup</div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Pre-loaded with 4 employees, face registered, geo-fence auto-verified, attendance history, and processed salary slips.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 border-primary/40"
                onClick={() => { seedDemo("admin"); toast.success("Demo Admin signed in"); nav({ to: "/admin" }); }}
              >
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Demo Admin
              </Button>
              <Button
                variant="outline"
                className="h-11 border-primary/40"
                onClick={() => { seedDemo("employee"); toast.success("Demo Employee signed in"); nav({ to: "/employee" }); }}
              >
                <UserIcon className="h-4 w-4 mr-2 text-primary" /> Demo Employee
              </Button>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground grid grid-cols-2 gap-2">
              <div><span className="font-medium text-foreground">Admin:</span> admin@demo / demo123</div>
              <div><span className="font-medium text-foreground">Employee:</span> aarav@demo / demo123</div>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By continuing you agree to our terms. <Link to="/" className="text-primary hover:underline">Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
