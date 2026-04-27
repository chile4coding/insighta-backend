import { COUNTRY_NAME_TO_ISO } from "./queryParser";

interface GenderizeResponse {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
}

interface AgifyResponse {
  name: string;
  age: number | null;
  count: number;
}

interface NationalizeResponse {
  name: string;
  country: Array<{ country_id: string; probability: number }>;
}

interface EnrichedData {
  gender: string | null;
  genderProbability: number | null;
  sampleSize?: number | null;
  age: number | null;
  ageGroup: string | null;
  countryId: string | null;
  countryProbability: number | null;
  countryName?: string | null;
}

const ISO_TO_COUNTRY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_ISO).map(([name, iso]) => [iso, name]),
);

export async function enrichProfile(name: string): Promise<EnrichedData> {
  const [genderData, ageData, nationData] = await Promise.all([
    fetch(`https://api.genderize.io?name=${name}`).then(
      (r) => r.json() as Promise<GenderizeResponse>,
    ),
    fetch(`https://api.agify.io?name=${name}`).then(
      (r) => r.json() as Promise<AgifyResponse>,
    ),
    fetch(`https://api.nationalize.io?name=${name}`).then(
      (r) => r.json() as Promise<NationalizeResponse>,
    ),
  ]);

  if (!genderData || genderData.gender === null || genderData.count === 0) {
    throw new Error("Genderize returned an invalid response");
  }

  if (!ageData || ageData.age === null) {
    throw new Error("Agify returned an invalid response");
  }

  if (!nationData || !nationData.country || nationData.country.length === 0) {
    throw new Error("Nationalize returned an invalid response");
  }

  const sortedCountries = [...nationData.country].sort(
    (a, b) => b.probability - a.probability,
  );
  const topCountry = sortedCountries[0];

  return {
    gender: genderData.gender,
    genderProbability: genderData.probability,
    age: ageData.age,
    ageGroup: null,
    countryId: topCountry.country_id,
    countryProbability: topCountry.probability,
    countryName: ISO_TO_COUNTRY_NAME[topCountry.country_id] ?? null,
  };
}
