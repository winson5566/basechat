"use client";

import React from "react";

import AddConnectorMenu from "./add-connector-menu";

interface Connection { id: string, name: string, sourceType: string };

const list = async () => {
  const res = await fetch("/api/connections");
  return await res.json() as Connection[];
}

export default function ConnectionList() {
  const [connections, setConnections] = React.useState<Connection[]>([]);

  React.useEffect(() => {
    list().then(setConnections);
  }, [setConnections]);

  return <div className="flex flex-col min-w-60 mr-4 mt-9 rounded-xl p-4 bg-white">
    <div className="font-semibold">Connections</div>
    {connections.map(connection => <div key={connection.id}>{connection.name}</div>)}
    <AddConnectorMenu className="flex-grow flex items-center justify-center" />
  </div>
}
