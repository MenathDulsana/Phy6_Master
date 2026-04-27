import { useState } from "react";
import { useTeacherFinancialSummary } from "@/lib/api/teacher-financial";
import { Calendar, DollarSign, Activity, FileWarning, CheckCircle, Users, Clock, Hash } from "lucide-react";

export default function TeacherFinancialSummary() {
    const defaultMonth = new Date().getMonth() + 1;
    const defaultYear = new Date().getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedYear, setSelectedYear] = useState(defaultYear);

    // Initial load uses latest, user changing dropdown uses specific
    const { data: report, isLoading, isError, isFetching } = useTeacherFinancialSummary(selectedMonth, selectedYear);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
    };

    return (
        <div className="rounded-xl bg-card border border-border p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" /> Platform Financial Summary
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">

                    </p>
                </div>
                
                <div className="flex items-center space-x-2 bg-secondary/50 p-1.5 rounded-lg border border-border">
                    <Calendar className="w-4 h-4 text-muted-foreground ml-1" />
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 p-1"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <input 
                        type="number" 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 p-1 w-16"
                        min="2020" max="2100"
                    />
                </div>
            </div>

            {isLoading || isFetching ? (
               <p className="text-sm text-muted-foreground">Loading specific financial scope...</p>
            ) : isError ? (
               <p className="text-sm text-destructive font-medium">Failed to load platform financials.</p>
            ) : report && report.totalPaymentsCount === 0 && report.enrollmentCount === 0 ? (
               <div className="py-8 text-center bg-secondary/30 rounded-lg border border-border/50">
                   <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground font-medium">No financial summary is currently available.</p>
                   <p className="text-xs text-muted-foreground/60 mt-1">Zero platform activity found for {months[selectedMonth - 1]} {selectedYear}.</p>
               </div>
            ) : report ? (
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="col-span-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-5 border border-emerald-200 dark:border-emerald-500/20 shadow-sm align-middle flex flex-col justify-center">
                       <p className="text-emerald-700 dark:text-emerald-400 font-medium tracking-wide text-[10px] uppercase mb-1">Total Fees Collected</p>
                       <h3 className="text-3xl font-display font-bold text-emerald-950 dark:text-emerald-50">{formatCurrency(report.totalFeesCollected || 0)}</h3>
                   </div>

                   <div className="bg-secondary/50 border border-border rounded-lg p-4 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                           <Users className="w-4 h-4 text-primary" />
                           <p className="text-xs font-semibold uppercase tracking-wider">Enrollments</p>
                       </div>
                       <p className="text-xl font-bold text-foreground">{report.enrollmentCount}</p>
                   </div>

                   <div className="bg-secondary/50 border border-border rounded-lg p-4 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                           <Hash className="w-4 h-4 text-muted-foreground" />
                           <p className="text-xs font-semibold uppercase tracking-wider">Total Payments</p>
                       </div>
                       <p className="text-xl font-bold text-foreground">{report.totalPaymentsCount}</p>
                   </div>

                   <div className="bg-secondary/50 border border-border rounded-lg p-4 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                           <CheckCircle className="w-4 h-4 text-emerald-500" />
                           <p className="text-xs font-semibold uppercase tracking-wider">Approved</p>
                       </div>
                       <p className="text-xl font-bold text-foreground">{report.approvedPaymentsCount}</p>
                   </div>

                   <div className="bg-secondary/50 border border-border rounded-lg p-4 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                           <Clock className="w-4 h-4 text-amber-500" />
                           <p className="text-xs font-semibold uppercase tracking-wider">Pending</p>
                       </div>
                       <p className="text-xl font-bold text-foreground">{report.pendingPaymentsCount}</p>
                   </div>

                   <div className="bg-secondary/50 border border-border rounded-lg p-4 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                           <FileWarning className="w-4 h-4 text-destructive" />
                           <p className="text-xs font-semibold uppercase tracking-wider">Rejected</p>
                       </div>
                       <p className="text-xl font-bold text-foreground">{report.rejectedPaymentsCount}</p>
                   </div>
               </div>
            ) : null}
            
            {report && (
                <div className="mt-4 pt-3 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
                    <span className="flex gap-2">Read-Only Mode Enabled {report.readOnly && <CheckCircle className="w-3 h-3 text-primary"/>}</span>
                    <span>
                        Last Refreshed: {report.generatedAt
                            ? new Date(report.generatedAt).toLocaleString()
                            : new Date().toLocaleTimeString()}
                    </span>
                </div>
            )}
        </div>
    )
}
