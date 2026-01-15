import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type { Project } from '../types';
import { projectErrorCodes, type ProjectServiceError } from './error';
import type { CreateProjectInput, UpdateProjectInput } from './schema';

// Convert snake_case DB row to camelCase Project
const mapRowToProject = (row: Record<string, unknown>): Project => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string | null,
  status: row.status as Project['status'],
  currentStep: ((row.current_step as number) || 1) as Project['currentStep'],
  selectedThemeId: row.selected_theme_id as string | null,
  planId: row.plan_id as string | null,
  groomUploadCount: (row.groom_upload_count as number) || 0,
  brideUploadCount: (row.bride_upload_count as number) || 0,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export const createProject = async (
  supabase: SupabaseClient,
  userId: string,
  input: CreateProjectInput
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name || '새 프로젝트',
      status: 'uploading',
      current_step: 1,
    })
    .select()
    .single();

  if (error) {
    return failure(500, projectErrorCodes.createError, error.message);
  }

  return success(mapRowToProject(data));
};

export const getProjectById = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, projectErrorCodes.notFound, 'Project not found');
    }
    return failure(500, projectErrorCodes.fetchError, error.message);
  }

  return success(mapRowToProject(data));
};

export const getProjectsByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<Project[], ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, projectErrorCodes.fetchError, error.message);
  }

  return success((data || []).map(mapRowToProject));
};

export const updateProject = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  // Build update object with snake_case keys
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.currentStep !== undefined) updateData.current_step = input.currentStep;
  if (input.selectedThemeId !== undefined)
    updateData.selected_theme_id = input.selectedThemeId;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, projectErrorCodes.notFound, 'Project not found');
    }
    return failure(500, projectErrorCodes.updateError, error.message);
  }

  return success(mapRowToProject(data));
};
