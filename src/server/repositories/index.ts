/**
 * Repository layer — all Supabase reads/writes branch on DEMO_MODE here.
 * Import repositories from this barrel; do not call Supabase from UI.
 */
export * as businessRepository from "./businesses";
export * as businessMemberRepository from "./business-members";
export * as serviceRepository from "./services";
export * as staffRepository from "./staff-members";
export * as customerRepository from "./customers";
export * as appointmentRepository from "./appointments";
export * as availabilityRepository from "./availability";
export * as auditLogRepository from "./audit-logs";
export * as appSettingsRepository from "./app-settings";
export * as locationRepository from "./locations";
export * as dashboardStatsRepository from "./dashboard-stats";
