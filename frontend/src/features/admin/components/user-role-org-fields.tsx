import type { Role } from "@/api/users";
import { Input } from "@/components/ui/input";

export function UserRoleOrgFields({
  role,
  onRoleChange,
  department,
  onDepartmentChange,
  phone,
  onPhoneChange,
  location,
  onLocationChange,
}: {
  role: Role;
  onRoleChange: (val: Role) => void;
  department: string;
  onDepartmentChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">
            Enterprise Role
          </label>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
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
          <Input
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            placeholder="Operations"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">
            Contact Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">
            Assigned Location
          </label>
          <Input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Kelaniya Hub (HUB-01)"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </>
  );
}
