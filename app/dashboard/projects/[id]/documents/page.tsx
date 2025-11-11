import { DocumentListTabs } from '@/components/documents/document-list-tabs';
import { db } from '@/lib/db/client';
import { sourceDocuments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const documents = await db.query.sourceDocuments.findMany({
    where: eq(sourceDocuments.projectId, id),
    orderBy: (docs, { desc }) => [desc(docs.createdAt)],
  });

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Project Documents</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <DocumentListTabs documents={documents} />
      </div>
    </div>
  );
}
