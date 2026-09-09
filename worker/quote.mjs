export const PACKAGE_PRICES = Object.freeze({ MELODY: 119000, VOICE: 159000, SIGNATURE: 199000 });
export const SIZE_MODIFIERS = Object.freeze({ A5_PORTRAIT: 0, SQUARE: 20000, A6: -20000, A5_LANDSCAPE: 10000 });
export const PAGE_MODIFIERS = Object.freeze({ 12: 0, 16: 30000, 24: 60000 });
export const SHIPPING_PER_SHIPMENT = 30000;
export const DEFAULT_PRICING_RULES = Object.freeze({
  currency: 'VND', packages: PACKAGE_PRICES, sizes: SIZE_MODIFIERS, pages: PAGE_MODIFIERS,
  twin_second_copy_ratio: 0.75, shipping_per_shipment: SHIPPING_PER_SHIPMENT
});

function validMoney(value) { return Number.isSafeInteger(value) && value >= 0; }
function usableRules(rules) {
  const source = rules || DEFAULT_PRICING_RULES;
  const packages = source.packages; const sizes = source.sizes; const pages = source.pages;
  if (!packages || !sizes || !pages || !Object.values(packages).every(validMoney) || !Object.values(sizes).every(Number.isSafeInteger) || !Object.values(pages).every(Number.isSafeInteger) || !validMoney(Number(source.shipping_per_shipment)) || Number(source.twin_second_copy_ratio) !== 0.75 || source.currency !== 'VND') throw new TypeError('Invalid pricing rules');
  return { packages, sizes, pages, shipping: Number(source.shipping_per_shipment), twinRatio: Number(source.twin_second_copy_ratio) };
}

export function createQuote(input, rules = DEFAULT_PRICING_RULES) {
  const pricing = usableRules(rules);
  const packageCode = String(input?.packageCode || '');
  const size = String(input?.size || '');
  const pages = Number(input?.pages);
  const twin = input?.twin === true;
  const shipments = Number(input?.shipments ?? 1);
  if (!(packageCode in pricing.packages) || !(size in pricing.sizes) || !(pages in pricing.pages) || ![1, 2].includes(shipments)) {
    throw new TypeError('Invalid Melsou configuration');
  }
  if (!twin && shipments !== 1) throw new TypeError('A single-copy order has one shipment');
  const firstCopy = pricing.packages[packageCode] + pricing.sizes[size] + pricing.pages[pages];
  const twinCopy = twin ? Math.round(firstCopy * pricing.twinRatio) : 0;
  const shipping = shipments * pricing.shipping;
  return Object.freeze({
    currency: 'VND', packageCode, size, pages, twin, shipments,
    breakdown: { package: pricing.packages[packageCode], size: pricing.sizes[size], pages: pricing.pages[pages], firstCopy, twinCopy, shipping },
    total: firstCopy + twinCopy + shipping
  });
}
