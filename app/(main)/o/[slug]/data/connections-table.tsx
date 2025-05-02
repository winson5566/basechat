import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CONNECTOR_MAP from "@/lib/connector-map";
import { getStatusDisplayName } from "@/lib/utils";

import ManageConnectionMenu from "./manage-connection-menu";

interface Props {
  tenant: {
    id: string;
    slug: string;
  };
  connections: any[];
}

export default async function ConnectionsTable({ tenant, connections }: Props) {
  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="flex-grow w-full flex flex-col items-center">
      <div className="w-full mb-8">
        <div className="text-[14px] font-[500] text-[#1D1D1F] mb-4 pl-1">
          {connections.length} {connections.length === 1 ? "connection" : "connections"}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Name</TableHead>
              <TableHead className="w-[200px]">Document count</TableHead>
              <TableHead className="w-[200px]">Added by</TableHead>
              <TableHead className="w-[200px]">Date added</TableHead>
              <TableHead className="w-[200px]">Last synced</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((connection) => (
              <TableRow key={connection.id}>
                <TableCell className="font-medium flex items-center">
                  <Image
                    src={CONNECTOR_MAP[connection.sourceType][1]}
                    alt={CONNECTOR_MAP[connection.sourceType][0]}
                    className="mr-1"
                  />
                  <div>{connection.name}</div>
                </TableCell>
                {/**TODO: fix these table cells with real info from connections */}
                <TableCell>document count</TableCell>
                <TableCell>added by</TableCell>
                <TableCell>{formatDistanceToNow(connection.createdAt, { addSuffix: true })}</TableCell>
                <TableCell>
                  {connection.lastSyncedAt ? formatDistanceToNow(connection.lastSyncedAt, { addSuffix: true }) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {connection.status !== "ready" && connection.status !== "failed" && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#006EDB]" />
                    )}
                    {getStatusDisplayName(connection.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <ManageConnectionMenu id={connection.id} tenant={tenant} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
