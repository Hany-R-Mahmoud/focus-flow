import { useEffect, useState } from "react";
import {
  getTemplates,
  deleteTemplate,
  SessionTemplate,
  createTemplate,
  updateTemplate,
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/time";
import { toast } from "sonner";

export default function SessionTemplates() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 25,
    description: "",
    color: "#0891b2",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const data = await getTemplates();
    setTemplates(data);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      if (editingId) {
        await updateTemplate(editingId, formData);
        toast.success("Template updated");
      } else {
        await createTemplate(formData);
        toast.success("Template created");
      }
      setFormData({
        name: "",
        duration: 25,
        description: "",
        color: "#0891b2",
      });
      setEditingId(null);
      setIsOpen(false);
      loadTemplates();
    } catch (err) {
      toast.error("Failed to save template");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
      loadTemplates();
    } catch (err) {
      toast.error("Failed to delete template");
    }
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Session Templates
        </h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  duration: 25,
                  description: "",
                  color: "#0891b2",
                });
              }}
            >
              <Plus size={18} />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Template" : "Create Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Deep Work"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 25,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What is this template for?"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={e =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={e =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <Button
                className="w-full bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
                onClick={handleSave}
              >
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card
            key={template.id}
            className="p-6 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: template.color, borderLeftWidth: "4px" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(template.duration)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(template.id)}
                aria-label={`Delete ${template.name} template`}
              >
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>
            <Button
              className="w-full bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={() => {
                setEditingId(template.id);
                setFormData({
                  name: template.name,
                  duration: template.duration,
                  description: template.description,
                  color: template.color,
                });
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
