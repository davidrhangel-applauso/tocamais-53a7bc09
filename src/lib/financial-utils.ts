/**
 * Calculates the net amount after platform fee deduction
 * @param valor - Gross value
 * @param isPro - Whether the artist has Pro subscription
 * @returns Net amount the artist receives
 */
export function calculateNetAmount(valor: number, isPro: boolean): number {
  const fee = isPro ? 0 : 0.20;
  return Number((valor * (1 - fee)).toFixed(2));
}

/**
 * Calculates the platform fee
 * @param valor - Gross value
 * @param isPro - Whether the artist has Pro subscription
 * @returns Platform fee amount
 */
export function calculatePlatformFee(valor: number, isPro: boolean): number {
  const fee = isPro ? 0 : 0.20;
  return Number((valor * fee).toFixed(2));
}

/**
 * Formats a number as Brazilian Real currency
 * @param valor - Value to format
 * @returns Formatted string like "R$ 10,00"
 */
export function formatCurrency(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formats a number as a simple decimal with 2 places
 * @param valor - Value to format
 * @returns Formatted string like "10.00"
 */
export function formatDecimal(valor: number): string {
  return valor.toFixed(2);
}

/**
 * Gets the fee percentage based on subscription status
 * @param isPro - Whether the artist has Pro subscription
 * @returns Fee percentage as decimal (0.20 for 20%)
 */
export function getFeePercentage(isPro: boolean): number {
  return isPro ? 0 : 0.20;
}

/**
 * Gets the fee percentage as display string
 * @param isPro - Whether the artist has Pro subscription
 * @returns Fee string like "20%" or "0%"
 */
export function getFeeDisplayString(isPro: boolean): string {
  return isPro ? "0%" : "20%";
}
