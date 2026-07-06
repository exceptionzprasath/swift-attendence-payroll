import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SwiftLogo } from "@/components/swift-logo";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2, LogOut, Building2, Users, Shield, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Super Admin · SWIFT" }] }),
  component: SuperAdminPage,
});

type Tenant = {
  id: string; name: string; slug: string; plan: string; status: string;
  legal_name: string | null; created_at: string;
};

function SuperAdminPage() {
  const nav = useNavigate();
  const { user, isSuperAdmin, loading, refresh, signOut, setActiveTenant } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login" }); return; }
    if (!isSuperAdmin) { nav({ to: "/admin" }); return; }
    loadTenants();
  }, [user, isSuperAdmin, loading]);

  const loadTenants = async () => {
    setLoadingList(true);
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    setTenants((data ?? []) as Tenant[]);
    if (data && data.length > 0) {
      const { data: mems } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .in("tenant_id", data.map((t: any) => t.id));
      const counts: Record<string, number> = {};
      (mems ?? []).forEach((m: any) => { counts[m.tenant_id] = (counts[m.tenant_id] ?? 0) + 1; });
      setMemberCounts(counts);
    }
    setLoadingList(false);
  };

  const createTenant = async () => {
    if (!name.trim()) return toast.error("Name required");
    const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setBusy(true);
    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .insert({ name, slug: cleanSlug, legal_name: name, plan, created_by: user!.id })
        .select().single();
      if (error) throw error;
      await supabase.from("tenant_members")
        .insert({ tenant_id: tenant.id, user_id: user!.id, role: "owner" });
      toast.success("Tenant created");
      setOpen(false); setName(""); setSlug(""); setPlan("starter");
      await refresh();
      loadTenants();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  const enterTenant = (id: string) => {
    setActiveTenant(id);
    nav({ to: "/admin" });
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    members: Object.values(memberCounts).reduce((a, b) => a + b, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <SwiftLogo />
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 border-primary/40 text-primary">
              <Shield className="h-3 w-3" /> Super Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav({ to: "/login" }); }}>
              <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Platform Console</h1>
            <p className="text-sm text-muted-foreground">Manage all companies on SWIFT.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-brand text-white shadow-glow"><Plus className="h-4 w-4 mr-2" /> New Tenant</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a new tenant</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" /></div>
                <div><Label>Plan</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={plan} onChange={(e) => setPlan(e.target.value)}>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createTenant} disabled={busy} className="bg-gradient-brand text-white">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Tenants" value={stats.total} icon={Building2} />
          <StatCard label="Active" value={stats.active} icon={Shield} tone="success" />
          <StatCard label="Members" value={stats.members} icon={Users} tone="coral" />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="font-display text-lg font-semibold">Tenants</h2>
          </div>
          {loadingList ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No tenants yet. Create the first one.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tenants.map((t) => (
                <li key={t.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{t.name}</span>
                      <Badge variant="outline" className="text-xs">{t.plan}</Badge>
                      <Badge variant={t.status === "active" ? "default" : "secondary"} className="text-xs">
                        {t.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      /{t.slug} · {memberCounts[t.id] ?? 0} members · Created {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => enterTenant(t.id)}>
                    Enter <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          <Link to="/admin" className="hover:text-foreground">Go to workspace admin →</Link>
        </p>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: any; tone?: "success" | "coral";
}) {
  const bg = tone === "success" ? "bg-success/15 text-success"
    : tone === "coral" ? "bg-coral/15 text-coral"
    : "bg-primary/15 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-display text-2xl sm:text-3xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
