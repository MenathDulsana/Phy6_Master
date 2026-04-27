import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, BookOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, type Course } from "@/lib/api";

const SUBJECTS = ["Physics"];
const BATCHES = ["2026 A/L", "2027 A/L", "2028 A/L"];
const TYPES = ["Theory", "Revision", "Paper"];

export default function ClassManagement() {
  const teacherId = Number(localStorage.getItem("authUserId")) || 0;
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [showAdd, setShowAdd] = useState(false);
  const [newClass, setNewClass] = useState({ title: "", description: "", subject: "", batch: "", type: "", imageUrl: "" });

  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleAdd = () => {
    if (!newClass.title) {
      toast.error("Please enter a title");
      return;
    }
    createCourse.mutate({ ...newClass, teacherId }, {
      onSuccess: () => {
        setNewClass({ title: "", description: "", subject: "", batch: "", type: "", imageUrl: "" });
        setShowAdd(false);
        toast.success("Class added successfully!");
      },
      onError: () => toast.error("Failed to add class"),
    });
  };

  const handleEdit = () => {
    if (!editingCourse) return;
    updateCourse.mutate(
      { id: editingCourse.id, title: editingCourse.title, description: editingCourse.description, subject: editingCourse.subject, batch: editingCourse.batch, type: editingCourse.type, imageUrl: editingCourse.imageUrl },
      {
        onSuccess: () => {
          setEditingCourse(null);
          setShowEdit(false);
          toast.success("Class updated!");
        },
        onError: () => toast.error("Failed to update class"),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteCourse.mutate(id, {
      onSuccess: () => toast.success("Class removed"),
      onError: () => toast.error("Failed to delete class"),
    });
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading classes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your courses ({courses.length} total)
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="gradient-cta shrink-0 rounded-lg px-5 font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Class
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No classes yet. Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex min-h-[180px] flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-4 flex w-full items-start justify-between gap-2">
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                  {cls.subject || "Physics"}
                </span>
                {cls.batch && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {cls.batch}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold leading-snug text-foreground">{cls.title}</h3>
              {cls.description && (
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{cls.description}</p>
              )}
              <div className="mt-auto flex gap-1 pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditingCourse({ ...cls });
                    setShowEdit(true);
                  }}
                  aria-label="Edit class"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(cls.id)}
                  aria-label="Delete class"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Add New Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
              <Input value={newClass.title} onChange={(e) => setNewClass({ ...newClass, title: e.target.value })} placeholder="e.g., Physics-2028 Theory" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Location / note</label>
              <Input value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} placeholder="e.g., Gampaha, Nugegoda" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
                <Select value={newClass.subject} onValueChange={(v) => setNewClass({ ...newClass, subject: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Batch</label>
                <Select value={newClass.batch} onValueChange={(v) => setNewClass({ ...newClass, batch: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BATCHES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
              <Select value={newClass.type} onValueChange={(v) => setNewClass({ ...newClass, type: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Cover image (link)</label>
              <Input value={newClass.imageUrl} onChange={(e) => setNewClass({ ...newClass, imageUrl: e.target.value })} placeholder="https://…/photo.jpg" className="bg-secondary border-border" />
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Paste a direct HTTPS link to a .jpg or .png file. This app does not upload files from your device; the picture must already be hosted online.
              </p>
            </div>
            <Button onClick={handleAdd} disabled={createCourse.isPending} className="w-full gradient-cta text-primary-foreground">
              {createCourse.isPending ? "Adding..." : "Add Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Class</DialogTitle></DialogHeader>
          {editingCourse && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                <Input value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Location / note</label>
                <Input value={editingCourse.description || ""} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
                  <Select value={editingCourse.subject || ""} onValueChange={(v) => setEditingCourse({ ...editingCourse, subject: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Batch</label>
                  <Select value={editingCourse.batch || ""} onValueChange={(v) => setEditingCourse({ ...editingCourse, batch: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BATCHES.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                <Select value={editingCourse.type || ""} onValueChange={(v) => setEditingCourse({ ...editingCourse, type: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Cover image (link)</label>
                <Input value={editingCourse.imageUrl || ""} onChange={(e) => setEditingCourse({ ...editingCourse, imageUrl: e.target.value })} className="bg-secondary border-border" placeholder="https://…/photo.jpg" />
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Direct image URL only (not a file upload). If the card shows “link failed”, the host may block hotlinking—try another image host.
                </p>
              </div>
              <Button onClick={handleEdit} disabled={updateCourse.isPending} className="w-full gradient-cta text-primary-foreground">
                {updateCourse.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
