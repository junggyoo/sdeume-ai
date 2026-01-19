export type FaceRole = 'bride' | 'groom';

/**
 * Represents a trained LoRA model associated with a user's face
 */
export interface LoraModelInfo {
  id: string;
  modelUrl: string | null;
  status: 'pending' | 'training' | 'completed' | 'failed';
  completedAt: string | null;
}

/**
 * User face model record from user_face_models table
 */
export interface UserFaceModel {
  id: string;
  userId: string;
  role: FaceRole;
  loraModelId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  loraModel?: LoraModelInfo | null;
}

/**
 * Status summary for user's face data availability
 */
export interface FaceDataStatus {
  bride: UserFaceModel | null;
  groom: UserFaceModel | null;
  hasBothFaces: boolean;
  hasAnyFace: boolean;
}

/**
 * Input for creating/updating a user face model
 */
export interface UpsertUserFaceModelInput {
  userId: string;
  role: FaceRole;
  loraModelId: string;
}

/**
 * Database row type from Supabase query
 */
export interface UserFaceModelRow {
  id: string;
  user_id: string;
  role: string;
  lora_model_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lora_model?: {
    id: string;
    model_url: string | null;
    status: string;
    completed_at: string | null;
  } | null;
}

/**
 * Maps database row to domain model
 */
export function mapUserFaceModelFromRow(row: UserFaceModelRow): UserFaceModel {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role as FaceRole,
    loraModelId: row.lora_model_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    loraModel: row.lora_model
      ? {
          id: row.lora_model.id,
          modelUrl: row.lora_model.model_url,
          status: row.lora_model.status as LoraModelInfo['status'],
          completedAt: row.lora_model.completed_at,
        }
      : null,
  };
}

/**
 * Transforms array of face models into status summary
 */
export function getFaceDataStatus(models: UserFaceModel[]): FaceDataStatus {
  const bride = models.find((m) => m.role === 'bride' && m.isActive) || null;
  const groom = models.find((m) => m.role === 'groom' && m.isActive) || null;

  const brideReady = bride?.loraModel?.status === 'completed' && !!bride.loraModel.modelUrl;
  const groomReady = groom?.loraModel?.status === 'completed' && !!groom.loraModel.modelUrl;

  return {
    bride,
    groom,
    hasBothFaces: brideReady && groomReady,
    hasAnyFace: brideReady || groomReady,
  };
}
