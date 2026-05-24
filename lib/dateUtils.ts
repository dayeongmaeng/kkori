function parseLocalDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function todayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function calculateAge(birthDate: string): { years: number; months: number } {
  const birth = parseLocalDate(birthDate);
  if (!birth) return { years: 0, months: 0 };
  const today = todayLocal();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months };
}

export function formatAge(birthDate: string): string {
  const { years, months } = calculateAge(birthDate);
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}살`;
  return `${years}살 ${months}개월`;
}

export function daysSince(dateStr: string): number {
  const past = parseLocalDate(dateStr);
  if (!past) return 0;
  return Math.floor((todayLocal().getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatTogetherness(adoptionDate: string): string {
  const start = parseLocalDate(adoptionDate);
  if (!start) return '';

  const today = todayLocal();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const days = Math.max(0, diffDays) + 1; // 첫날 포함

  if (days < 30) return `함께한 지 ${days}일`;

  let months =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());
  if (today.getDate() < start.getDate()) months -= 1;
  months = Math.max(1, months);

  if (months < 12) return `함께한 지 ${months}개월`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `함께한 지 ${years}년`;
  return `함께한 지 ${years}년 ${remainingMonths}개월`;
}
