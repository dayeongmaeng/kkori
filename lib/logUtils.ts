import { ConditionScore, MealAmount, WaterAmount } from './types';
import { LogResponse } from './api/log';

const CONDITION_EMOJI: Record<ConditionScore, string> = {
  1: '😴', 2: '😔', 3: '😊', 4: '😄', 5: '🤩',
};

const MEAL_LABEL: Record<MealAmount, string> = {
  NONE: '식사 안함', LESS: '식사 적게', NORMAL: '식사 평소', MORE: '식사 많이',
};

const WATER_LABEL: Record<WaterAmount, string> = {
  LESS: '음수 적게', NORMAL: '음수 평소', MORE: '음수 많이',
};

export function summarizeLog(log: LogResponse): string {
  const items: string[] = [];

  if (log.condition != null) items.push(`컨디션 ${CONDITION_EMOJI[log.condition]}`);
  if (log.walkMinutes != null && log.walkMinutes >= 0) items.push(`산책 ${log.walkMinutes}분`);
  if (log.meal != null) items.push(MEAL_LABEL[log.meal]);
  if (log.water != null) items.push(WATER_LABEL[log.water]);
  if (log.pooCondition != null) items.push('배변 기록');
  if (log.memo) items.push('메모 있음');

  if (items.length === 0) return '기록이 있어요';

  const visible = items.slice(0, 3);
  const rest = items.length - 3;
  return rest > 0 ? `${visible.join(' · ')} 외 ${rest}개` : visible.join(' · ');
}
