// Πόσα ραντεβού (οποιουδήποτε status) χρειάζεται ένας πελάτης για να πάψει
// να θεωρείται "νέος" — χρησιμοποιείται από customers/appointments controllers
// για το badge "Νέος" στο UI.
export const NEW_CUSTOMER_APPOINTMENT_LIMIT = 4;

export function computeShowNewBadge(isNewCustomer, appointmentCount) {
  return !!isNewCustomer && (appointmentCount || 0) < NEW_CUSTOMER_APPOINTMENT_LIMIT;
}
