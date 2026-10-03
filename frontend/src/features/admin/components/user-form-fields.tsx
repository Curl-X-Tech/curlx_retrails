import type { Role } from "@/api/users";
import { Input } from "@/components/ui/input";
import { UserRoleOrgFields } from "./user-role-org-fields";

export interface UserFormFieldsProps {
  name: string;
  onNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  passwordPlaceholder?: string;
  passwordRequired?: boolean;
  passwordLabel?: string;
  role: Role;
  onRoleChange: (val: Role) => void;
  department: string;
  onDepartmentChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
  active?: boolean;
  onActiveChange?: (val: boolean) => void;
  showActiveCheckbox?: boolean;
}

export function UserFormFields({
  name,
  onNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordPlaceholder = "Password",
  passwordRequired = false,
  passwordLabel = "Initial Password (min 8 chars)",
  role,
  onRoleChange,
  department,
  onDepartmentChange,
  phone,
  onPhoneChange,
  location,
  onLocationChange,
  active = true,
  onActiveChange,
  showActiveCheckbox = false,
}: UserFormFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground">Full Name</label>
        <Input
          placeholder="e.g. Kasun Fernando"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-8 text-xs"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground">
          Corporate Email
        </label>
        <Input
          type="email"
          placeholder="e.g. kasun@retrails.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-8 text-xs"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground">
          {passwordLabel}
        </label>
        <Input
          type="password"
          placeholder={passwordPlaceholder}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="h-8 text-xs"
          required={passwordRequired}
        />
      </div>

      <UserRoleOrgFields
        role={role}
        onRoleChange={onRoleChange}
        department={department}
        onDepartmentChange={onDepartmentChange}
        phone={phone}
        onPhoneChange={onPhoneChange}
        location={location}
        onLocationChange={onLocationChange}
      />

      {showActiveCheckbox && onActiveChange && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="edit-active"
            checked={active}
            onChange={(e) => onActiveChange(e.target.checked)}
            className="rounded border-border"
          />
          <label
            htmlFor="edit-active"
            className="text-xs text-foreground cursor-pointer font-medium"
          >
            Account is Active & Enabled
          </label>
        </div>
      )}
    </>
  );
}
