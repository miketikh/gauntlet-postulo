/**
 * Share Modal Component
 * Manages draft collaborators and permissions
 * Story 4.11: Document Locking and Permissions UI
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Trash2, Crown, AlertCircle } from 'lucide-react';
import { useDraftPermission, type Collaborator, type Owner } from '@/lib/hooks/use-draft-permission';

interface ShareModalProps {
  draftId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmId: string;
}

type PermissionLevel = 'view' | 'comment' | 'edit';

export function ShareModal({ draftId, isOpen, onClose }: ShareModalProps) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<PermissionLevel>('view');
  const [error, setError] = useState<string | null>(null);

  // Get current permissions and collaborators
  const { isOwner, owner, collaborators, refetch } = useDraftPermission(draftId);

  // Fetch users in the firm (for search/autocomplete)
  const { data: firmUsers } = useQuery<User[]>({
    queryKey: ['firm-users', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 2) return [];
      const response = await axios.get<{ users: User[] }>(
        `/api/users/search?q=${encodeURIComponent(searchEmail)}`
      );
      return response.data.users || [];
    },
    enabled: searchEmail.length >= 2,
  });

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: async (data: { userId: string; permission: PermissionLevel }) => {
      await axios.post(`/api/drafts/${draftId}/collaborators`, data);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['draft-permission', draftId] });
      setSearchEmail('');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to add collaborator');
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async (data: { userId: string; permission: PermissionLevel }) => {
      await axios.patch(`/api/drafts/${draftId}/collaborators/${data.userId}`, {
        permission: data.permission,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['draft-permission', draftId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to update permission');
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.delete(`/api/drafts/${draftId}/collaborators/${userId}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['draft-permission', draftId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to remove collaborator');
    },
  });

  const handleAddCollaborator = (userId: string) => {
    addCollaboratorMutation.mutate({
      userId,
      permission: selectedPermission,
    });
  };

  const handleUpdatePermission = (userId: string, permission: PermissionLevel) => {
    updatePermissionMutation.mutate({ userId, permission });
  };

  const handleRemoveCollaborator = (userId: string) => {
    if (confirm('Are you sure you want to remove this collaborator?')) {
      removeCollaboratorMutation.mutate(userId);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPermissionLabel = (permission: string) => {
    const labels = {
      owner: 'Owner',
      edit: 'Can edit',
      comment: 'Can comment',
      view: 'Can view',
    };
    return labels[permission as keyof typeof labels] || permission;
  };

  const getPermissionColor = (permission: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      edit: 'bg-blue-100 text-blue-800',
      comment: 'bg-green-100 text-green-800',
      view: 'bg-gray-100 text-gray-800',
    };
    return colors[permission as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Manage who can view, comment, and edit this document.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add Collaborator Section - Only for owners */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email to add collaborator..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Label htmlFor="permission">Permission</Label>
                <Select
                  value={selectedPermission}
                  onValueChange={(value) => setSelectedPermission(value as PermissionLevel)}
                >
                  <SelectTrigger id="permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="comment">Can comment</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User search results */}
            {firmUsers && firmUsers.length > 0 && (
              <div className="border rounded-md p-2 space-y-1">
                {firmUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                    onClick={() => handleAddCollaborator(user.id)}
                    disabled={addCollaboratorMutation.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <UserPlus className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collaborator List */}
        <div className="space-y-2">
          <Label>People with access</Label>
          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-3">
              {/* Owner */}
              {owner && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(owner.firstName, owner.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {owner.firstName} {owner.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{owner.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <Badge className={getPermissionColor('owner')}>
                      {getPermissionLabel('owner')}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(collaborator.user.firstName, collaborator.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {collaborator.user.firstName} {collaborator.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{collaborator.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <>
                        <Select
                          value={collaborator.permission}
                          onValueChange={(value) =>
                            handleUpdatePermission(collaborator.userId, value as PermissionLevel)
                          }
                          disabled={updatePermissionMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Can view</SelectItem>
                            <SelectItem value="comment">Can comment</SelectItem>
                            <SelectItem value="edit">Can edit</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.userId)}
                          disabled={removeCollaboratorMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <Badge className={getPermissionColor(collaborator.permission)}>
                        {getPermissionLabel(collaborator.permission)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-8">
                  No collaborators yet. {isOwner && 'Add people above to start collaborating.'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
