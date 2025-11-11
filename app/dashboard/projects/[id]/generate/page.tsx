/**
 * Streaming Generation Page
 * Real-time AI generation view with streaming text display
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { StreamingView } from '@/components/generation/streaming-view';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const [content, setContent] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(async (projectData: any) => {
    if (!accessToken) {
      throw new Error('Missing authentication token');
    }

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectId,
          templateId: projectData.templateId,
          variables: projectData.caseDetails || {},
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                setContent(prev => prev + data.text);
              } else if (data.type === 'section') {
                setCurrentSection(data.section);
              } else if (data.type === 'done') {
                setIsGenerating(false);

                // Navigate to editor after short delay
                setTimeout(() => {
                  router.push(`/dashboard/projects/${projectId}/edit`);
                }, 2000);
              } else if (data.type === 'error') {
                setError(data.error);
                setIsGenerating(false);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Generation error:', error);
        setError((error as Error).message || 'An error occurred during generation');
        setIsGenerating(false);
      }
    }
  }, [accessToken, projectId, router]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (!accessToken) {
      setError('Authentication required. Please log in again.');
      setIsGenerating(false);
      router.push('/login');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          logout();
          router.push('/login');
          throw new Error('Unauthorized');
        }

        if (!response.ok) {
          throw new Error('Project not found');
        }

        const data = await response.json();

        if (cancelled) return;

        setProject(data.project);
        await startGeneration(data.project);
      } catch (err) {
        if (cancelled) return;
        if ((err as Error).name === 'AbortError') {
          return;
        }
        console.error('Error loading project:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load project. Please try again.'
        );
        setIsGenerating(false);
      }
    };

    fetchProject();

    return () => {
      cancelled = true;
      controller.abort();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId, accessToken, logout, router, startGeneration]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setContent('');
    setCurrentSection('');
    setError(null);
    setIsGenerating(true);
    if (project) {
      startGeneration(project);
    }
  };

  return (
    <StreamingView
      content={content}
      currentSection={currentSection}
      isGenerating={isGenerating}
      error={error}
      onStop={handleStop}
      onRetry={handleRetry}
    />
  );
}
