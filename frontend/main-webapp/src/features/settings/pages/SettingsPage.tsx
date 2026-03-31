import { useEffect, useState } from "react";
import { useRole } from "../../../hooks/useRole";
import { useToast } from "../../../contexts/useToast";
import {
  createCompanyTag,
  deleteCompanyTag,
  listCompanyTags,
  updateCompanyTag,
  type ApiCompanyTag,
} from "../../../services/projectService";

function SettingsSkeleton() {
  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div className="h-8 w-52 bg-neutral-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 mt-3 space-y-3">
        <div className="h-5 w-36 bg-neutral-200 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-11 w-full bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isManager, isAuthLoading } = useRole();
  const { showToast } = useToast();

  const [tags, setTags] = useState<ApiCompanyTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await listCompanyTags();
        setTags(data);
      } catch {
        showToast("Unable to load company tags", "error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isAuthLoading, showToast]);

  const handleCreate = async () => {
    const name = draftName.trim();
    if (!name) {
      return;
    }

    try {
      const created = await createCompanyTag({ name });
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setDraftName("");
      showToast("Tag created", "success");
    } catch {
      showToast("Unable to create tag", "error");
    }
  };

  const handleStartEdit = (tag: ApiCompanyTag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) {
      return;
    }

    const nextName = editingName.trim();
    if (!nextName) {
      return;
    }

    try {
      const updated = await updateCompanyTag(editingId, { name: nextName });
      setTags((prev) => prev.map((tag) => (tag.id === updated.id ? updated : tag)));
      handleCancelEdit();
      showToast("Tag updated", "success");
    } catch {
      showToast("Unable to update tag", "error");
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteCompanyTag(tagId);
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      showToast("Tag deleted", "success");
    } catch {
      showToast("Unable to delete tag", "error");
    }
  };

  if (isAuthLoading || loading) {
    return <SettingsSkeleton />;
  }

  if (!isManager) {
    return (
      <div className="onfis-section">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 text-center mt-3">
          <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-500 mt-2">Only manager accounts can manage company settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage shared company tags used in Projects and Tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 mt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-900">Tag Management</h2>
          <div className="flex items-center gap-2">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="New tag name"
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary"
              maxLength={80}
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Tag
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {tags.length === 0 && (
            <div className="px-3 py-8 text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-lg text-center">
              No shared tags configured yet.
            </div>
          )}

          {tags.map((tag) => {
            const isEditing = editingId === tag.id;
            return (
              <div key={tag.id} className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                {isEditing ? (
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary"
                    maxLength={80}
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-neutral-800">{tag.name}</span>
                )}

                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(tag)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(tag.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
