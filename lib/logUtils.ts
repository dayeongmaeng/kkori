import { ConditionScore, DailyLog, MealAmount, WaterAmount } from './types';

const CONDITION_EMOJI: Record<ConditionScore, string> = {
  1: '😴', 2: '😔', 3: '😊', 4: '😄', 5: '🤩',
};

const MEAL_LABEL: Record<MealAmount, string> = {
  none: '식사 안함', less: '식사 적게', normal: '식사 평소', more: '식사 많이',
};

const WATER_LABEL: Record<WaterAmount, string> = {
  less: '음수 적게', normal: '음수 평소', more: '음수 많이',
};

export function summarizeLog(log: DailyLog): string {
  const items: string[] = [];

  if (log.condition != null) items.push(`컨디션 ${CONDITION_EMOJI[log.condition]}`);
  if (log.walkMinutes != null && log.walkMinutes > 0) items.push(`산책 ${log.walkMinutes}분`);
  if (log.meal != null) items.push(MEAL_LABEL[log.meal]);
  if (log.water != null) items.push(WATER_LABEL[log.water]);
  if (log.memo) items.push('메모 있음');
  if (log.pooCount != null && log.pooCount > 0) items.push(`배변 ${log.pooCount}회`);

  if (items.length === 0) return '기록이 있어요';

  const visible = items.slice(0, 3);
  const rest = items.length - 3;
  return rest > 0 ? `${visible.join(' · ')} 외 ${rest}개` : visible.join(' · ');
}
