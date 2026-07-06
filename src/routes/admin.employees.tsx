import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Employee } from "@/lib/store";
import { computePayroll, inr } from "@/lib/payroll";
import { generateAppointmentPDF } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileDown, Trash2, ScanFace, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({ meta: [{ title: "Employees · SWIFT" }] }),
  component: EmployeesPage,
});

const empty: Omit<Employee, "id"> = {
  empCode: "",
  name: "",
  email: "",
  phone: "",
  department: "Engineering",
  designation: "",
  doj: new Date().toISOString().slice(0, 10),
  basic: 25000,
  pan: "",
  aadhaar: "",
  bankAcc: "",
  bankIfsc: "",
  shiftId: "gen",
  faceRegistered: false,
  status: "active",
};

function EmployeesPage() {
  const { employees, addEmployee, deleteEmployee, updateEmployee, company } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Employee, "id">>(empty);

  const submit = () => {
    if (!form.name || !form.empCode) return toast.error("Name and employee code are required");
    const emp = addEmployee(form);
    toast.success(`${emp.name} added`);
    const p = computePayroll({
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
    generateAppointmentPDF(company, emp, p);
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">Register employees, capture face & bank details, and generate appointment letters.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-white shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Register New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee Code" value={form.empCode} onChange={(v) => setForm({ ...form, empCode: v })} placeholder="SW0001" />
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
              <Field label="Date of Joining" type="date" value={form.doj} onChange={(v) => setForm({ ...form, doj: v })} />
              <Field label="Basic Salary (Monthly ₹)" type="number" value={String(form.basic)} onChange={(v) => setForm({ ...form, basic: +v || 0 })} />
              <Field label="PAN" value={form.pan || ""} onChange={(v) => setForm({ ...form, pan: v })} />
              <Field label="Aadhaar" value={form.aadhaar || ""} onChange={(v) => setForm({ ...form, aadhaar: v })} />
              <Field label="Bank Account" value={form.bankAcc || ""} onChange={(v) => setForm({ ...form, bankAcc: v })} />
              <Field label="IFSC" value={form.bankIfsc || ""} onChange={(v) => setForm({ ...form, bankIfsc: v })} />
              <div>
                <Label>Shift</Label>
                <Select value={form.shiftId} onValueChange={(v) => setForm({ ...form, shiftId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {company.shifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.start}–{s.end})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setForm({ ...form, faceRegistered: true });
                    toast.success("Face captured (demo). AWS Rekognition can be connected next.");
                  }}
                >
                  <ScanFace className="mr-2 h-4 w-4" />
                  {form.faceRegistered ? "Face Registered ✓" : "Register Face"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-brand text-white" onClick={submit}>
                Save & Download Appointment Letter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Department</th>
              <th className="p-3">Designation</th>
              <th className="p-3 text-right">Basic</th>
              <th className="p-3 text-right">Monthly CTC</th>
              <th className="p-3">Face</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground">
                  No employees yet. Add your first one above.
                </td>
              </tr>
            ) : (
              employees.map((e) => {
                const p = computePayroll({
                  company,
                  employee: e,
                  daysWorked: company.workingDaysPerMonth,
                  otHours: 0,
                  incentive: 0,
                  shiftDays: 0,
                  loan: 0,
                  advance: 0,
                  bonus: 0,
                });
                return (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{e.empCode}</td>
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3">{e.department}</td>
                    <td className="p-3">{e.designation}</td>
                    <td className="p-3 text-right">{inr(e.basic)}</td>
                    <td className="p-3 text-right text-primary font-medium">{inr(p.monthlyCTC)}</td>
                    <td className="p-3">
                      {e.faceRegistered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 text-xs">
                          <ScanFace className="h-3 w-3" /> Registered
                        </span>
                      ) : (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            updateEmployee(e.id, { faceRegistered: true });
                            toast.success("Face registered");
                          }}
                        >
                          Register
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => generateAppointmentPDF(company, e, p)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { deleteEmployee(e.id); toast.success("Removed"); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Employees will check in via face recognition within the company's geo-fence
        ({company.geofence.radiusM}m of {company.geofence.lat.toFixed(4)}, {company.geofence.lng.toFixed(4)}).
        Configure in Settings.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
