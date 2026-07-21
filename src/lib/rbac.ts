export interface PermissionState {
  canManagePlots: boolean;
  canManageCrops: boolean;
  roleName: string;
}

export const defaultAdminPermissions: PermissionState = {
  canManagePlots: true,
  canManageCrops: true,
  roleName: "Admin",
};

export const defaultFieldStaffPermissions: PermissionState = {
  canManagePlots: false,
  canManageCrops: false,
  roleName: "Field Staff",
};
