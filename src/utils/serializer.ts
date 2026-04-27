interface ProfileFields {
  id: string;
  name: string;
  gender: string | null;
  age: number | null;
  ageGroup: string | null;
  countryId: string | null;
  countryName?: string | null;
  genderProbability?: number | null;
  sampleSize?: number | null;
  countryProbability?: number | null;
  createdAt?: Date | string | null;
}

interface SnakecaseProfile {
  id: string;
  name: string;
  gender: string | null;
  age: number | null;
  age_group: string | null;
  country_id: string | null;
  country_name: string | null;
  gender_probability: number | null;
  sample_size?: number | null;
  country_probability: number | null;
  created_at: string;
}

export function toSnake(profile: ProfileFields): SnakecaseProfile {
  const createdAt = profile.createdAt
    ? profile.createdAt instanceof Date
      ? profile.createdAt.toISOString()
      : profile.createdAt
    : new Date().toISOString();

  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    age_group: profile.ageGroup,
    country_id: profile.countryId,
    country_name: profile.countryName ?? null,
    gender_probability: profile.genderProbability ?? null,
    // sample_size: profile.sampleSize ?? null,
    country_probability: profile.countryProbability
      ? Number(profile.countryProbability.toFixed(2))
      : null,
    created_at: createdAt,
  };
}

export function toSnakeList(profile: ProfileFields): Partial<SnakecaseProfile> {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    age_group: profile.ageGroup,
    country_id: profile.countryId,
    country_name: profile.countryName ?? null,
    country_probability: profile.countryProbability
      ? Number(profile.countryProbability.toFixed(2))
      : null,
    gender_probability: profile.genderProbability ?? null,
    created_at: profile?.createdAt
      ? profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : profile.createdAt
      : "",
  };
}
