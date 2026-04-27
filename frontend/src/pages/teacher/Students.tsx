import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAllStudents } from "@/lib/api";
import type { Student } from "@/lib/api";

export default function Students() {
  const { data: students = [], isLoading } = useAllStudents();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    if (search && !s.user.name.toLowerCase().includes(search.toLowerCase()) && !s.studentId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground mt-1">{students.length} students enrolled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="pl-10 bg-secondary border-border" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">School</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {s.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.user.name}</p>
                        <p className="text-xs text-muted-foreground">{s.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.studentId}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.school || "–"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.batch || "–"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.user.isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    }`}>
                      {s.user.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(s)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedStudent?.user.name}</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                  {selectedStudent.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedStudent.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.studentId} · {selectedStudent.batch || "No batch"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{selectedStudent.user.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{selectedStudent.user.phoneNumber || "–"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="text-sm text-foreground">{selectedStudent.school || "–"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Parent</p>
                  <p className="text-sm text-foreground">{selectedStudent.parentName || "–"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
