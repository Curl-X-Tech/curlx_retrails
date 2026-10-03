import * as React from "react";
import type { Role } from "@/api/users";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { FormDialog } from "@/components/shared";
import { UserFormFields } from "./user-form-fields";

export interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    email: string;
    password: string;
    user_type: Role;
    department: string;
    phone: string;
    location: string;
    is_active: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function UserCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: UserCreateDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("dispatcher");
  const [department, setDepartment] = React.useState("Operations");
  const [phone, setPhone] = React.useState("+94 77 ");
  const [location, setLocation] = React.useState("Kelaniya Hub (HUB-01)");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("dispatcher");

      setDepartment("Operations");
      setPhone("+94 77 ");
      setLocation("Kelaniya Hub (HUB-01)");
      setFormError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("Name, email, and password (min 8 chars) are required.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        user_type: role,
        department,
        phone,
        location,
        is_active: true,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    }
  };

  return (
    <FormDialog
      title="Provision New User Account"
      description="Register a team member under an enterprise role with strict RBAC credentials."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create Account"
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
        passwordRequired
        role={role}
        onRoleChange={setRole}
        department={department}
        onDepartmentChange={setDepartment}
        phone={phone}
        onPhoneChange={setPhone}
        location={location}
        onLocationChange={setLocation}
      />
    </FormDialog>
  );
}
