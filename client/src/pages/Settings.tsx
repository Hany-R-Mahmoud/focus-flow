import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { exportData, importData, clearAllData } from "@/lib/db";
import { toast } from "sonner";
import { Download, Upload, Trash2 } from "lucide-react";

export default function Settings() {
  async function handleExport() {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focussessionflow-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error("Failed to export data");
    }
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        toast.success("Data imported successfully");
      } catch (err) {
        toast.error("Failed to import data");
      }
    };
    input.click();
  }

  async function handleClear() {
    if (confirm("Are you sure? This will delete all data.")) {
      try {
        await clearAllData();
        toast.success("All data cleared");
      } catch (err) {
        toast.error("Failed to clear data");
      }
    }
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Data Management</h2>
        <div className="space-y-3">
          <div>
            <Label className="block mb-2">Export Your Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your sessions, templates, and reviews as a JSON file.
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleExport}
            >
              <Download size={18} />
              Export Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">Import Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Import previously exported data or data from another device.
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleImport}
            >
              <Upload size={18} />
              Import Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">Clear All Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete all sessions, templates, and reviews. This cannot be undone.
            </p>
            <Button
              className="gap-2 bg-destructive hover:bg-red-700 text-white"
              onClick={handleClear}
            >
              <Trash2 size={18} />
              Clear All Data
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>FocusSessionFlow</strong> v1.0.0
        </p>
        <p className="text-sm text-muted-foreground">
          An offline-first focus session planner for students, freelancers, and knowledge workers.
        </p>
      </Card>
    </div>
  );
}
