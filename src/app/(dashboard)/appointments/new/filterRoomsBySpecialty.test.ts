import assert from "node:assert/strict";
import test from "node:test";
import type { HisRoom } from "@/api/roomsApi";
import { filterRoomsBySpecialty } from "./types";

function makeRoom(id: string, specialtyIds: string[] = []): HisRoom {
  return {
    id,
    roomid: id,
    roomname: `Room ${id}`,
    description: null,
    updatetime: "",
    status: "ACTIVE",
    his_room_specialties: specialtyIds.map((specialtyId, index) => ({
      id: `${id}-rel-${index}`,
      specialty_id: specialtyId,
    })),
  };
}

test("returns the full list when no specialty is selected", () => {
  const rooms = [makeRoom("room-1"), makeRoom("room-2", ["specialty-1"])];
  assert.deepEqual(filterRoomsBySpecialty(rooms, ""), rooms);
});

test("narrows down to rooms whose his_room_specialties match the selected specialty", () => {
  const matching = makeRoom("room-1", ["specialty-1"]);
  const other = makeRoom("room-2", ["specialty-2"]);
  const result = filterRoomsBySpecialty([matching, other], "specialty-1");
  assert.deepEqual(result, [matching]);
});

test("falls back to the full list when no room matches the selected specialty (sparse/unassigned data)", () => {
  const rooms = [makeRoom("room-1"), makeRoom("room-2", ["specialty-2"])];
  assert.deepEqual(filterRoomsBySpecialty(rooms, "specialty-1"), rooms);
});
