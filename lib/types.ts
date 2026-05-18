export type Species = 'dog' | 'cat';

export type MealAmount = 'NONE' | 'LESS' | 'NORMAL' | 'MORE';
export type WaterAmount = 'LESS' | 'NORMAL' | 'MORE';
export type StoolCondition = 'NORMAL' | 'SOFT' | 'HARD' | 'DIARRHEA';
export type UrineColor = 'PALE' | 'NORMAL' | 'DARK';
export type ConditionScore = 1 | 2 | 3 | 4 | 5;

export type CaregiverRole = 'owner' | 'family' | 'guest';

export interface Caregiver {
  id: string;
  name: string;        // "나", "엄마", "아빠" 등
  role: CaregiverRole;
  color?: string;      // 기록자 구분용 색상
  createdAt: string;   // ISO 8601
}

export interface Pet {
  id: string;
  species: Species;
  name: string;
  photoUri?: string;
  breed: string;
  birthDate: string;       // ISO 8601: "2020-03-15"
  weightKg: number;
  neutered: boolean;
  medicalNotes?: string;
  caregiverIds: string[];  // 이 반려동물을 돌보는 보호자 ID 목록
  createdAt: string;       // ISO 8601
}

export interface DailyPhoto {
  id: string;
  petId: string;
  date: string;            // YYYY-MM-DD
  photoUri: string;        // base64 data URI 또는 file system URI
  caption?: string;
  caregiverId: string;     // 누가 찍었는지
  createdAt: string;       // ISO 8601
}

export interface DailyLog {
  id: string;
  petId: string;
  caregiverId: string;       // 누가 기록했는지
  date: string;              // YYYY-MM-DD

  meal?: MealAmount;
  mealNote?: string;         // 사료 종류, 간식 등 자유 메모
  water?: WaterAmount;
  waterNote?: string;
  walkMinutes?: number | null;
  walkNote?: string;         // 산책 메모 (장소 등)
  pooCondition?: StoolCondition;
  pooNote?: string;
  urineColor?: UrineColor;
  condition?: ConditionScore;
  weightKg?: number;         // 가끔 측정한 체중
  photoUris?: string[];      // 기록용 사진 (base64, 최대 3장)
  memo?: string;

  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}
