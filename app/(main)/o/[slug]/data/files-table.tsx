import { formatDistanceToNow } from "date-fns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import ManageFileMenu from "./manage-file-menu";

interface Props {
  tenant: {
    id: string;
    slug: string;
  };
  files: any[];
}

export default async function FilesTable({ tenant, files }: Props) {
  const uploadedFiles = files.filter((file) => Object.keys(file.metadata || {}).length === 0);
  const connectorFiles = files.filter((file) => Object.keys(file.metadata || {}).length > 0);

  return (
    <div className="flex-grow w-full flex flex-col items-center mt-10">
      <div className="w-full mb-8">
        <div className="text-[14px] font-[500] text-[#1D1D1F] mb-4 pl-1">
          {files.length} {files.length === 1 ? "file" : "files"}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Name</TableHead>
              <TableHead className="w-[200px]">Date added</TableHead>
              <TableHead className="w-[200px]">Last synced</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploadedFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center">
                  <div>{file.name}</div>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</TableCell>
                <TableCell>
                  {file.lastSyncedAt ? formatDistanceToNow(file.lastSyncedAt, { addSuffix: true }) : "-"}
                </TableCell>
                <TableCell>{file.status}</TableCell>
                <TableCell className="text-right">
                  <ManageFileMenu id={file.id} tenant={tenant} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* <div className="w-full">
        <h2 className="text-lg font-semibold mb-4">Connector Files</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Name</TableHead>
              <TableHead className="w-[200px]">Date added</TableHead>
              <TableHead className="w-[200px]">Last synced</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connectorFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center">
                  <div>{file.name}</div>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</TableCell>
                <TableCell>
                  {file.lastSyncedAt ? formatDistanceToNow(file.lastSyncedAt, { addSuffix: true }) : "-"}
                </TableCell>
                <TableCell>{file.status}</TableCell>
                <TableCell className="text-right">
                  <ManageFileMenu id={file.id} tenant={tenant} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div> */}
    </div>
  );
}
