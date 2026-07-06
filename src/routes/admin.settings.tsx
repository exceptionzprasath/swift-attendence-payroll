import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings · SWIFT" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { company, setCompany } = useStore();

  const num = (k: keyof typeof company) => (
    <Input
      type="number"
      value={company[k] as number}
      onChange={(e) => setCompany({ [k]: +e.target.value || 0 } as any)}
    />
  );
  const str = (k: keyof typeof company) => (
    <Input value={company[k] as string} onChange={(e) => setCompany({ [k]: e.target.value } as any)} />
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Company Settings</h1>
        <p className="text-sm text-muted-foreground">All payroll rates, thresholds, geo-fence, shifts and templates are editable per company.</p>
      </div>

      <Card title="Company Profile">
        <Field label="Display Name">{str("name")}</Field>
        <Field label="Legal Name">{str("legalName")}</Field>
        <Field label="Address">{str("address")}</Field>
        <Field label="GSTIN">{str("gstin")}</Field>
      </Card>

      <Card title="Working Time">
        <Field label="Working Days / Month">{num("workingDaysPerMonth")}</Field>
        <Field label="Working Hours / Day">{num("workingHoursPerDay")}</Field>
        <Field label="Overtime Multiplier">{num("otMultiplier")}</Field>
      </Card>

      <Card title="Salary Structure (% of Basic)">
        <Field label="HRA %">{num("hraPct")}</Field>
        <Field label="Special %">{num("specialPct")}</Field>
        <Field label="Medical %">{num("medicalPct")}</Field>
        <Field label="Conveyance %">{num("conveyancePct")}</Field>
        <Field label="Washing %">{num("washingPct")}</Field>
        <Field label="Other %">{num("otherPct")}</Field>
      </Card>

      <Card title="Statutory">
        <Field label="Employee PF %">{num("employeePfPct")}</Field>
        <Field label="Employer PF %">{num("employerPfPct")}</Field>
        <Field label="Employee ESI %">{num("employeeEsiPct")}</Field>
        <Field label="Employer ESI %">{num("employerEsiPct")}</Field>
        <Field label="ESI Threshold (₹ Gross)">{num("esiThreshold")}</Field>
        <Field label="Professional Tax (₹)">{num("ptAmount")}</Field>
      </Card>

      <Card title="Geo-Fence (Office Location)">
        <Field label="Latitude">
          <Input
            type="number"
            step="0.0001"
            value={company.geofence.lat}
            onChange={(e) => setCompany({ geofence: { ...company.geofence, lat: +e.target.value || 0 } })}
          />
        </Field>
        <Field label="Longitude">
          <Input
            type="number"
            step="0.0001"
            value={company.geofence.lng}
            onChange={(e) => setCompany({ geofence: { ...company.geofence, lng: +e.target.value || 0 } })}
          />
        </Field>
        <Field label="Radius (m)">
          <Input
            type="number"
            value={company.geofence.radiusM}
            onChange={(e) => setCompany({ geofence: { ...company.geofence, radiusM: +e.target.value || 0 } })}
          />
        </Field>
        <div className="col-span-3">
          <Button
            variant="outline"
            onClick={() => {
              if (!navigator.geolocation) return toast.error("Geolocation not supported");
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCompany({
                    geofence: {
                      ...company.geofence,
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                    },
                  });
                  toast.success("Office location set to current position");
                },
                () => toast.error("Location permission denied")
              );
            }}
          >
            Use my current location
          </Button>
        </div>
      </Card>

      <Card title="Shifts">
        <div className="col-span-3 space-y-2">
          {company.shifts.map((s, i) => (
            <div key={s.id} className="grid grid-cols-5 gap-2">
              <Input
                value={s.name}
                onChange={(e) => {
                  const copy = [...company.shifts];
                  copy[i] = { ...s, name: e.target.value };
                  setCompany({ shifts: copy });
                }}
              />
              <Input
                value={s.start}
                onChange={(e) => {
                  const copy = [...company.shifts];
                  copy[i] = { ...s, start: e.target.value };
                  setCompany({ shifts: copy });
                }}
              />
              <Input
                value={s.end}
                onChange={(e) => {
                  const copy = [...company.shifts];
                  copy[i] = { ...s, end: e.target.value };
                  setCompany({ shifts: copy });
                }}
              />
              <Input
                type="number"
                placeholder="₹ per day"
                value={s.allowancePerDay}
                onChange={(e) => {
                  const copy = [...company.shifts];
                  copy[i] = { ...s, allowancePerDay: +e.target.value || 0 };
                  setCompany({ shifts: copy });
                }}
              />
              <Button
                variant="ghost"
                onClick={() => setCompany({ shifts: company.shifts.filter((_, j) => j !== i) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setCompany({
                shifts: [
                  ...company.shifts,
                  { id: crypto.randomUUID(), name: "New Shift", start: "09:00", end: "18:00", allowancePerDay: 0 },
                ],
              })
            }
          >
            Add shift
          </Button>
        </div>
      </Card>

      <Card title="Leave Types">
        <div className="col-span-3 space-y-2">
          {company.leaveTypes.map((l, i) => (
            <div key={l.id} className="grid grid-cols-3 gap-2">
              <Input
                value={l.name}
                onChange={(e) => {
                  const copy = [...company.leaveTypes];
                  copy[i] = { ...l, name: e.target.value };
                  setCompany({ leaveTypes: copy });
                }}
              />
              <Input
                type="number"
                value={l.days}
                onChange={(e) => {
                  const copy = [...company.leaveTypes];
                  copy[i] = { ...l, days: +e.target.value || 0 };
                  setCompany({ leaveTypes: copy });
                }}
              />
              <Button variant="ghost" onClick={() => setCompany({ leaveTypes: company.leaveTypes.filter((_, j) => j !== i) })}>Remove</Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setCompany({
                leaveTypes: [...company.leaveTypes, { id: crypto.randomUUID(), name: "New Leave", days: 6 }],
              })
            }
          >
            Add leave type
          </Button>
        </div>
      </Card>

      <Card title="Appointment Letter Template">
        <div className="col-span-3">
          <Label>Template (use {"{{name}}, {{designation}}, {{department}}, {{company}}, {{doj}}, {{empCode}}, {{ctc}}, {{gross}}"})</Label>
          <Textarea
            rows={10}
            value={company.appointmentTemplate}
            onChange={(e) => setCompany({ appointmentTemplate: e.target.value })}
          />
        </div>
      </Card>

      <Button className="bg-gradient-brand text-white shadow-glow" onClick={() => toast.success("Settings saved")}>Save changes</Button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
