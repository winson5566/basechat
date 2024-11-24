"use client";

import usePolling from "@eballoi/react-use-polling";
import React from "react";

import AddConnectorMenu from "./add-connector-menu";

const POLL_INTERVAL = 50000;

interface Connection {
  id: string;
  name: string;
  sourceType: string;
  status: string;
}

export default function ConnectionList() {
  const { data } = usePolling(
    async () => {
      const res = await fetch("/api/connections");
      return (await res.json()) as Connection[];
    },
    { interval: POLL_INTERVAL },
  );

  const connections: Connection[] = data ?? [];

  return (
    <div className="flex flex-col min-w-60 mr-4 mt-9 rounded-xl p-4 bg-white">
      <div className="font-semibold">Connections</div>
      {connections.map((connection) => (
        <div key={connection.id}>
          {connection.name}
          {connection.status === "syncing" ? "..." : ""}
        </div>
      ))}
      <AddConnectorMenu className="flex-grow flex items-center justify-center" />
    </div>
  );
}
