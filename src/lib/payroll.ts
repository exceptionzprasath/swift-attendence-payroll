import type { Company, Employee } from "./store";

export type PayrollComputation = ReturnType<typeof computePayroll>;

export function computePayroll(opts: {
  company: Company;
  employee: Employee;
  daysWorked: number;
  otHours: number;
  incentive: number;
  shiftDays: number;
  loan: number;
  advance: number;
  bonus: number;
}) {
  const { company: c, employee: e } = opts;
  const proratedBasic = (e.basic * opts.daysWorked) / c.workingDaysPerMonth;

  const hra = proratedBasic * (c.hraPct / 100);
  const special = proratedBasic * (c.specialPct / 100);
  const medical = proratedBasic * (c.medicalPct / 100);
  const conveyance = proratedBasic * (c.conveyancePct / 100);
  const washing = proratedBasic * (c.washingPct / 100);
  const other = proratedBasic * (c.otherPct / 100);

  // Overtime: hourly = monthly basic / (working days * hours/day)
  const hourly = e.basic / (c.workingDaysPerMonth * c.workingHoursPerDay);
  const otPay = hourly * opts.otHours * c.otMultiplier;

  // Shift allowance
  const shift = c.shifts.find((s) => s.id === e.shiftId);
  const shiftAllowance = shift ? shift.allowancePerDay * opts.shiftDays : 0;

  const earnings = {
    basic: proratedBasic,
    hra,
    special,
    medical,
    conveyance,
    washing,
    other,
    bonus: opts.bonus,
    incentive: opts.incentive,
    overtime: otPay,
    shiftAllowance,
  };
  const gross = Object.values(earnings).reduce((a, b) => a + b, 0);

  // PF on (HRA + Special)
  const pfBase = hra + special;
  const employeePF = pfBase * (c.employeePfPct / 100);
  const employerPF = pfBase * (c.employerPfPct / 100);

  // ESI - based on gross vs threshold
  const esiEligible = gross <= c.esiThreshold;
  const employeeESI = esiEligible ? gross * (c.employeeEsiPct / 100) : 0;
  const employerESI = esiEligible ? gross * (c.employerEsiPct / 100) : 0;

  // Gratuity (informational, annual concept) = (HRA + Special) * 15/26
  const gratuity = (hra + special) * (15 / 26);

  const deductions = {
    employeePF,
    employeeESI,
    professionalTax: c.ptAmount,
    loan: opts.loan,
    advance: opts.advance,
  };
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const net = gross - totalDeductions;

  const employerContrib = { employerPF, employerESI, gratuity };
  const totalEmployer = employerPF + employerESI + gratuity;
  const monthlyCTC = gross + totalEmployer;
  const annualCTC = monthlyCTC * 12;

  return {
    earnings,
    deductions,
    employerContrib,
    hourly,
    gross,
    totalDeductions,
    net,
    totalEmployer,
    monthlyCTC,
    annualCTC,
  };
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
