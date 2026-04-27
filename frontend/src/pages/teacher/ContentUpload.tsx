import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, Eye, Plus, Pencil, BookOpen, ChevronDown, ChevronRight, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useCourses, useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson,
  useMaterials, useUploadMaterial, useDeleteMaterial, useUpdateMaterial, getMaterialDownloadUrl,
  type Lesson, type LearningMaterial,
} from "@/lib/api";

/* ──────── Lessons with inline Resources ──────── */
function LessonsWithResources({ lessons, materials, loadingMaterials, onEditLesson, onDeleteLesson, onEditMaterial, onDeleteMaterial }: {
  lessons: Lesson[];
  materials: LearningMaterial[];
  loadingMaterials: boolean;
  onEditLesson: (l: Lesson) => void;
  onDeleteLesson: (id: number) => void;
  onEditMaterial: (m: LearningMaterial) => void;
  onDeleteMaterial: (id: number) => void;
}) {
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

  // Group materials by lesson id
  const materialsByLesson = useMemo(() => {
    const map: Record<number, LearningMaterial[]> = {};
    for (const m of materials) {
      const lid = m.lesson?.id;
      if (lid) {
        if (!map[lid]) map[lid] = [];
        map[lid].push(m);
      }
    }
    return map;
  }, [materials]);

  const toggleLesson = (id: number) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Lessons ({lessons.length})</h2>
        </div>
      </div>
      {lessons.length === 0 ? (
        <div className="p-8 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No lessons yet. Create your first lesson to start uploading materials.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {lessons.map((l, i) => {
            const isOpen = expandedLessons.has(l.id);
            const lessonMaterials = materialsByLesson[l.id] || [];
            return (
              <div key={l.id}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => toggleLesson(l.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-primary shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                        {l.month && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">{l.month}</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                          {lessonMaterials.length} resource{lessonMaterials.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {l.content && <p className="text-xs text-muted-foreground truncate mt-0.5">{l.content}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => onEditLesson(l)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteLesson(l.id)} className="text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>

                {/* Expanded resources under this lesson */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-secondary/30">
                      {loadingMaterials ? (
                        <p className="px-10 py-3 text-xs text-muted-foreground">Loading resources...</p>
                      ) : lessonMaterials.length === 0 ? (
                        <div className="px-10 py-4 text-center">
                          <p className="text-xs text-muted-foreground">No resources uploaded for this lesson yet.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {lessonMaterials.map((m) => (
                            <div key={m.id} className="flex items-center gap-3 px-10 py-2.5 hover:bg-accent/20 transition-colors">
                              <FileText className="h-4 w-4 text-red-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                                <p className="text-[10px] text-muted-foreground">{m.type}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <a href={m.type === "LINK" ? m.url : getMaterialDownloadUrl(m.id)} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                                </a>
                                <Button variant="ghost" size="sm" onClick={() => onEditMaterial(m)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => onDeleteMaterial(m.id)} className="text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ContentUpload() {
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const { data: lessons = [] } = useLessons(selectedCourseId);
  const { data: materials = [], isLoading: loadingMaterials } = useMaterials(selectedCourseId);
  const uploadMaterial = useUploadMaterial();
  const deleteMaterial = useDeleteMaterial();
  const updateMaterial = useUpdateMaterial();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // Upload dialog
  const [showUpload, setShowUpload] = useState(false);
  const [newRes, setNewRes] = useState({ title: "", type: "PDF", lessonId: 0, linkUrl: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lesson dialogs
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: "", content: "", month: "" });
  const [showEditLesson, setShowEditLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Edit material dialog
  const [showEditMaterial, setShowEditMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (!newRes.title) { toast.error("Please enter a title"); return; }
    if (!newRes.lessonId) { toast.error("Please select a lesson"); return; }
    if (newRes.type === "LINK") {
      if (!newRes.linkUrl) { toast.error("Please enter a URL"); return; }
    } else {
      if (!selectedFile) { toast.error("Please select a file"); return; }
    }
    uploadMaterial.mutate(
      { lessonId: newRes.lessonId, title: newRes.title, type: newRes.type, file: selectedFile || undefined, linkUrl: newRes.type === "LINK" ? newRes.linkUrl : undefined },
      {
        onSuccess: () => {
          setNewRes({ title: "", type: "PDF", lessonId: 0, linkUrl: "" });
          setSelectedFile(null);
          setShowUpload(false);
          toast.success("Resource uploaded successfully!");
        },
        onError: () => toast.error("Upload failed"),
      },
    );
  };

  const handleAddLesson = () => {
    if (!newLesson.title || !selectedCourseId) { toast.error("Please enter a lesson title"); return; }
    if (!newLesson.month) { toast.error("Please select a month"); return; }
    createLesson.mutate(
      { courseId: selectedCourseId, title: newLesson.title, content: newLesson.content, month: newLesson.month },
      {
        onSuccess: () => {
          setNewLesson({ title: "", content: "", month: "" });
          setShowAddLesson(false);
          toast.success("Lesson created!");
        },
        onError: () => toast.error("Failed to create lesson"),
      },
    );
  };

  const handleEditLesson = () => {
    if (!editingLesson) return;
    updateLesson.mutate(
      { id: editingLesson.id, title: editingLesson.title, content: editingLesson.content, month: editingLesson.month },
      {
        onSuccess: () => {
          setEditingLesson(null);
          setShowEditLesson(false);
          toast.success("Lesson updated!");
        },
        onError: () => toast.error("Failed to update lesson"),
      },
    );
  };

  const handleDeleteLesson = (id: number) => {
    deleteLesson.mutate(id, {
      onSuccess: () => toast.success("Lesson deleted"),
      onError: () => toast.error("Failed to delete lesson"),
    });
  };

  const handleDeleteMaterial = (id: number) => {
    deleteMaterial.mutate(id, {
      onSuccess: () => toast.success("Material deleted"),
      onError: () => toast.error("Failed to delete material"),
    });
  };

  const handleEditMaterial = () => {
    if (!editingMaterial) return;
    if (editingMaterial.type === "LINK" && !editLinkUrl) { toast.error("Please enter a URL"); return; }
    updateMaterial.mutate(
      { id: editingMaterial.id, title: editingMaterial.title, type: editingMaterial.type, file: editFile || undefined, linkUrl: editingMaterial.type === "LINK" ? editLinkUrl : undefined },
      {
        onSuccess: () => {
          setEditingMaterial(null);
          setEditFile(null);
          setEditLinkUrl("");
          setShowEditMaterial(false);
          toast.success("Material updated!");
        },
        onError: () => toast.error("Failed to update material"),
      },
    );
  };

  if (loadingCourses) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Content & Resources</h1>
          <p className="text-muted-foreground mt-1">Manage lessons and upload study materials</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddLesson(true)} variant="outline" disabled={!selectedCourseId}>
            <Plus className="h-4 w-4 mr-1" /> Add Lesson
          </Button>
          <Button onClick={() => setShowUpload(true)} className="gradient-cta text-primary-foreground" disabled={!selectedCourseId || lessons.length === 0}>
            <Upload className="h-4 w-4 mr-1" /> Upload Resource
          </Button>
        </div>
      </div>

      {/* Course selector */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={selectedCourseId ? String(selectedCourseId) : ""} onValueChange={(v) => setSelectedCourseId(Number(v))}>
          <SelectTrigger className="w-64 bg-secondary border-border"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedCourseId ? (
        <div className="rounded-xl bg-card border border-border p-10 shadow-card text-center">
          <p className="text-muted-foreground">Select a course above to view its lessons and materials.</p>
        </div>
      ) : (
        <>
          {/* ─── Lessons with Resources ─── */}
          <LessonsWithResources
            lessons={lessons}
            materials={materials}
            loadingMaterials={loadingMaterials}
            onEditLesson={(l) => { setEditingLesson({ ...l }); setShowEditLesson(true); }}
            onDeleteLesson={handleDeleteLesson}
            onEditMaterial={(m) => { setEditingMaterial({ ...m }); setEditLinkUrl(m.type === "LINK" ? m.url : ""); setShowEditMaterial(true); }}
            onDeleteMaterial={handleDeleteMaterial}
          />
        </>
      )}

      {/* ─── Upload Resource Dialog ─── */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Upload Resource</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Lesson</label>
              <Select value={newRes.lessonId ? String(newRes.lessonId) : ""} onValueChange={(v) => setNewRes({ ...newRes, lessonId: Number(v) })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a lesson" /></SelectTrigger>
                <SelectContent>
                  {lessons.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
              <Input value={newRes.title} onChange={(e) => setNewRes({ ...newRes, title: e.target.value })} placeholder="Resource title" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
              <Select value={newRes.type} onValueChange={(v) => setNewRes({ ...newRes, type: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="LINK">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRes.type === "LINK" ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">URL</label>
                <Input value={newRes.linkUrl} onChange={(e) => setNewRes({ ...newRes, linkUrl: e.target.value })} placeholder="https://example.com/resource" className="bg-secondary border-border" />
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                {selectedFile ? (
                  <p className="text-sm text-foreground">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PNG, JPG, MP4 up to 500MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
            )}
            <Button onClick={handleUpload} disabled={uploadMaterial.isPending} className="w-full gradient-cta text-primary-foreground">
              {uploadMaterial.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add Lesson Dialog ─── */}
      <Dialog open={showAddLesson} onOpenChange={setShowAddLesson}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Create Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
              <Input value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} placeholder="Lesson title" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Month</label>
              <Input type="month" value={newLesson.month} onChange={(e) => setNewLesson({ ...newLesson, month: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Content / Description</label>
              <Textarea value={newLesson.content} onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })} placeholder="Optional description or notes" className="bg-secondary border-border min-h-[100px]" />
            </div>
            <Button onClick={handleAddLesson} disabled={createLesson.isPending} className="w-full gradient-cta text-primary-foreground">
              {createLesson.isPending ? "Creating..." : "Create Lesson"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Lesson Dialog ─── */}
      <Dialog open={showEditLesson} onOpenChange={setShowEditLesson}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Lesson</DialogTitle></DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                <Input value={editingLesson.title} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Month</label>
                <Input type="month" value={editingLesson.month || ""} onChange={(e) => setEditingLesson({ ...editingLesson, month: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Content / Description</label>
                <Textarea value={editingLesson.content || ""} onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })} className="bg-secondary border-border min-h-[100px]" />
              </div>
              <Button onClick={handleEditLesson} disabled={updateLesson.isPending} className="w-full gradient-cta text-primary-foreground">
                {updateLesson.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Edit Material Dialog ─── */}
      <Dialog open={showEditMaterial} onOpenChange={(open) => { setShowEditMaterial(open); if (!open) { setEditFile(null); setEditLinkUrl(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Material</DialogTitle></DialogHeader>
          {editingMaterial && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                <Input value={editingMaterial.title} onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                <Select value={editingMaterial.type} onValueChange={(v) => setEditingMaterial({ ...editingMaterial, type: v as LearningMaterial["type"] })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="LINK">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingMaterial.type === "LINK" ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">URL</label>
                  <Input value={editLinkUrl} onChange={(e) => setEditLinkUrl(e.target.value)} placeholder="https://example.com/resource" className="bg-secondary border-border" />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Replace File (optional)</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => editFileInputRef.current?.click()}>
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    {editFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm text-foreground">{editFile.name}</p>
                        <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEditFile(null); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Click to choose a new file</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Leave empty to keep the current file</p>
                      </>
                    )}
                    <input ref={editFileInputRef} type="file" className="hidden" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              )}
              <Button onClick={handleEditMaterial} disabled={updateMaterial.isPending} className="w-full gradient-cta text-primary-foreground">
                {updateMaterial.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
