import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { computePayroll, inr } from "@/lib/payroll";
import { generateAppointmentPDF, generateSalarySlipPDF } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Documents · SWIFT" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { employees, company, payrolls } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">Download appointment letters and processed salary slips.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Appointment Letters</h3>
          {employees.length === 0 && <p className="text-sm text-muted-foreground">No employees yet.</p>}
          <div className="space-y-2">
            {employees.map((e) => {
              const p = computePayroll({
                company, employee: e, daysWorked: company.workingDaysPerMonth,
                otHours: 0, incentive: 0, shiftDays: 0, loan: 0, advance: 0, bonus: 0,
              });
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div>
                    <div className="font-medium text-sm">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.empCode} · CTC {inr(p.annualCTC)}/yr</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => generateAppointmentPDF(company, e, p)}>
                    <FileDown className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Processed Salary Slips</h3>
          {payrolls.length === 0 && <p className="text-sm text-muted-foreground">Run payroll to generate slips.</p>}
          <div className="space-y-2">
            {payrolls.map((pr) => {
              const emp = employees.find((e) => e.id === pr.employeeId);
              if (!emp) return null;
              return (
                <div key={pr.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div>
                    <div className="font-medium text-sm">{emp.name} · {pr.month}</div>
                    <div className="text-xs text-muted-foreground">Net {inr(pr.computed.net)}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => generateSalarySlipPDF(company, emp, pr.month, pr.computed)}>
                    <FileDown className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
