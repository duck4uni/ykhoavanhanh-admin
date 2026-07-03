/**
 * Addresses API - Get nations, professions, provinces, districts, wards
 */

import { apiGet } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Nation {
  nationid: string;
  nationname: string;
}

export interface Profession {
  professionid: string;
  professionname: string;
}

export interface Country {
  countrycode: string;
  countryname: string;
}

export interface Province {
  city: string;
  cityname: string;
}

export interface District {
  city: string;
  districtcode: string;
  districtname: string | null;
  type: string | null;
}

export interface Ward {
  districtcode: string;
  wardcode: string;
  wardname: string | null;
  type: string | null;
}

interface OpenApiProvince {
  code: number;
  name: string;
}

interface OpenApiWard {
  code: number;
  name: string;
  province_code: number;
}

type ListResponse<T> = T[] | { rows: T[] };

function unwrapList<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.rows ?? [];
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const addressKeys = {
  nations: ["addresses", "nations"] as const,
  professions: ["addresses", "professions"] as const,
  countries: ["addresses", "countries"] as const,
  provinces: ["addresses", "provinces"] as const,
  districts: (city: string) => ["addresses", "districts", city] as const,
  wards: (districtcode: string) => ["addresses", "wards", districtcode] as const,
};

// ─── Service Functions ─────────────────────────────────────────────────────

async function fetchNations(): Promise<Nation[]> {
  const res = await apiGet<ListResponse<Nation>>("/nation");
  if (res.data.status === "success" && res.data.responseData) {
    return unwrapList(res.data.responseData);
  }
  throw new Error(res.data.message || "Khong the lay danh sach dan toc");
}

async function fetchProfessions(): Promise<Profession[]> {
  const res = await apiGet<ListResponse<Profession>>("/profession");
  if (res.data.status === "success" && res.data.responseData) {
    return unwrapList(res.data.responseData);
  }
  throw new Error(res.data.message || "Khong the lay danh sach nghe nghiep");
}

async function fetchCountries(): Promise<Country[]> {
  const res = await apiGet<ListResponse<Country>>("/countries");
  if (res.data.status === "success" && res.data.responseData) {
    return unwrapList(res.data.responseData);
  }
  throw new Error(res.data.message || "Khong the lay danh sach quoc gia");
}

async function fetchProvinces(): Promise<Province[]> {
  const res = await fetch("https://provinces.open-api.vn/api/v2/p/");
  if (!res.ok) throw new Error("Không thể lấy danh sách tỉnh/thành");
  const data = (await res.json()) as OpenApiProvince[];
  return data.map((p) => ({ city: String(p.code), cityname: p.name }));
}

async function fetchDistricts(city: string): Promise<District[]> {
  // Province Open API v2 không còn cấp quận/huyện sau sáp nhập 07/2025.
  // Giữ hook này để tương thích code cũ, form mới sẽ không dùng nữa.
  return [{ city, districtcode: city, districtname: null, type: null }];
}

async function fetchWards(provinceCode: string): Promise<Ward[]> {
  const url = new URL("https://provinces.open-api.vn/api/v2/w/");
  url.searchParams.set("province", provinceCode);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Không thể lấy danh sách phường/xã");
  const data = (await res.json()) as OpenApiWard[];
  return data.map((w) => ({
    districtcode: String(w.province_code),
    wardcode: String(w.code),
    wardname: w.name,
    type: null,
  }));
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useNations() {
  return useQuery({
    queryKey: addressKeys.nations,
    queryFn: fetchNations,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useProfessions() {
  return useQuery({
    queryKey: addressKeys.professions,
    queryFn: fetchProfessions,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: addressKeys.countries,
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: addressKeys.provinces,
    queryFn: fetchProvinces,
    staleTime: 1000 * 60 * 60,
  });
}

export function useDistricts(city: string | null) {
  return useQuery({
    queryKey: addressKeys.districts(city ?? ""),
    queryFn: () => fetchDistricts(city!),
    enabled: Boolean(city),
    staleTime: 1000 * 60 * 60,
  });
}

export function useWards(districtcode: string | null) {
  return useQuery({
    queryKey: addressKeys.wards(districtcode ?? ""),
    queryFn: () => fetchWards(districtcode!),
    enabled: Boolean(districtcode),
    staleTime: 1000 * 60 * 60,
  });
}