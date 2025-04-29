import { eq } from "drizzle-orm";
import Image from "next/image";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { decrypt } from "@/lib/server/encryption";
import { getRagieClientAndPartition, getRagieSettingsByTenantId } from "@/lib/server/ragie";
import { RAGIE_API_KEY } from "@/lib/server/settings";
import { RAGIE_API_BASE_URL } from "@/lib/server/settings";
import { adminOrRedirect } from "@/lib/server/utils";
import ManageDataPreviewIcons from "@/public/manage-data-preview-icons.svg";

import AddConnectionMenu from "./add-connection-menu";
import ConnectionsTable from "./connections-table";
import FilesTable from "./files-table";
import UploadFileButton from "./upload-file-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DataIndexPage({ params }: Props) {
  const p = await params;
  const { tenant } = await adminOrRedirect(p.slug);
  const connections = await db.select().from(schema.connections).where(eq(schema.connections.tenantId, tenant.id));
  const { client, partition } = await getRagieClientAndPartition(tenant.id);
  let files: any[] = [];

  try {
    const res = await client.documents.list({
      partition: partition || "",
    });
    files = res.result.documents;
  } catch (error) {
    console.error(error);
  }
  // TODO: get pages of files from res.result.pagination.nextCursor

  const hasData = connections.length > 0 || files.length > 0;

  return (
    <div className="max-w-[1140px] w-full p-4 flex-grow flex flex-col">
      <div className="flex w-full justify-between items-center pt-2">
        <h1 className="font-bold text-[32px]">Manage data</h1>
        <div className="flex gap-2">
          <AddConnectionMenu tenant={tenant} />
          <UploadFileButton tenant={tenant} />
        </div>
      </div>
      {hasData ? (
        <div className="flex-grow w-full flex flex-col">
          {connections.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-10 mb-4">Connections</h2>
              <ConnectionsTable tenant={tenant} connections={connections} />
            </>
          )}
          {files.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-10 mb-4">Uploaded Files</h2>
              <FilesTable tenant={tenant} files={files} />
            </>
          )}
        </div>
      ) : (
        <div className="flex-grow w-full flex flex-col items-center justify-center">
          <Image alt="Manage data" src={ManageDataPreviewIcons} />
          <h1 className="font-bold text-[32px] mb-3">Chat with your own data</h1>
          <div className="text-[16px]">Click &apos;Add data&apos; above to get started</div>
        </div>
      )}
    </div>
  );
}
