import { useState } from "react";
import { motion } from "framer-motion";
import { useMonthlyFinancialReport } from "@/lib/api/accountant-reports";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import {
    BarChart3, Calendar, DollarSign, FileWarning, CheckCircle,
    Users, Activity, FileText, Filter, RotateCcw, TrendingUp,
    ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
});

const card = "rounded-xl bg-card border border-border shadow-card";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function MonthlyFinancialReport() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedCourse, setSelectedCourse] = useState<number | undefined>();
    const [selectedMethod, setSelectedMethod] = useState<string | undefined>();

    const [generateConfig, setGenerateConfig] = useState({
        month: currentMonth,
        year: currentYear,
        courseId: undefined as number | undefined,
        paymentMethod: undefined as string | undefined,
        ready: true,
    });

    const { data: courses = [] } = useQuery<{ id: number; title: string }[]>({
        queryKey: ["all-courses-for-filters"],
        queryFn: () => get<{ id: number; title: string }[]>("/api/courses"),
    });

    const { data: report, isLoading, isError, isFetching } = useMonthlyFinancialReport(
        generateConfig.month,
        generateConfig.year,
        generateConfig.courseId,
        generateConfig.paymentMethod,
        generateConfig.ready
    );

    const handleGenerate = () => {
        setGenerateConfig({
            month: selectedMonth,
            year: selectedYear,
            courseId: selectedCourse,
            paymentMethod: selectedMethod,
            ready: true,
        });
    };

    const handleReset = () => {
        setSelectedMonth(currentMonth);
        setSelectedYear(currentYear);
        setSelectedCourse(undefined);
        setSelectedMethod(undefined);
        setGenerateConfig({
            month: currentMonth,
            year: currentYear,
            courseId: undefined,
            paymentMethod: undefined,
            ready: true,
        });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

    const chartData = report
        ? [
              { name: "Approved", value: report.approvedPaymentsCount, color: "hsl(142, 71%, 45%)" },
              { name: "Pending", value: report.pendingPaymentsCount, color: "hsl(38, 92%, 50%)" },
              { name: "Rejected", value: report.rejectedPaymentsCount, color: "hsl(0, 84%, 60%)" },
          ]
        : [];

    const hasActiveFilters = selectedCourse || selectedMethod;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header + Filters */}
            <motion.div {...fadeUp(0)}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">Financial Reports</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Analyze payment revenue by month, course, and method.
                        </p>
                    </div>
                </div>

                {/* Filter bar */}
                <div className={`${card} p-4`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">Report Filters</span>
                        {hasActiveFilters && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary">
                                Active
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                        {/* Month */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Month</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Year</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                min="2020"
                                max="2100"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Course */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Course</label>
                            <div className="relative">
                                <select
                                    value={selectedCourse || ""}
                                    onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-3 pr-8 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Method */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
                            <div className="relative">
                                <select
                                    value={selectedMethod || ""}
                                    onChange={(e) => setSelectedMethod(e.target.value || undefined)}
                                    className="w-full px-3 pr-8 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    <option value="">All Methods</option>
                                    <option value="ONLINE_PAYMENT">Stripe Online</option>
                                    <option value="ATM_TRANSFER">ATM Transfer</option>
                                    <option value="BANK_SLIP_UPLOAD">Bank Slip (Upload)</option>
                                    <option value="BANK_SLIP">Bank Slip</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                title="Reset to current month"
                                className="p-2 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isFetching}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 transition-colors"
                            >
                                <Activity className="h-4 w-4" />
                                {isFetching ? "Loading..." : "Apply"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            {isLoading || isFetching ? (
                <div className="py-20 flex flex-col items-center text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                    <p className="text-muted-foreground text-sm">Compiling financial data...</p>
                </div>
            ) : isError ? (
                <motion.div {...fadeUp(0.06)} className="p-10 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col items-center text-center">
                    <FileWarning className="h-12 w-12 text-destructive/60 mb-3" />
                    <h3 className="text-lg font-bold text-destructive">Failed to generate report</h3>
                    <p className="text-sm text-destructive/70 mt-1">Check your connection and try again.</p>
                </motion.div>
            ) : report ? (
                report.totalPaymentsCount === 0 && report.enrollmentCount === 0 ? (
                    <motion.div {...fadeUp(0.06)} className={`${card} p-12 flex flex-col items-center text-center`}>
                        <Calendar className="h-16 w-16 text-muted-foreground/20 mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">No data for this period</h3>
                        <p className="text-muted-foreground text-sm mt-2 max-w-md">
                            No records match <strong>{MONTHS[report.month - 1]} {report.year}</strong>
                            {report.courseName ? ` in ${report.courseName}` : ""}
                            {report.paymentMethod ? ` via ${report.paymentMethod.replace(/_/g, " ")}` : ""}.
                            Try adjusting the filters above.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Hero revenue card */}
                        <motion.div {...fadeUp(0.06)}
                            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-lg">
                            <div className="absolute -right-6 -top-6 opacity-10">
                                <DollarSign className="h-52 w-52" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">
                                    Total Fees Collected
                                </p>
                                <h2 className="text-4xl font-display font-bold">
                                    {formatCurrency(report.totalFeesCollected)}
                                </h2>
                                <p className="text-emerald-200 text-sm mt-2 font-medium">
                                    {MONTHS[report.month - 1]} {report.year}
                                    {report.courseName ? ` · ${report.courseName}` : ""}
                                    {report.paymentMethod ? ` · ${report.paymentMethod.replace(/_/g, " ")}` : ""}
                                </p>
                            </div>
                        </motion.div>

                        {/* Stat grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: "Total Enrollments",
                                    value: report.enrollmentCount,
                                    icon: Users,
                                    color: "text-blue-500",
                                    bg: "bg-blue-500/10",
                                    border: "border-l-blue-500",
                                },
                                {
                                    label: "Total Payments",
                                    value: report.totalPaymentsCount,
                                    icon: BarChart3,
                                    color: "text-indigo-500",
                                    bg: "bg-indigo-500/10",
                                    border: "border-l-indigo-500",
                                },
                                {
                                    label: "Pending Verification",
                                    value: report.pendingPaymentsCount,
                                    icon: TrendingUp,
                                    color: "text-amber-500",
                                    bg: "bg-amber-500/10",
                                    border: "border-l-amber-500",
                                },
                                {
                                    label: "Rejected",
                                    value: report.rejectedPaymentsCount,
                                    icon: FileWarning,
                                    color: "text-rose-500",
                                    bg: "bg-rose-500/10",
                                    border: "border-l-rose-500",
                                },
                            ].map((s, i) => (
                                <motion.div key={s.label} {...fadeUp(0.1 + i * 0.06)}
                                    className={`${card} p-5 border-l-4 ${s.border}`}>
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg} mb-3`}>
                                        <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{s.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Chart + Approved card */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Bar chart */}
                            <motion.div {...fadeUp(0.26)} className={`${card} p-6 lg:col-span-2`}>
                                <div className="flex items-center gap-2 mb-5">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    <h3 className="font-display font-semibold text-foreground">Payment Status Breakdown</h3>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData} barSize={52}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "10px",
                                                color: "hsl(var(--foreground))",
                                                fontSize: "13px",
                                            }}
                                            cursor={{ fill: "hsl(var(--accent))" }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Approved highlight */}
                            <motion.div {...fadeUp(0.3)} className={`${card} p-6 flex flex-col justify-between`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        <h3 className="font-display font-semibold text-foreground">Approved</h3>
                                    </div>
                                    <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {report.approvedPaymentsCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        payments successfully approved
                                    </p>
                                </div>

                                <div className="mt-6 pt-5 border-t border-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approval Rate</p>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-2xl font-bold text-foreground">
                                            {report.totalPaymentsCount > 0
                                                ? Math.round((report.approvedPaymentsCount / report.totalPaymentsCount) * 100)
                                                : 0}%
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-1">of total payments</p>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                                            style={{
                                                width: `${report.totalPaymentsCount > 0
                                                    ? (report.approvedPaymentsCount / report.totalPaymentsCount) * 100
                                                    : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <motion.div {...fadeUp(0.34)} className="text-right text-xs text-muted-foreground">
                            Report generated at{" "}
                            {format(new Date(report.reportGeneratedAt), "MMMM d, yyyy 'at' h:mm a")}
                        </motion.div>
                    </div>
                )
            ) : null}
        </div>
    );
}
