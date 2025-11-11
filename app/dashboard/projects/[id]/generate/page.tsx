/**
 * Streaming Generation Page
 * Real-time AI generation view with streaming text display
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { StreamingView } from '@/components/generation/streaming-view';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [content, setContent] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // First, fetch project details to get template and variables
    fetch(`/api/projects/${projectId}`)
      .then(res => {
        if (!res.ok) throw new Error('Project not found');
        return res.json();
      })
      .then(data => {
        setProject(data.project);
        // Start generation once we have project data
        startGeneration(data.project);
      })
      .catch(err => {
        console.error('Error loading project:', err);
        setError('Failed to load project. Please try again.');
        setIsGenerating(false);
      });

    return () => {
      // Cleanup: abort on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId]);

  const startGeneration = async (projectData: any) => {
    try {
      abortControllerRef.current = new AbortController();

      const accessToken = useAuthStore.getState().accessToken;
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
  };

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
