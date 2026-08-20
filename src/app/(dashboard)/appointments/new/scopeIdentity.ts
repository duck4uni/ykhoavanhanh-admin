type ScopeIdentity = {
  clientId: string;
  specialty_id: string;
  area_id: string;
  room_id: string;
  service_id: string;
  price_level_code: string;
};

export function isDuplicateScope(
  scopes: ScopeIdentity[],
  candidate: ScopeIdentity,
  editingScopeId: string | null
): boolean {
  return scopes.some((scope) =>
    scope.clientId !== editingScopeId
    && scope.specialty_id === candidate.specialty_id
    && scope.area_id === candidate.area_id
    && scope.room_id === candidate.room_id
    && scope.service_id === candidate.service_id
    && scope.price_level_code === candidate.price_level_code
  );
}
