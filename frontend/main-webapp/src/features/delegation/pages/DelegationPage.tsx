import { useState, useEffect } from "react";
import DelegationForm from "../components/DelegationForm";
import DelegationList from "../components/DelegationList";
import { delegationService, type ExecutiveRequest, type CreateExecutiveRequest } from "../services/delegationService";
import Icon from "../../../components/common/Icon";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Button } from "../../../components/common/Buttons/Button";

function DelegationSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse w-full h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-neutral-200 rounded mb-2" />
          <div className="h-4 w-64 bg-neutral-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded-xl" />
      </div>
      <div className="h-12 w-full bg-neutral-100 rounded-xl mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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
    return <DelegationSkeleton />;
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
          <Button
            title={t("Create New")}
            iconLeft={<Icon name="add" size={20} color="currentColor" />}
            onClick={() => setShowForm(true)}
            style="primary"
            textStyle="body-4-medium"
          />
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
