import { notFound } from "next/navigation";

interface DetailsPageProps {
  params: Promise<{ slug: string; id: string }>;
}

// Example details page for the drawer
export default async function DetailsPage({ params }: DetailsPageProps) {
  const { slug, id } = await params;

  // You can fetch data here based on the id
  // const details = await fetchDetails(id);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Details for Item {id}</h1>
        <p className="text-gray-600">This is a drawer that slides in from the right over the main content.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Item Information</h3>
          <p className="text-sm text-gray-600">
            This drawer demonstrates how to show detailed information while keeping the main page content visible
            underneath.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Navigation</h3>
          <p className="text-sm text-gray-600">You can close this drawer by:</p>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
            <li>Clicking the X button in the top right</li>
            <li>Clicking the backdrop (dark area)</li>
            <li>Using the browser back button</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Features</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            <li>Smooth slide-in animation</li>
            <li>Backdrop with click-to-close</li>
            <li>Responsive design</li>
            <li>Main content remains visible</li>
            <li>Browser back button support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
