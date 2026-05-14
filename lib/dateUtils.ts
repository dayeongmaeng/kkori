export function calculateAge(birthDate: string): { years: number; months: number } {
  const today = new Date();
  const birth = new Date(birthDate);

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
  const today = new Date();
  const past = new Date(dateStr);
  return Math.floor((today.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
}
