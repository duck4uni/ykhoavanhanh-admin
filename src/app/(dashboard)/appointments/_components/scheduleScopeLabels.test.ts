import assert from "node:assert/strict";
import test from "node:test";
import { getScheduleScopeLabels, summarizeScopeLabels } from "./scheduleScopeLabels";

test("extracts and deduplicates service names from raw scopes", () => {
  const result = getScheduleScopeLabels({
    scopes: [
      { service_name: "Kham MeU", service: { service_name: "Tên nested bị bỏ qua" } },
      { service: { service_name: "KHÁM TEST" } },
      { service_name: "Kham MeU" },
    ],
  });

  assert.deepEqual(result.serviceLabels, ["Kham MeU", "KHÁM TEST"]);
});

test("prefers room names and falls back to room ids", () => {
  const result = getScheduleScopeLabels({
    scopes: [
      { room_name: "Phòng 101", room_id: "room-ignored" },
      { room: { room_name: "Phòng 102" }, room_id: "room-102" },
      { room: { roomname: "Phòng 103" }, room_id: "room-103" },
      { room_id: "room-104" },
    ],
  });

  assert.deepEqual(result.roomLabels, ["Phòng 101", "Phòng 102", "Phòng 103", "room-104"]);
});

test("resolves room id to room name via roomLookup", () => {
  const lookup = new Map([
    ["room-104", "Phòng 104 - Ngoại"],
    ["legacy-room", "Phòng 101 - Khám Tổng Quát"],
  ]);
  const result = getScheduleScopeLabels(
    {
      scopes: [{ room_id: "room-104" }],
    },
    undefined,
    lookup
  );
  assert.deepEqual(result.roomLabels, ["Phòng 104 - Ngoại"]);

  const fallback = getScheduleScopeLabels(null, "legacy-room", lookup);
  assert.deepEqual(fallback.roomLabels, ["Phòng 101 - Khám Tổng Quát"]);
});

test("extracts room names directly from schedule item payload as returned by API", () => {
  const apiItem = {
    id: "b4a81a21-ac4f-4391-9c6d-aa4620487eda",
    room_name: "PK - P204 NỘI",
    room: {
      id: "db5de58b-23b8-473d-b4ba-81db3282516b",
      room_id: "098",
      room_name: "PK - P204 NỘI"
    },
    scopes: [
      {
        room_name: "PK - P204 NỘI",
        service_name: "Kham MeU",
        room: {
          room_name: "PK - P204 NỘI"
        }
      }
    ]
  };

  const result = getScheduleScopeLabels(apiItem);
  assert.deepEqual(result.roomLabels, ["PK - P204 NỘI"]);
  assert.deepEqual(result.serviceLabels, ["Kham MeU"]);
});

test("uses the legacy room id and handles missing scope data", () => {
  assert.deepEqual(getScheduleScopeLabels(null, "legacy-room"), {
    roomLabels: ["legacy-room"],
    serviceLabels: [],
  });
  assert.deepEqual(getScheduleScopeLabels({ invalid: true }), {
    roomLabels: [],
    serviceLabels: [],
  });
});

test("summarizes the first label and exposes the full list", () => {
  assert.deepEqual(summarizeScopeLabels(["Kham MeU", "KHÁM TEST"]), {
    text: "Kham MeU +1",
    title: "Kham MeU, KHÁM TEST",
  });
  assert.deepEqual(summarizeScopeLabels([]), { text: "—", title: undefined });
});
