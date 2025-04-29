import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CONNECTOR_MAP from "@/lib/connector-map";

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {/* TODO: make sure this table heading spacing is consistent with the files-table */}
            <TableHead className="w-[200px]">Date added</TableHead>
            <TableHead className="w-[200px]">Last synced</TableHead>
            <TableHead className="w-[50px]">Status</TableHead>
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
              <TableCell>{formatDistanceToNow(connection.createdAt, { addSuffix: true })}</TableCell>
              <TableCell>
                {connection.lastSyncedAt ? formatDistanceToNow(connection.lastSyncedAt, { addSuffix: true }) : "-"}
              </TableCell>
              <TableCell>{connection.status}</TableCell>
              <TableCell className="text-right">
                <ManageConnectionMenu id={connection.id} tenant={tenant} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
