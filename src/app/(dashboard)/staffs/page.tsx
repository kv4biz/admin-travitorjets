// src/app/(dashboard)/staffs/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ResizableLayout } from "@/components/dashboard/layouts/ResizableLayout";
import { ActionPanel } from "@/components/dashboard/layouts/ActionPanel";
import { TableRenderer, ColumnConfig } from "@/components/dashboard/tables/TableRenderer";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { ConfirmDialog } from "@/components/dashboard/dialogs/ConfirmDialog";
import { inviteStaffSchema, updateStaffRoleSchema } from "@/lib/validations/staff.schema";
import { content } from "@/lib/content";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/client";

type StaffMember = {
  id: string;
  username: string | null;
  full_name: string | null;
  role: "staff" | "manager";
  onboarding_completed: boolean;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function StaffPage() {
  const [mode, setMode] = useState<"create" | "edit" | "preview">("create");
  const [selectedRow, setSelectedRow] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const columns: ColumnConfig<StaffMember>[] = [
    {
      key: "username",
      label: content.pages.staff.columns.username || "Username",
      primary: true,
      render: (row) => row.username || "—",
    },
    {
      key: "full_name",
      label: content.pages.staff.columns.name || "Full Name",
      render: (row) => row.full_name || "—",
    },
    {
      key: "email",
      label: "Email",
      render: (row) => row.email || "—",
    },
    {
      key: "role",
      label: content.pages.staff.columns.role || "Role",
      render: (row) => row.role.charAt(0).toUpperCase() + row.role.slice(1),
    },
    {
      key: "onboarding_completed",
      label: content.pages.staff.columns.status || "Status",
      render: (row) => {
        const isActive = row.onboarding_completed === true;
        return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Pending"}</Badge>;
      },
    },
  ];

  // Invite fields
  const inviteFields: FormFieldConfig[] = [
    {
      name: "email",
      label: content.pages.staff.form.email || "Email",
      type: "text",
      required: true,
      placeholder: content.pages.staff.form.emailPlaceholder || "colleague@example.com",
    },
    {
      name: "role",
      label: content.pages.staff.form.role || "Role",
      type: "select",
      options: [
        { value: "staff", label: "Staff" },
        { value: "manager", label: "Manager" },
      ],
    },
  ];

  // Change Role fields
  const changeRoleFields: FormFieldConfig[] = [
    {
      name: "role",
      label: content.pages.staff.form.role || "Role",
      type: "select",
      required: true,
      options: [
        { value: "staff", label: "Staff" },
        { value: "manager", label: "Manager" },
      ],
    },
  ];

  // View / Preview fields
  const previewFields: FormFieldConfig[] = [
    { name: "username", label: "Username", type: "text" },
    { name: "full_name", label: "Full Name", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "role", label: "Role", type: "text" },
    { name: "status", label: "Status", type: "text" },
    { name: "created_at", label: "Registered", type: "text" },
    { name: "last_sign_in_at", label: "Last Login", type: "text" },
  ];

  const fields = mode === "create" ? inviteFields : mode === "edit" ? changeRoleFields : previewFields;
  const schema = mode === "create" ? inviteStaffSchema : updateStaffRoleSchema;

  const handleAdd = () => {
    setMode("create");
    setSelectedRow(null);
    setShowPanel(true);
  };

  const handleView = (row: StaffMember) => {
    setMode("preview");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleEdit = (row: StaffMember) => {
    if (row.id === currentUserId) {
      toast.error("You cannot change your own role.");
      return;
    }
    setMode("edit");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleDelete = (row: StaffMember) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/staffs/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(content.pages.staff.toast.deleted || "Staff member removed.");
        refreshTable();
        setDeleteTarget(null);
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.staff.toast.error || "Failed to delete.");
      }
    } catch {
      toast.error(content.pages.staff.toast.error || "Something went wrong.");
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (mode === "create") {
      const res = await fetch("/api/staffs/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success(content.pages.staff.toast.inviteSent || "Invitation sent!");
        setShowPanel(false);
        refreshTable();
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.staff.toast.error || "Failed to send invitation.");
      }
    } else {
      const res = await fetch(`/api/staffs/${selectedRow?.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success(content.pages.staff.toast.roleUpdated || "Role updated.");
        setShowPanel(false);
        refreshTable();
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.staff.toast.error || "Failed to update role.");
      }
    }
  };

  const defaultValues = useMemo(() => {
    if (!selectedRow) return { email: "", role: "staff" };

    if (mode === "edit") {
      return { role: selectedRow.role };
    }

    if (mode === "preview") {
      return {
        username: selectedRow.username || "—",
        full_name: selectedRow.full_name || "—",
        email: selectedRow.email || "—",
        phone: selectedRow.phone || "—",
        role: selectedRow.role.charAt(0).toUpperCase() + selectedRow.role.slice(1),
        status: selectedRow.onboarding_completed ? "Active" : "Pending",
        created_at: selectedRow.created_at ? new Date(selectedRow.created_at).toLocaleDateString() : "—",
        last_sign_in_at: selectedRow.last_sign_in_at ? new Date(selectedRow.last_sign_in_at).toLocaleDateString() : "Never",
      };
    }

    return { email: "", role: "staff" };
  }, [mode, selectedRow]);

  return (
    <div className="space-y-4">
      <ResizableLayout
        showPanel={showPanel}
        table={
          <TableRenderer<StaffMember>
            endpoint="/api/staffs"
            columns={columns}
            searchFields={["username", "full_name", "email"]}
            showAddButton
            addButtonLabel={content.pages.staff.addButton || "Invite Staff"}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pageSize={20}
            refreshKey={refreshKey}
            showSearch={false} // 👈 search bar hidden
            sortableFields={["username", "full_name", "email", "role", "created_at"]}
            filterableFields={[
              {
                key: "role",
                label: content.pages.staff.columns.role || "Role",
                options: [
                  { label: "Staff", value: "staff" },
                  { label: "Manager", value: "manager" },
                ],
              },
            ]}
            canEdit={(row) => row.id !== currentUserId}
            canDelete={(row) => row.id !== currentUserId}
          />
        }
        panel={
          mode === "preview" ? (
            <ActionPanel title="Staff Details" onCancel={() => setShowPanel(false)}>
              <FormRenderer
                key={`preview-${selectedRow?.id}`}
                schema={z.object({})}
                fields={fields}
                defaultValues={defaultValues}
                onSubmit={async () => {}}
                submitLabel=""
                onCancel={() => setShowPanel(false)}
                disabled={true}
              />
            </ActionPanel>
          ) : (
            <ActionPanel
              title={
                mode === "create" ? content.pages.staff.form.inviteTitle || "Invite Staff" : content.pages.staff.form.changeRoleTitle || "Change Role"
              }
              onCancel={() => setShowPanel(false)}
            >
              <FormRenderer
                key={`${mode}-${selectedRow?.id ?? "new"}`}
                schema={schema}
                fields={fields}
                defaultValues={defaultValues}
                onSubmit={onSubmit}
                submitLabel={
                  mode === "create" ? content.pages.staff.form.sendInvite || "Send Invite" : content.pages.staff.form.updateRole || "Update Role"
                }
                onCancel={() => setShowPanel(false)}
                onSuccess={() => setShowPanel(false)}
              />
            </ActionPanel>
          )
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Staff"
        description={content.pages.staff.confirmDelete || "Are you sure you want to remove this staff member? This action cannot be undone."}
      />
    </div>
  );
}
