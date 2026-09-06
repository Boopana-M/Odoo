export function toDateString(d: Date | string): string {
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      return d.substring(0, 10);
    }
  }
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function doContractsOverlap(
  c1: { startDate: Date | string; endDate?: Date | string | null },
  c2: { startDate: Date | string; endDate?: Date | string | null }
): boolean {
  const start1 = toDateString(c1.startDate);
  const start2 = toDateString(c2.startDate);

  const [first, second] = start1 <= start2 ? [c1, c2] : [c2, c1];

  if (!first.endDate) {
    return true;
  }

  const firstEnd = toDateString(first.endDate);
  const secondStart = toDateString(second.startDate);

  return firstEnd >= secondStart;
}

export function hasAnyOverlappingContracts(
  contracts: Array<{ startDate: Date | string; endDate?: Date | string | null }>
): boolean {
  if (contracts.length <= 1) return false;
  const sorted = [...contracts].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (doContractsOverlap(sorted[i], sorted[j])) {
        return true;
      }
    }
  }
  return false;
}
