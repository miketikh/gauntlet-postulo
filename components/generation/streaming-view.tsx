/**
 * Streaming View Component
 * Real-time display of AI-generated content with typewriter effect
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, StopCircle, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface StreamingViewProps {
  content: string;
  currentSection: string;
  isGenerating: boolean;
  error: string | null;
  onStop: () => void;
  onRetry: () => void;
}

export function StreamingView({
  content,
  currentSection,
  isGenerating,
  error,
  onStop,
  onRetry,
}: StreamingViewProps) {
  return (
    <div className="container mx-auto p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Generating Demand Letter
          </h1>
          {currentSection && isGenerating && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">
                Currently writing: <span className="font-medium">{currentSection}</span>
              </p>
            </div>
          )}
          {!isGenerating && !error && content && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-medium">Generation complete</p>
            </div>
          )}
        </div>

        {isGenerating && (
          <Button onClick={onStop} variant="destructive" size="sm">
            <StopCircle className="h-4 w-4 mr-2" />
            Stop Generation
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Generation Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Generation
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content Display */}
      <Card className="relative overflow-hidden">
        {/* Generation Progress Indicator */}
        {isGenerating && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100">
            <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
          </div>
        )}

        <div className="p-8">
          {/* Loading State - No Content Yet */}
          {isGenerating && !content && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Initializing AI generation...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          )}

          {/* Content Display with Typewriter Effect */}
          {content && (
            <div className="prose max-w-none">
              <div className="font-serif text-base leading-relaxed text-slate-900 whitespace-pre-wrap">
                {content}
                {isGenerating && (
                  <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1">
                    ▋
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {!isGenerating && !error && content && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-green-900 font-medium">
                  Generation complete! Redirecting to editor...
                </p>
              </div>
              <p className="text-sm text-green-700 mt-1 ml-7">
                You'll be able to review and edit your demand letter in just a moment.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Generation Info */}
      {isGenerating && content && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 mb-1">
                AI is generating your demand letter
              </p>
              <p className="text-xs text-slate-600">
                The AI is analyzing your case documents and applying your firm's template to create a
                professional demand letter. You can stop the generation at any time if you need to make changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
