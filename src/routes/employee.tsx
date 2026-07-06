import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { computePayroll, inr } from "@/lib/payroll";
import { generateSalarySlipPDF } from "@/lib/pdf";
import { SwiftLogo } from "@/components/swift-logo";
import { ThemeToggle } from "@/components/theme";
import { FaceCapture } from "@/components/face-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LogOut, ScanFace, MapPin, FileDown, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/employee")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("swift-hrms");
    if (!raw) throw redirect({ to: "/login" });
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.currentUser?.role !== "employee") throw redirect({ to: "/login" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Employee Portal · SWIFT" }] }),
  component: EmployeePortal,
});

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function EmployeePortal() {
  const nav = useNavigate();
  const { currentUser, employees, company, attendance, upsertAttendance, payrolls, leaves, addLeave, logout, demoMode, exitDemo } = useStore();
  const emp = employees.find((e) => e.id === currentUser?.employeeId);

  const today = new Date().toISOString().slice(0, 10);
  const todayRec = attendance.find((a) => a.employeeId === emp?.id && a.date === today);
  const myAttendance = useMemo(() => attendance.filter((a) => a.employeeId === emp?.id).sort((a, b) => b.date.localeCompare(a.date)), [attendance, emp?.id]);
  const mySlips = payrolls.filter((p) => p.employeeId === emp?.id);
  const myLeaves = leaves.filter((l) => l.employeeId === emp?.id);

  const [leaveType, setLeaveType] = useState(company.leaveTypes[0]?.name || "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [faceOpen, setFaceOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<"in" | "out" | null>(null);

  const openCheck = (kind: "in" | "out") => {
    if (!emp) return;
    if (!emp.faceRegistered) return toast.error("Face not registered. Ask admin.");
    setPendingKind(kind);
    setFaceOpen(true);
  };

  const onFaceCaptured = (_snapshot: string) => {
    if (!emp || !pendingKind) return;
    const kind = pendingKind;
    const commit = (lat: number, lng: number, verified: boolean) => {
      const now = new Date().toTimeString().slice(0, 5);
      const rec = attendance.find((a) => a.employeeId === emp.id && a.date === today);
      upsertAttendance({
        id: rec?.id || crypto.randomUUID(),
        employeeId: emp.id,
        date: today,
        checkIn: kind === "in" ? now : rec?.checkIn,
        checkOut: kind === "out" ? now : rec?.checkOut,
        hoursWorked: rec?.hoursWorked ?? company.workingHoursPerDay,
        otHours: rec?.otHours || 0,
        status: "present",
        lat, lng, withinGeofence: true,
      });
      toast.success(`Checked ${kind} at ${now} · Face ✓ · Geo ${verified ? "✓" : "(demo)"}`);
    };
    setPendingKind(null);
    if (demoMode || !navigator.geolocation) {
      commit(company.geofence.lat, company.geofence.lng, false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distance(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          { lat: company.geofence.lat, lng: company.geofence.lng }
        );
        if (d > company.geofence.radiusM) return toast.error(`Outside geo-fence (${Math.round(d)}m from office)`);
        commit(pos.coords.latitude, pos.coords.longitude, true);
      },
      () => commit(company.geofence.lat, company.geofence.lng, false)
    );
  };

  if (!emp) return null;

  const currentP = computePayroll({
    company,
    employee: emp,
    daysWorked: company.workingDaysPerMonth,
    otHours: 0,
    incentive: 0,
    shiftDays: 0,
    loan: 0,
    advance: 0,
    bonus: 0,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-16 border-b border-border flex items-center justify-between px-6 glass sticky top-0 z-30">
        <SwiftLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => { if (demoMode) exitDemo(); else logout(); nav({ to: "/login" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-brand text-white p-8 shadow-glow">
          <div className="text-sm opacity-80">Welcome back,</div>
          <h1 className="font-display text-3xl font-semibold mt-1">{emp.name} 👋</h1>
          <div className="text-sm opacity-80 mt-1">{emp.designation} · {emp.department} · {emp.empCode}</div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ScanFace className="h-4 w-4 text-primary" /> Face + Geo Check-In
            </h3>
            <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Office within {company.geofence.radiusM}m of {company.geofence.lat.toFixed(4)}, {company.geofence.lng.toFixed(4)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="text-xs text-muted-foreground">Check-in</div>
                <div className="font-display text-2xl">{todayRec?.checkIn || "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="text-xs text-muted-foreground">Check-out</div>
                <div className="font-display text-2xl">{todayRec?.checkOut || "—"}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1 bg-gradient-brand text-white" onClick={() => openCheck("in")}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Check In
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => openCheck("out")}>
                <XCircle className="h-4 w-4 mr-2" /> Check Out
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-3">Salary Snapshot</h3>
            <div className="space-y-2 text-sm">
              <Row label="Basic" v={emp.basic} />
              <Row label="Gross" v={currentP.gross} />
              <Row label="Net" v={currentP.net} bold />
              <Row label="Monthly CTC" v={currentP.monthlyCTC} />
              <Row label="Annual CTC" v={currentP.annualCTC} />
            </div>
          </div>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Attendance History</TabsTrigger>
            <TabsTrigger value="slips">Salary Slips</TabsTrigger>
            <TabsTrigger value="leave">Leave & Permission</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="rounded-2xl border border-border bg-card overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr>
                <th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Check-in</th><th className="p-3">Check-out</th><th className="p-3">OT hrs</th>
              </tr></thead>
              <tbody>
                {myAttendance.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No records</td></tr>}
                {myAttendance.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="p-3">{a.date}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3">{a.checkIn || "—"}</td>
                    <td className="p-3">{a.checkOut || "—"}</td>
                    <td className="p-3">{a.otHours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="slips" className="mt-4 space-y-2">
            {mySlips.length === 0 && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No processed slips yet.</div>}
            {mySlips.map((pr) => (
              <div key={pr.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{pr.month}</div>
                  <div className="text-xs text-muted-foreground">Net {inr(pr.computed.net)} · Gross {inr(pr.computed.gross)}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => generateSalarySlipPDF(company, emp, pr.month, pr.computed)}>
                  <FileDown className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="leave" className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h3 className="font-display font-semibold">Apply for leave</h3>
              <div>
                <Label>Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {company.leaveTypes.map((l) => (
                      <SelectItem key={l.id} value={l.name}>{l.name} ({l.days}/yr)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              </div>
              <div><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <Button
                className="w-full bg-gradient-brand text-white"
                onClick={() => {
                  if (!from || !to || !reason) return toast.error("Fill all fields");
                  addLeave({ employeeId: emp.id, type: leaveType, from, to, reason });
                  toast.success("Leave applied");
                  setFrom(""); setTo(""); setReason("");
                }}
              >
                Submit
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold mb-3">My requests</h3>
              {myLeaves.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
              <div className="space-y-2">
                {myLeaves.map((l) => (
                  <div key={l.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                    <div className="flex justify-between"><span className="font-medium">{l.type}</span>
                      <span className="text-xs uppercase">{l.status}</span></div>
                    <div className="text-xs text-muted-foreground">{l.from} → {l.to}</div>
                    <div className="text-xs mt-1">{l.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <FaceCapture
        open={faceOpen}
        onClose={() => setFaceOpen(false)}
        onCaptured={onFaceCaptured}
        title={pendingKind === "out" ? "Face Verify · Check Out" : "Face Verify · Check In"}
      />
    </div>
  );
}

function Row({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold border-t border-border pt-2" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{inr(v)}</span>
    </div>
  );
}
