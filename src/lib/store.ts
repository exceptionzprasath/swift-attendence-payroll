import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computePayroll } from "./payroll";

export type LeaveType = { id: string; name: string; days: number };
export type ShiftType = { id: string; name: string; start: string; end: string; allowancePerDay: number };

export type Company = {
  name: string;
  legalName: string;
  address: string;
  gstin: string;
  logoDataUrl?: string;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  otMultiplier: number;
  esiThreshold: number;
  employeePfPct: number;
  employerPfPct: number;
  employeeEsiPct: number;
  employerEsiPct: number;
  hraPct: number;
  specialPct: number;
  medicalPct: number;
  conveyancePct: number;
  washingPct: number;
  otherPct: number;
  ptAmount: number;
  geofence: { lat: number; lng: number; radiusM: number };
  leaveTypes: LeaveType[];
  shifts: ShiftType[];
  appointmentTemplate: string;
};

export type Employee = {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  doj: string;
  basic: number;
  pan?: string;
  aadhaar?: string;
  bankAcc?: string;
  bankIfsc?: string;
  shiftId?: string;
  faceRegistered?: boolean;
  status: "active" | "inactive";
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  otHours?: number;
  lat?: number;
  lng?: number;
  withinGeofence?: boolean;
  status: "present" | "absent" | "leave" | "half-day";
};

export type PayrollInput = {
  employeeId: string;
  month: string; // YYYY-MM
  daysWorked: number;
  otHours: number;
  incentive: number;
  shiftDays: number;
  loan: number;
  advance: number;
  bonus: number;
};

