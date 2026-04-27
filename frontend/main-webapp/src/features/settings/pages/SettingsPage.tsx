import { useEffect, useState } from "react";
import { useRole } from "../../../hooks/useRole";
import { useLanguage, type Language } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/useToast";
import Icon from "../../../components/common/Icon";
import {
  createCompanyTag,
  deleteCompanyTag,
  listCompanyTags,
  updateCompanyTag,
  type ApiCompanyTag,
} from "../../../services/projectService";
import { Button } from "../../../components/common/Buttons/Button";

const DEFAULT_TAG_COLOR = "#64748B";

const normalizeTagColor = (rawColor: string): string => {
  const normalized = rawColor.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }
  return DEFAULT_TAG_COLOR;
};

type TabId = "general" | "workspace" | "security" | "notifications";

const tabs = [
  { id: "general", label: "General", icon: "settings" },
  { id: "workspace", label: "Workspace", icon: "workspaces" },
  { id: "security", label: "Security", icon: "security" },
  { id: "notifications", label: "Notifications", icon: "notifications_active" },
];

function SettingsSkeleton() {
  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div className="h-8 w-52 bg-neutral-200 rounded animate-pulse" />
      </div>
      <div className="flex mt-3 gap-6">
        <div className="w-64 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-neutral-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex-1 bg-white rounded-xl border border-neutral-100 shadow-sm p-6 space-y-4">
          <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-12 w-full bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-neutral-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isManager, isAuthLoading } = useRole();
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabId>("workspace");
  const [tags, setTags] = useState<ApiCompanyTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(DEFAULT_TAG_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(DEFAULT_TAG_COLOR);

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
      const created = await createCompanyTag({
        name,
        color: normalizeTagColor(draftColor),
      });
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setDraftName("");
      setDraftColor(DEFAULT_TAG_COLOR);
      showToast("Tag created", "success");
    } catch {
      showToast("Unable to create tag", "error");
    }
  };

  const handleStartEdit = (tag: ApiCompanyTag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingColor(normalizeTagColor(tag.color || DEFAULT_TAG_COLOR));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor(DEFAULT_TAG_COLOR);
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
      const updated = await updateCompanyTag(editingId, {
        name: nextName,
        color: normalizeTagColor(editingColor),
      });
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
    <div className="onfis-section h-full flex flex-col">
      <div className="navbar-style flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t("System Settings")}</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{t("Manage your system configurations and workspace preferences")}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-6 gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent"
                  }`}
              >
                <Icon name={tab.icon} size={20} color="currentColor" />
                {t(tab.label)}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-10 pr-2">
          {activeTab === "general" && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm animate-page-enter">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">{t("General Settings")}</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">{t("Company Name")}</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" defaultValue="Onfis Enterprise" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">{t("Timezone")}</label>
                    <select className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none">
                      <option>Asia/Ho_Chi_Minh (GMT+7)</option>
                      <option>America/New_York (GMT-5)</option>
                      <option>Europe/London (GMT+0)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">{t("Language")}</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    >
                      <option value="en">{t("English")}</option>
                      <option value="vi">{t("Vietnamese")}</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6 border-t border-neutral-100 flex justify-end">
                  <Button title={t("Save Changes")} style="primary" textStyle="body-4-medium" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "workspace" && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm animate-page-enter">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Tag Management</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage shared company tags used in Projects and Tasks</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="New tag name..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  maxLength={80}
                />
                <input
                  type="color"
                  value={draftColor}
                  onChange={(event) => setDraftColor(normalizeTagColor(event.target.value))}
                  aria-label="Tag color"
                  className="h-11 w-11 p-1 rounded-xl border border-neutral-200 bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                />
                <Button
                  title="Add Tag"
                  iconLeft={<Icon name="add" size={18} color="currentColor" />}
                  onClick={() => void handleCreate()}
                  style="primary"
                  textStyle="body-4-medium"
                />
              </div>

              <div className="space-y-3">
                {tags.length === 0 && (
                  <div className="px-3 py-10 text-sm text-neutral-500 border-2 border-dashed border-neutral-200 rounded-xl text-center bg-neutral-50/50">
                    <Icon name="local_offer" size={32} className="mx-auto mb-3 text-neutral-300" />
                    <p>No shared tags configured yet.</p>
                  </div>
                )}

                {tags.map((tag) => {
                  const isEditing = editingId === tag.id;
                  return (
                    <div key={tag.id} className="flex items-center gap-3 p-4 border border-neutral-200/80 rounded-xl bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                      <span
                        className="inline-block size-5 rounded-full border border-neutral-200 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: normalizeTagColor(tag.color || DEFAULT_TAG_COLOR) }}
                      />

                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="flex-1 px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                            maxLength={80}
                          />
                          <input
                            type="color"
                            value={editingColor}
                            onChange={(event) => setEditingColor(normalizeTagColor(event.target.value))}
                            aria-label="Edit tag color"
                            className="h-9 w-9 p-0.5 rounded-lg border border-neutral-200 bg-white cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 truncate">{tag.name}</p>
                          <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-wider">{normalizeTagColor(tag.color || DEFAULT_TAG_COLOR)}</p>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            title="Save"
                            onClick={() => void handleSaveEdit()}
                            style="primary"
                            textStyle="text-xs font-semibold"
                          />
                          <Button
                            title="Cancel"
                            onClick={handleCancelEdit}
                            style="sub"
                            textStyle="text-xs font-semibold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tag)}
                            className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon name="edit" size={18} color="currentColor" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(tag.id)}
                            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Icon name="delete" size={18} color="currentColor" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm animate-page-enter">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">Security Settings</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-neutral-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <Button title="Enable" style="sub" textStyle="body-4-medium" />
                </div>
                <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Change Password</h3>
                    <p className="text-xs text-neutral-500 mt-1">Update your password to keep your account secure.</p>
                  </div>
                  <Button title="Update" style="sub" textStyle="body-4-medium" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm animate-page-enter">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">Notification Preferences</h2>
              <div className="space-y-4 max-w-2xl">
                {[
                  { title: "Email Notifications", desc: "Receive emails for important updates and mentions." },
                  { title: "Push Notifications", desc: "Get real-time alerts in your browser." },
                  { title: "Weekly Digest", desc: "A weekly summary of your team's activity." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked={idx < 2} />
                      <div className="w-11 h-6 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
