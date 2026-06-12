/**
 * Role-based access control helpers.
 *
 * Centralises permission logic so it doesn't get scattered across API routes.
 * Every permission check goes through one of these functions, making it easy
 * to audit or change the privilege model in one place.
 */

export type Role = 'super_admin' | 'hotel_owner' | 'manager' | 'staff'

/** Ordered role weight — higher = more privilege */
const ROLE_WEIGHT: Record<Role, number> = {
  super_admin: 100,
  hotel_owner: 50,
  manager: 30,
  staff: 10,
}

/** True if role `a` has at least the same privilege as role `b` */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_WEIGHT[userRole] >= ROLE_WEIGHT[minRole]
}

/** Can the user view/make check-ins and view room status? (staff+) */
export function canCheckIn(role: Role): boolean {
  return hasMinRole(role, 'staff')
}

/** Can the user add/edit/delete rooms and manage basic hotel config? (manager+) */
export function canManageRooms(role: Role): boolean {
  return hasMinRole(role, 'manager')
}

/** Can the user manage employees (add, change role, remove)? (manager+) */
export function canManageEmployees(role: Role): boolean {
  return hasMinRole(role, 'manager')
}

/**
 * Can the user promote/demote managers or remove managers?
 * Only the owner can touch other managers. (hotel_owner+)
 */
export function canManageManagers(role: Role): boolean {
  return hasMinRole(role, 'hotel_owner')
}

/** Can the user edit hotel settings and regenerate invite key? (hotel_owner+) */
export function canManageHotelSettings(role: Role): boolean {
  return hasMinRole(role, 'hotel_owner')
}

/** Can the user delete the hotel entirely? (hotel_owner only) */
export function canDeleteHotel(role: Role): boolean {
  return role === 'hotel_owner'
}

/** Can the user view all hotels and platform stats? (super_admin only) */
export function isSuperAdmin(role: Role): boolean {
  return role === 'super_admin'
}

/**
 * Checks if a user belongs to the given hotel.
 * Super admins can access any hotel.
 */
export function belongsToHotel(
  userRole: Role,
  userHotelId: string | null,
  targetHotelId: string
): boolean {
  if (isSuperAdmin(userRole)) return true
  return userHotelId === targetHotelId
}
