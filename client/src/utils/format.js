export function fmtNum(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtDate(isoOrDate) {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function normalizeGrade(g) {
  if (!g) return null;
  const s = String(g).trim().toUpperCase();
  if (['A', 'B', 'C', 'P', 'Z'].includes(s)) return s;
  if (s.includes('NOT')) return 'N/A';
  return s;
}

export function gradeLabel(g) {
  const s = normalizeGrade(g);
  if (!s) return '—';
  if (s === 'P') return 'Pending';
  if (s === 'Z') return 'Grade Pending';
  return s;
}

export function safeText(v) {
  const s = (v ?? '').toString().trim();
  return s ? s : '—';
}

