import { Input } from "@/components/ui/input";

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
  role: string;
  onRoleChange: (val: string) => void;
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
        <Input placeholder="e.g. Kasun Fernando" value={name} onChange={(e) => onNameChange(e.target.value)} className="h-8 text-xs" required />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground">Corporate Email</label>
        <Input type="email" placeholder="e.g. kasun@retrails.com" value={email} onChange={(e) => onEmailChange(e.target.value)} className="h-8 text-xs" required />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground">{passwordLabel}</label>
        <Input type="password" placeholder={passwordPlaceholder} value={password} onChange={(e) => onPasswordChange(e.target.value)} className="h-8 text-xs" required={passwordRequired} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Enterprise Role</label>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="dispatcher">Dispatcher</option>
            <option value="loader">Bay Loader</option>
            <option value="driver">Fleet Driver</option>
            <option value="store_manager">Store Manager</option>
            <option value="system_admin">System Admin</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Department</label>
          <Input value={department} onChange={(e) => onDepartmentChange(e.target.value)} placeholder="Operations" className="h-8 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Contact Phone</label>
          <Input value={phone} onChange={(e) => onPhoneChange(e.target.value)} className="h-8 text-xs" />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Assigned Location</label>
          <Input value={location} onChange={(e) => onLocationChange(e.target.value)} placeholder="Kelaniya Hub (HUB-01)" className="h-8 text-xs" />
        </div>
      </div>

      {showActiveCheckbox && onActiveChange && (
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="edit-active" checked={active} onChange={(e) => onActiveChange(e.target.checked)} className="rounded border-border" />
          <label htmlFor="edit-active" className="text-xs text-foreground cursor-pointer font-medium">Account is Active & Enabled</label>
        </div>
      )}
    </>
  );
}
