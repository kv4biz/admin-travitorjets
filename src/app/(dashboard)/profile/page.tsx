/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/profile/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Eye, EyeOff } from "lucide-react";
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { profileSchema, ProfileInput, changePasswordSchema, ChangePasswordInput } from "@/lib/validations";
import { content } from "@/lib/content";

type ProfileData = {
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
};

type TabType = "profile" | "accounts";

// Helper to map Zod error codes to content keys
const getErrorMessage = (code: string, field?: string): string => {
  const messages: Record<string, string> = {
    fullNameMin: content.pages.profile.form.fullNameMin,
    fullNameMax: content.pages.profile.form.fullNameMax,
    usernameMin: content.pages.profile.form.usernameMin,
    usernameMax: content.pages.profile.form.usernameMax,
    usernameInvalidChars: content.pages.profile.form.usernameInvalidChars,
    phoneInvalid: content.pages.profile.form.phoneInvalid,
    currentRequired: content.pages.profile.form.currentRequired,
    newMinLength: content.pages.profile.form.newMinLength,
    confirmRequired: content.pages.profile.form.confirmRequired,
    passwordMismatch: content.pages.profile.form.passwordMismatch,
  };
  return messages[code] || "Invalid value";
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("profile");
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState<ProfileInput>({
    full_name: "",
    username: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState<ChangePasswordInput>({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Load profile
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: profileData } = await supabase.from("profiles").select("full_name, username, phone").eq("id", data.user.id).single();

      const merged = {
        full_name: profileData?.full_name ?? null,
        username: profileData?.username ?? null,
        phone: profileData?.phone ?? null,
        email: data.user.email ?? null,
      };

      setProfile(merged);
      setFormData({
        full_name: merged.full_name || "",
        username: merged.username || "",
        phone: merged.phone || "",
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  const getInitials = () => {
    if (profile?.full_name) {
      const parts = profile.full_name.split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    return profile?.email?.slice(0, 2).toUpperCase() ?? "??";
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!profile) return;

    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field) {
          fieldErrors[field] = getErrorMessage(issue.message);
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      // Username uniqueness check (if changed)
      if (formData.username !== profile.username) {
        const { data: existing } = await supabase.from("profiles").select("id").eq("username", formData.username).maybeSingle();
        if (existing) {
          setErrors({ username: content.pages.profile.form.usernameTaken });
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          username: formData.username || null,
          phone: formData.phone || null,
        })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setEditing(false);
      toast.success(content.pages.profile.form.profileUpdated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Change password using schema validation
  const handleChangePassword = async () => {
    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field) {
          fieldErrors[field] = getErrorMessage(issue.message);
        }
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    setPasswordErrors({});
    setSaving(true);
    try {
      // Verify current password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || "",
        password: passwordData.current,
      });
      if (signInError) {
        setPasswordErrors({ current: content.pages.profile.form.currentIncorrect });
        setSaving(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new,
      });
      if (updateError) throw updateError;

      toast.success(content.pages.profile.form.passwordUpdated);
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-4 md:p-6">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return <div className="h-full p-4 md:p-6 text-muted-foreground flex items-center justify-center">Unable to load profile.</div>;
  }

  return (
    <div className="h-full p-4 md:p-6">
      <Card className="w-full h-full overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Sidebar tabs */}
          <div className="border-b lg:border-b-0 lg:border-r lg:w-56 bg-muted/30 shrink-0">
            <div className="flex lg:hidden">
              {(["profile", "accounts"] as TabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "profile" ? content.pages.profile.tabs.profile : content.pages.profile.tabs.accounts}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex flex-col p-4 gap-1">
              {(["profile", "accounts"] as TabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    tab === t ? "bg-background shadow-sm font-medium" : "hover:bg-background/50"
                  }`}
                >
                  {t === "profile" ? content.pages.profile.tabs.profile : content.pages.profile.tabs.accounts}
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
            {tab === "profile" && (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{content.pages.profile.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{content.pages.profile.subtitle}</p>
                  </div>

                  <Button size="icon" variant="outline" onClick={() => setEditing(!editing)} disabled={editing}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>

                <FieldGroup className="max-w-xl space-y-4">
                  <Field data-invalid={!!errors.full_name}>
                    <FieldLabel>{content.pages.profile.form.fullName}</FieldLabel>
                    <FieldContent>
                      <Input
                        disabled={!editing}
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                      {errors.full_name && <FieldError errors={[{ message: errors.full_name }]} />}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors.username}>
                    <FieldLabel>{content.pages.profile.form.username}</FieldLabel>
                    <FieldContent>
                      <Input disabled={!editing} value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                      {errors.username && <FieldError errors={[{ message: errors.username }]} />}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{content.pages.profile.form.email}</FieldLabel>
                    <FieldContent>
                      <Input value={profile.email || ""} disabled className="bg-muted" />
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors.phone}>
                    <FieldLabel>{content.pages.profile.form.phone}</FieldLabel>
                    <FieldContent>
                      <Input disabled={!editing} value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      {errors.phone && <FieldError errors={[{ message: errors.phone }]} />}
                    </FieldContent>
                  </Field>
                </FieldGroup>

                {editing && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: profile.full_name || "",
                          username: profile.username || "",
                          phone: profile.phone || "",
                        });
                        setErrors({});
                      }}
                    >
                      {content.pages.profile.form.cancel}
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : content.pages.profile.form.saveChanges}
                    </Button>
                  </div>
                )}
              </>
            )}

            {tab === "accounts" && (
              <>
                <div>
                  <h2 className="text-xl font-semibold">{content.pages.profile.tabs.accounts}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{content.pages.profile.form.changePasswordSubtitle}</p>
                </div>

                <FieldGroup className="max-w-xl space-y-4">
                  <Field data-invalid={!!passwordErrors.current}>
                    <FieldLabel>{content.pages.profile.form.currentPassword}</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Input
                          type={showPassword.current ? "text" : "password"}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.current && <FieldError errors={[{ message: passwordErrors.current }]} />}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!passwordErrors.new}>
                    <FieldLabel>{content.pages.profile.form.newPassword}</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Input
                          type={showPassword.new ? "text" : "password"}
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.new && <FieldError errors={[{ message: passwordErrors.new }]} />}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!passwordErrors.confirm}>
                    <FieldLabel>{content.pages.profile.form.confirmPassword}</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Input
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwordData.confirm}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirm: e.target.value,
                            })
                          }
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword({
                              ...showPassword,
                              confirm: !showPassword.confirm,
                            })
                          }
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirm && <FieldError errors={[{ message: passwordErrors.confirm }]} />}
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? "Updating..." : content.pages.profile.form.updatePassword}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
