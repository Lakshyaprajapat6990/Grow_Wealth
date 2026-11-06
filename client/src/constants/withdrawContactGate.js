/** Members who must confirm withdrawal via Kapil Rai (not self-serve). */
export const WITHDRAW_CONTACT_USER_IDS = new Set(['GW0165712']);

export const WITHDRAW_CONTACT = {
  name: 'Kapil Rai',
  phone: '82510 54932',
  phoneTel: '8251054932',
  message: 'Confirm your withdrawal. Please contact with Kapil Rai = 82510 54932.',
};

export function mustContactForWithdraw(userId) {
  return WITHDRAW_CONTACT_USER_IDS.has(String(userId || '').toUpperCase());
}
