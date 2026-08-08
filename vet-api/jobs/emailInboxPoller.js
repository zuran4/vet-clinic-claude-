import cron from "node-cron";

import { getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { pollClinicInbox } from "../services/emailInboxService.js";
import logger from "../utils/logger.js";

async function runPollAllTenants() {
  try {
    const Tenant = getTenantModel();
    const tenants = await Tenant.find({ isActive: true });

    for (const tenant of tenants) {
      try {
        const { Settings, Message, Customer } = getTenantModels(tenant.clinicId);
        const result = await pollClinicInbox(tenant.clinicId, { Settings, Message, Customer });

        if (result.skipped) continue;
        if (result.saved > 0) {
          logger.info(`✅ [${tenant.clinicId}] emailInboxPoller: ${result.saved}/${result.fetched} νέα email αποθηκεύτηκαν.`);
        }
      } catch (tenantErr) {
        logger.warn(`⚠️ [${tenant.clinicId}] Σφάλμα emailInboxPoller: ${tenantErr.message}`);
      }
    }
  } catch (err) {
    logger.error("❌ Σφάλμα emailInboxPoller:", err.message);
  }
}

/**
 * Κάθε 2 λεπτά, ελέγχει το mailbox κάθε ενεργής κλινικής για νέα εισερχόμενα
 * email (unified "Μηνύματα" section).
 */
export function startEmailInboxPoller() {
  cron.schedule("*/2 * * * *", runPollAllTenants);
  logger.info("📬 emailInboxPoller: ενεργό (κάθε 2 λεπτά)");
}
