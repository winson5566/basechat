import { notFound } from "next/navigation";

// Example details page for the drawer
export default async function DetailsPage({
  params,
}: {
  params: Promise<{ slug: string; runId: string; stepIndex: string }>;
}) {
  const { slug, runId, stepIndex } = await params;

  // You can fetch data here based on the id
  // const details = await fetchDetails(id);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Details for Item {slug} {runId} {stepIndex}
        </h1>
        <p className="text-gray-600">This is a drawer that slides in from the right over the main content.</p>
      </div>
    </div>
  );
}
