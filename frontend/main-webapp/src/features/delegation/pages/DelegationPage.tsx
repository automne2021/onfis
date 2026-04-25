import { useState, useEffect } from "react";
import DelegationForm from "../components/DelegationForm";
import DelegationList from "../components/DelegationList";
import { delegationService, type ExecutiveRequest, type CreateExecutiveRequest } from "../services/delegationService";
import Icon from "../../../components/common/Icon";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function DelegationPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ExecutiveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await delegationService.list();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load delegation requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: CreateExecutiveRequest) => {
    setIsSubmitting(true);
    try {
      const created = await delegationService.create(data);
      if (created) {
        setRequests((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create delegation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ExecutiveRequest["status"]) => {
    try {
      await delegationService.updateStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("Are you sure you want to delete this delegation?"))) return;
    try {
      await delegationService.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete delegation:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t("Delegation Hub")}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t("Manage and track executive directives")}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 btn-hover shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Icon name="add" size={20} color="currentColor" />
            {t("Create New")}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="animate-slideUp">
          <DelegationForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* List */}
      <DelegationList
        requests={requests}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
}
