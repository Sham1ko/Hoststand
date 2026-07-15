"use client";

import { useState } from "react";

import { FloorMap } from "@/components/floor-map/floor-map";
import { ReservationsSidebar } from "@/components/reservations-sidebar/reservations-sidebar";

export function RestaurantWorkspace() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <main className="flex min-h-0 flex-1">
      <FloorMap isEditing={isEditing} onEditingChange={setIsEditing} />
      {!isEditing && <ReservationsSidebar />}
    </main>
  );
}
