import * as React from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { FormDialog } from "@/components/shared";
import type { MockUserWithMeta } from "@/data/mock-users";
import { UserFormFields } from "./user-form-fields";

export interface UserEditDialogProps {
  user: MockUserWithMeta | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    password?: string;
    user_type: string;
    department: string;
    phone: string;
    location: string;
    is_active: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function UserEditDialog({
  user,
  onClose,
  onSubmit,
  isSubmitting = false,
}: UserEditDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("dispatcher");
  const [department, setDepartment] = React.useState("Operations");
  const [phone, setPhone] = React.useState("+94 77 ");
  const [location, setLocation] = React.useState("Kelaniya Hub (HUB-01)");
  const [active, setActive] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword("");
      setRole(user.user_type);
      setDepartment(user.department);
      setPhone(user.phone);
      setLocation(user.location);
      setActive(user.is_active);
      setFormError(null);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password.length >= 8 ? password : undefined,
        user_type: role,
        department,
        phone,
        location,
        is_active: active,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to update user.");
    }
  };

  return (
    <FormDialog
      title="Modify Personnel Account"
      description="Update user details, assign enterprise roles, or modify account status."
      isOpen={!!user}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      className="sm:max-w-md"
    >
      {formError && (
        <div className="p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <WarningCircleIcon className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <UserFormFields
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        passwordPlaceholder="New password (min 8 chars)"
        passwordLabel="Reset Password (leave empty to keep current)"
        role={role}
        onRoleChange={setRole}
        department={department}
        onDepartmentChange={setDepartment}
        phone={phone}
        onPhoneChange={setPhone}
        location={location}
        onLocationChange={setLocation}
        active={active}
        onActiveChange={setActive}
        showActiveCheckbox
      />
    </FormDialog>
  );
}
