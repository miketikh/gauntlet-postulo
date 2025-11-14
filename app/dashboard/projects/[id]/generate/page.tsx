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
import { apiClient } from '@/lib/api/client';

// Only for streaming responses (Server-Sent Events)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
  const [extractionStatus, setExtractionStatus] = useState<string>('checking');
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkExtractionStatus = useCallback(async (projectData: any): Promise<boolean> => {
    if (!projectData.sourceDocuments || projectData.sourceDocuments.length === 0) {
      return true; // No documents to extract
    }

    const statuses = projectData.sourceDocuments.map((doc: any) => doc.extractionStatus);
    const allCompleted = statuses.every((status: string) => status === 'completed');
    const anyFailed = statuses.some((status: string) => status === 'failed');

    if (anyFailed) {
      setExtractionStatus('failed');
      return false;
    }

    if (allCompleted) {
      setExtractionStatus('completed');
      return true;
    }

    const pending = statuses.filter((status: string) => status === 'pending' || status === 'processing').length;
    setExtractionStatus(`extracting (${statuses.length - pending}/${statuses.length})`);
    return false;
  }, []);

  const waitForExtraction = useCallback(async (projectData: any): Promise<any> => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max wait
    let attempts = 0;

    while (attempts < maxAttempts) {
      const ready = await checkExtractionStatus(projectData);

      if (ready) {
        return projectData;
      }

      if (extractionStatus === 'failed') {
        throw new Error('Document extraction failed. Please try uploading your documents again.');
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Re-fetch project to get updated extraction status
      // Use apiClient for regular API calls
      const { data } = await apiClient.get(`/api/projects/${projectId}`);
      projectData = data.project;
      attempts++;
    }

    throw new Error('Document extraction timed out. Please try again.');
  }, [accessToken, projectId, checkExtractionStatus, extractionStatus]);

  const startGeneration = useCallback(async (projectData: any) => {
    if (!accessToken) {
      throw new Error('Missing authentication token');
    }

    try {
      // Wait for extraction to complete
      setExtractionStatus('checking');
      projectData = await waitForExtraction(projectData);
      setExtractionStatus('completed');

      abortControllerRef.current = new AbortController();
      // Use fetch for streaming responses
      const response = await fetch(`${API_URL}/api/ai/generate`, {
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
  }, [accessToken, projectId, router, waitForExtraction]);

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
        const response = await apiClient.get(`/api/projects/${projectId}`, {
          signal: controller.signal,
        });

        const data = response.data;

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
      extractionStatus={extractionStatus}
      onStop={handleStop}
      onRetry={handleRetry}
    />
  );
}
