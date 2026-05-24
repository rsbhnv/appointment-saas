export { authenticationRules } from "./authentication";
export { authorizationRules } from "./authorization";
export { dataAccessRules } from "./data-access";
export { tenantIsolationRules } from "./tenant-isolation";

import { authenticationRules } from "./authentication";
import { authorizationRules } from "./authorization";
import { dataAccessRules } from "./data-access";
import { tenantIsolationRules } from "./tenant-isolation";

/** Central registry of security policy definitions for the application. */
export const securityRules = {
  authentication: authenticationRules,
  authorization: authorizationRules,
  tenantIsolation: tenantIsolationRules,
  dataAccess: dataAccessRules,
} as const;
