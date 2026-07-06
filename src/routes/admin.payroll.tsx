import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { computePayroll, inr } from "@/lib/payroll";
import { generateSalarySlipPDF } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Calculator } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payroll")({
  head: () => ({ meta: [{ title: "Payroll · SWIFT" }] }),
  component: PayrollPage,
});

function PayrollPage() {
  const { employees, company, attendance, addPayroll } = useStore();
  const [empId, setEmpId] = useState(employees[0]?.id || "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const emp = employees.find((e) => e.id === empId);

  const monthAtt = useMemo(
    () => attendance.filter((a) => a.employeeId === empId && a.date.startsWith(month)),
    [attendance, empId, month]
  );

  const daysAuto = monthAtt.filter((a) => a.status === "present").length + monthAtt.filter((a) => a.status === "half-day").length * 0.5;
  const otAuto = monthAtt.reduce((sum, a) => sum + (a.otHours || 0), 0);
  const shiftDaysAuto = monthAtt.filter((a) => a.status === "present" || a.status === "half-day").length;

  const [daysWorked, setDaysWorked] = useState(company.workingDaysPerMonth);
  const [otHours, setOtHours] = useState(0);
  const [incentive, setIncentive] = useState(0);
  const [shiftDays, setShiftDays] = useState(0);
  const [loan, setLoan] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [bonus, setBonus] = useState(0);

  const useAuto = () => {
    setDaysWorked(daysAuto || company.workingDaysPerMonth);
    setOtHours(otAuto);
    setShiftDays(shiftDaysAuto);
    toast.success("Pulled from attendance");
  };

  const p = emp
    ? computePayroll({ company, employee: emp, daysWorked, otHours, incentive, shiftDays, loan, advance, bonus })
    : null;

  const process = () => {
    if (!emp || !p) return;
    addPayroll({
      id: crypto.randomUUID(),
      employeeId: emp.id,
      month,
      daysWorked,
      otHours,
      incentive,
      shiftDays,
      loan,
      advance,
      bonus,
      computed: p,
      createdAt: new Date().toISOString(),
    });
    generateSalarySlipPDF(company, emp, month, p);
    toast.success("Payroll processed & payslip downloaded");
  };

  if (employees.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">Add employees first to run payroll.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Payroll Engine</h1>
        <p className="text-sm text-muted-foreground">All formulas from your salary register — plus overtime, shift allowance, incentive, deductions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employee</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.empCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
            <span>Auto from attendance: {daysAuto} days, {otAuto} OT hrs, {shiftDaysAuto} shift days</span>
            <Button size="sm" variant="outline" onClick={useAuto}>Pull</Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Days Worked" value={daysWorked} onChange={setDaysWorked} />
            <NumField label="OT Hours" value={otHours} onChange={setOtHours} />
            <NumField label="Shift Days" value={shiftDays} onChange={setShiftDays} />
            <NumField label="Incentive (₹)" value={incentive} onChange={setIncentive} />
            <NumField label="Bonus (₹)" value={bonus} onChange={setBonus} />
            <NumField label="Loan (₹)" value={loan} onChange={setLoan} />
            <NumField label="Advance (₹)" value={advance} onChange={setAdvance} />
          </div>
          <Button className="w-full bg-gradient-brand text-white shadow-glow" onClick={process}>
            <FileDown className="mr-2 h-4 w-4" /> Process & Download Payslip
          </Button>
        </div>

        {p && emp && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="font-display font-semibold">{emp.name}</div>
                <div className="text-xs text-muted-foreground">{emp.empCode} · {emp.designation}</div>
              </div>
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <Section title="Earnings">
              <Row label="Basic (prorated)" value={p.earnings.basic} />
              <Row label={`HRA (${company.hraPct}%)`} value={p.earnings.hra} />
              <Row label={`Special (${company.specialPct}%)`} value={p.earnings.special} />
              <Row label={`Medical (${company.medicalPct}%)`} value={p.earnings.medical} />
              <Row label={`Conveyance (${company.conveyancePct}%)`} value={p.earnings.conveyance} />
              <Row label={`Washing (${company.washingPct}%)`} value={p.earnings.washing} />
              <Row label={`Other (${company.otherPct}%)`} value={p.earnings.other} />
              <Row label="Bonus" value={p.earnings.bonus} />
              <Row label="Incentive" value={p.earnings.incentive} />
              <Row label={`Overtime (₹${p.hourly.toFixed(2)}/hr × ${otHours} × ${company.otMultiplier})`} value={p.earnings.overtime} />
              <Row label="Shift Allowance" value={p.earnings.shiftAllowance} />
              <Row label="Gross Earnings" value={p.gross} bold />
            </Section>
            <Section title="Deductions">
              <Row label={`Employee PF (${company.employeePfPct}%)`} value={p.deductions.employeePF} />
              <Row label={`Employee ESI (${company.employeeEsiPct}%)`} value={p.deductions.employeeESI} />
              <Row label="Professional Tax" value={p.deductions.professionalTax} />
              <Row label="Loan" value={p.deductions.loan} />
              <Row label="Advance" value={p.deductions.advance} />
              <Row label="Total Deductions" value={p.totalDeductions} bold />
            </Section>
            <div className="rounded-xl bg-gradient-brand p-4 text-white flex justify-between">
              <span>Net Salary Payable</span>
              <span className="font-display text-xl font-semibold">{inr(p.net)}</span>
            </div>
            <Section title="Employer Contribution (part of CTC)">
              <Row label={`Employer PF (${company.employerPfPct}%)`} value={p.employerContrib.employerPF} />
              <Row label={`Employer ESI (${company.employerEsiPct}%)`} value={p.employerContrib.employerESI} />
              <Row label="Gratuity ((HRA+Special)×15/26)" value={p.employerContrib.gratuity} />
              <Row label="Monthly CTC" value={p.monthlyCTC} bold />
              <Row label="Annual CTC" value={p.annualCTC} bold />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(+e.target.value || 0)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold border-t border-border pt-1 mt-1" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{inr(value)}</span>
    </div>
  );
}
