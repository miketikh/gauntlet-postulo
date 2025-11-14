/**
 * useDraftPermission Hook
 * Fetches and manages user's permission level for a draft
 * Story 4.11: Document Locking and Permissions UI
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'owner';

export interface Collaborator {
  id: string;
  userId: string;
  permission: 'view' | 'comment' | 'edit';
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface Owner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  permission: 'owner';
  isOwner: true;
}

export interface DraftPermissionData {
  owner: Owner;
  collaborators: Collaborator[];
  currentUserPermission: PermissionLevel;
}

export interface UseDraftPermissionReturn {
  permission: PermissionLevel | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOwner: boolean;
  canEdit: boolean;
  canComment: boolean;
  canView: boolean;
  refetch: () => void;
  owner: Owner | null;
  collaborators: Collaborator[];
}

/**
 * Fetch user's permission for a draft
 * Returns permission level and computed flags
 *
 * @param draftId - The draft ID to check permissions for
 * @returns Permission data and status
 */
export function useDraftPermission(draftId: string | null): UseDraftPermissionReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DraftPermissionData>({
    queryKey: ['draft-permission', draftId],
    queryFn: async () => {
      if (!draftId) {
        throw new Error('Draft ID is required');
      }

      const response = await apiClient.get<DraftPermissionData>(
        `/api/drafts/${draftId}/collaborators`
      );
      return response.data;
    },
    enabled: !!draftId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const permission = data?.currentUserPermission || null;
  const isOwner = permission === 'owner';
  const canEdit = permission === 'owner' || permission === 'edit';
  const canComment = canEdit || permission === 'comment';
  const canView = canComment || permission === 'view';

  return {
    permission,
    isLoading,
    isError,
    error: error as Error | null,
    isOwner,
    canEdit,
    canComment,
    canView,
    refetch,
    owner: data?.owner || null,
    collaborators: data?.collaborators || [],
  };
}
