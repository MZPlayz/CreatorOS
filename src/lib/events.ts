export const EVENT_NEW_INVOICE = "creator_os:new_invoice";

export function triggerNewInvoice() {
  window.dispatchEvent(new Event(EVENT_NEW_INVOICE));
}
