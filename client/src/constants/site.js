/** Public member site — always use this for referral / share links */
export const PUBLIC_SITE_URL = 'https://grow-wealth.co.uk';

export function referralLink(userId) {
  const id = String(userId || '').trim().toUpperCase();
  return `${PUBLIC_SITE_URL}/register?ref=${id}`;
}
