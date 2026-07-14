import { updateRestaurantFloorStructure } from "@/entities/restaurant/model/floor-structure-actions";
import { createRestaurantSeed } from "@/entities/restaurant/seed/restaurant-seed";

describe("floor structure actions", () => {
  it("updates floor and zone details atomically", () => {
    const state = createRestaurantSeed();
    const nextState = updateRestaurantFloorStructure(state, {
      floors: state.floors.map((floor) =>
        floor.id === "floor-1" ? { ...floor, name: "Главный этаж" } : floor,
      ),
      zones: state.zones.map((zone) =>
        zone.id === "zone-main-hall"
          ? { ...zone, name: "Основной зал", color: "#4ba3df" }
          : zone,
      ),
      activeFloorId: state.activeFloorId,
    });

    expect(nextState?.floors.find((floor) => floor.id === "floor-1")?.name)
      .toBe("Главный этаж");
    expect(nextState?.zones.find((zone) => zone.id === "zone-main-hall")?.color)
      .toBe("#4ba3df");
  });

  it("does not delete a floor that still contains tables", () => {
    const state = createRestaurantSeed();

    expect(
      updateRestaurantFloorStructure(state, {
        floors: state.floors.filter((floor) => floor.id !== "floor-1"),
        zones: state.zones.filter((zone) => zone.floorId !== "floor-1"),
        activeFloorId: "floor-2",
      }),
    ).toBeNull();
  });

  it("deletes an empty floor together with its zones", () => {
    const state = createRestaurantSeed();
    const emptyFloor = {
      id: "empty-floor",
      name: "Пустой этаж",
      sortOrder: 4,
      isActive: true,
    };
    const stateWithEmptyFloor = {
      ...state,
      floors: [...state.floors, emptyFloor],
      zones: [
        ...state.zones,
        {
          id: "empty-zone",
          floorId: emptyFloor.id,
          name: "Пустая зона",
          color: "#4ba3df",
          sortOrder: 1,
          isActive: true,
          rect: { x: 0, y: 0, w: 400, h: 260 },
        },
      ],
    };

    const nextState = updateRestaurantFloorStructure(stateWithEmptyFloor, {
      floors: state.floors,
      zones: state.zones,
      activeFloorId: state.activeFloorId,
    });

    expect(nextState?.floors).not.toContainEqual(emptyFloor);
    expect(nextState?.zones.some((zone) => zone.id === "empty-zone")).toBe(false);
  });
});