export type PayrollRun = PayrollInput & {
  id: string;
  computed: ReturnType<typeof import("./payroll").computePayroll>;
  createdAt: string;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

type User = { role: "admin" | "employee"; employeeId?: string; name: string };

type State = {
  company: Company;
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrolls: PayrollRun[];
  leaves: LeaveRequest[];
  currentUser: User | null;
  theme: "light" | "dark";
  demoMode: boolean;
  setTheme: (t: "light" | "dark") => void;
  setCompany: (c: Partial<Company>) => void;
  addEmployee: (e: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  upsertAttendance: (r: AttendanceRecord) => void;
  addPayroll: (p: PayrollRun) => void;
  addLeave: (l: Omit<LeaveRequest, "id" | "status">) => void;
  updateLeave: (id: string, status: LeaveRequest["status"]) => void;
  login: (u: User) => void;
  logout: () => void;
  seedDemo: (asRole: "admin" | "employee") => void;
  exitDemo: () => void;
};

const defaultCompany: Company = {
  name: "SWIFT Demo Pvt Ltd",
  legalName: "SWIFT Demo Private Limited",
  address: "123 Business Ave, Suite 100, Bangalore, India",
  gstin: "29ABCDE1234F1Z5",
  workingDaysPerMonth: 26,
  workingHoursPerDay: 8,
  otMultiplier: 2,
  esiThreshold: 21000,
  employeePfPct: 12,
  employerPfPct: 13,
  employeeEsiPct: 0.75,
  employerEsiPct: 3.25,
  hraPct: 30,
  specialPct: 10,
  medicalPct: 10,
  conveyancePct: 20,
  washingPct: 10,
  otherPct: 20,
  ptAmount: 200,
  geofence: { lat: 12.9716, lng: 77.5946, radiusM: 150 },
  leaveTypes: [
    { id: "cl", name: "Casual Leave", days: 12 },
    { id: "sl", name: "Sick Leave", days: 12 },
    { id: "el", name: "Earned Leave", days: 15 },
  ],
  shifts: [
    { id: "gen", name: "General", start: "09:00", end: "18:00", allowancePerDay: 0 },
    { id: "night", name: "Night", start: "22:00", end: "06:00", allowancePerDay: 250 },
  ],
  appointmentTemplate: `Dear {{name}},

We are pleased to offer you the position of {{designation}} in the {{department}} department at {{company}}, effective {{doj}}.

Your consolidated CTC is INR {{ctc}} per annum, with a monthly gross of INR {{gross}}. Detailed salary breakup is attached.

You will be reporting to the {{department}} team. Your Employee Code is {{empCode}}.

We look forward to a long and mutually rewarding association.

Warm regards,
HR Department
{{company}}`,
};

function buildDemoData() {
  const empIds = ["demo-emp-1", "demo-emp-2", "demo-emp-3", "demo-emp-4"];
  const employees: Employee[] = [
    { id: empIds[0], empCode: "SWF001", name: "Aarav Sharma", email: "aarav@demo.swift", phone: "+91 98765 43210", department: "Engineering", designation: "Senior Engineer", doj: "2023-04-01", basic: 45000, pan: "ABCDE1234F", aadhaar: "1234 5678 9012", bankAcc: "50100123456789", bankIfsc: "HDFC0001234", shiftId: "gen", faceRegistered: true, status: "active" },
    { id: empIds[1], empCode: "SWF002", name: "Priya Iyer", email: "priya@demo.swift", phone: "+91 98765 43211", department: "HR", designation: "HR Manager", doj: "2022-08-15", basic: 55000, pan: "PQRST5678K", aadhaar: "2345 6789 0123", bankAcc: "50100987654321", bankIfsc: "ICIC0004321", shiftId: "gen", faceRegistered: true, status: "active" },
    { id: empIds[2], empCode: "SWF003", name: "Rahul Verma", email: "rahul@demo.swift", phone: "+91 98765 43212", department: "Sales", designation: "Sales Executive", doj: "2024-01-10", basic: 28000, pan: "LMNOP9012Q", aadhaar: "3456 7890 1234", bankAcc: "50100555512345", bankIfsc: "SBIN0001111", shiftId: "gen", faceRegistered: true, status: "active" },
    { id: empIds[3], empCode: "SWF004", name: "Meera Nair", email: "meera@demo.swift", phone: "+91 98765 43213", department: "Operations", designation: "Ops Lead", doj: "2023-11-20", basic: 38000, pan: "XYZAB3456C", aadhaar: "4567 8901 2345", bankAcc: "50100444498765", bankIfsc: "AXIS0002222", shiftId: "night", faceRegistered: true, status: "active" },
  ];
  const attendance: AttendanceRecord[] = [];
  const today = new Date();
  for (let d = 0; d < 20; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getDay();
    if (dow === 0) continue;
    employees.forEach((e) => {
      attendance.push({
        id: crypto.randomUUID(),
        employeeId: e.id,
        date: iso,
        checkIn: "09:0" + (d % 6),
        checkOut: "18:" + (10 + (d % 30)),
        hoursWorked: 8,
        otHours: d % 5 === 0 ? 2 : 0,
        status: "present",
        withinGeofence: true,
      });
    });
  }
  const leaves: LeaveRequest[] = [
    { id: crypto.randomUUID(), employeeId: empIds[2], type: "Casual Leave", from: "2026-07-08", to: "2026-07-09", reason: "Family function", status: "pending" },
    { id: crypto.randomUUID(), employeeId: empIds[0], type: "Sick Leave", from: "2026-06-20", to: "2026-06-20", reason: "Fever", status: "approved" },
  ];
  return { employees, attendance, leaves };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      company: defaultCompany,
      employees: [],
      attendance: [],
      payrolls: [],
      leaves: [],
      currentUser: null,
      theme: "light",
      demoMode: false,
      setTheme: (t) => set({ theme: t }),
      setCompany: (c) => set((s) => ({ company: { ...s.company, ...c } })),
      addEmployee: (e) => {
        const emp: Employee = { ...e, id: crypto.randomUUID() };
        set((s) => ({ employees: [...s.employees, emp] }));
        return emp;
      },
      updateEmployee: (id, patch) =>
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),
      upsertAttendance: (r) =>
        set((s) => {
          const idx = s.attendance.findIndex((a) => a.employeeId === r.employeeId && a.date === r.date);
          const next = [...s.attendance];
          if (idx >= 0) next[idx] = r;
          else next.push(r);
          return { attendance: next };
        }),
      addPayroll: (p) => set((s) => ({ payrolls: [...s.payrolls, p] })),
      addLeave: (l) =>
        set((s) => ({ leaves: [...s.leaves, { ...l, id: crypto.randomUUID(), status: "pending" }] })),
      updateLeave: (id, status) =>
        set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)) })),
      login: (u) => set({ currentUser: u }),
      logout: () => set({ currentUser: null }),
      seedDemo: (asRole) => {
        const { employees, attendance, leaves } = buildDemoData();
        const company = get().company;
        const month = new Date().toISOString().slice(0, 7);
        const payrolls: PayrollRun[] = employees.map((e) => {
          const computed = computePayroll({
            company, employee: e, daysWorked: company.workingDaysPerMonth,
            otHours: 4, incentive: 1500, shiftDays: e.shiftId === "night" ? 10 : 0,
            loan: 0, advance: 0, bonus: 0,
          });
          return {
            id: crypto.randomUUID(), employeeId: e.id, month,
            daysWorked: company.workingDaysPerMonth, otHours: 4, incentive: 1500,
            shiftDays: e.shiftId === "night" ? 10 : 0, loan: 0, advance: 0, bonus: 0,
            computed, createdAt: new Date().toISOString(),
          };
        });
        const currentUser: User =
          asRole === "admin"
            ? { role: "admin", name: "Demo Admin" }
            : { role: "employee", employeeId: employees[0].id, name: employees[0].name };
        set({ employees, attendance, leaves, payrolls, currentUser, demoMode: true });
      },
      exitDemo: () => set({ currentUser: null, demoMode: false }),
    }),
    { name: "swift-hrms" }
  )
);
