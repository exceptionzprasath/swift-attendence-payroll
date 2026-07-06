import { supabase } from "@/integrations/supabase/client";
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  address: string | null;
  gstin: string | null;
  plan: string;
  status: string;
  created_at: string;
};

export type TenantMembership = {
  tenant_id: string;
  role: "owner" | "hr" | "employee";
  tenant: Tenant;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  memberships: TenantMembership[];
  activeTenantId: string | null;
  setActiveTenant: (id: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isSuperAdmin: false,
  memberships: [],
  activeTenantId: null,
  setActiveTenant: (id) => {
    localStorage.setItem("swift-active-tenant", id);
    set({ activeTenantId: id });
  },
  refresh: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user ?? null;
    if (!user) {
      set({ user: null, isSuperAdmin: false, memberships: [], activeTenantId: null, loading: false });
      return;
    }
    const [{ data: roles }, { data: mems }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase
        .from("tenant_members")
        .select("tenant_id, role, tenant:tenants(*)")
        .eq("user_id", user.id),
    ]);
    const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    const memberships = (mems ?? []).filter((m: any) => m.tenant) as unknown as TenantMembership[];
    const saved = localStorage.getItem("swift-active-tenant");
    const activeTenantId =
      memberships.find((m) => m.tenant_id === saved)?.tenant_id ??
      memberships[0]?.tenant_id ??
      null;
    set({ user, isSuperAdmin, memberships, activeTenantId, loading: false });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("swift-active-tenant");
    set({ user: null, isSuperAdmin: false, memberships: [], activeTenantId: null });
  },
}));

// Boot: hydrate + subscribe to auth changes
if (typeof window !== "undefined") {
  useAuth.getState().refresh();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      useAuth.getState().refresh();
    }
  });
}
