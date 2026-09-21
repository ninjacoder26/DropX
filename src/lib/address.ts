/**
 * Guided Kathmandu Valley delivery zones.
 * DropX delivers inside the Valley only: pick a district, then an area —
 * no free-typing, no out-of-zone surprises. Area names are unique across
 * districts so the district is always recoverable from the area alone.
 */

export interface District {
  name: string;
  areas: string[];
}

export const VALLEY_DISTRICTS: District[] = [
  {
    name: 'Kathmandu',
    areas: [
      'Thamel', 'Lazimpat', 'Baluwatar', 'Maharajgunj', 'Chabahil', 'Boudha',
      'Jorpati', 'Kapan', 'Balaju', 'Gongabu', 'Kalanki', 'Kalimati',
      'Tripureshwor', 'New Baneshwor', 'Koteshwor', 'Sinamangal', 'Gaushala',
      'Dilli Bazaar', 'Putalisadak', 'Teku', 'Sitapaila', 'Swayambhu',
    ],
  },
  {
    name: 'Lalitpur',
    areas: [
      'Pulchowk', 'Jawalakhel', 'Lagankhel', 'Kupondole', 'Jhamsikhel',
      'Sanepa', 'Nakhipot', 'Bhaisepati', 'Hattiban', 'Satdobato',
      'Ekantakuna', 'Dhobighat', 'Mangalbazar', 'Patan Dhoka', 'Imadol',
      'Tikathali', 'Gwarko', 'Harisiddhi', 'Khokana', 'Bungamati',
    ],
  },
  {
    name: 'Bhaktapur',
    areas: [
      'Kamalbinayak', 'Suryabinayak', 'Thimi', 'Madhyapur', 'Lokanthali',
      'Gatthaghar', 'Kaushaltar', 'Balkot', 'Dadhikot', 'Sipadol',
      'Sallaghari', 'Byasi', 'Taumadhi', 'Katunje', 'Jhaukhel', 'Tathali',
    ],
  },
];

export const DEFAULT_DISTRICT = 'Kathmandu';

/** Recover the district from an area name (areas are unique). */
export function districtOfArea(area: string): string | null {
  const a = area.trim().toLowerCase();
  for (const d of VALLEY_DISTRICTS) {
    if (d.areas.some((x) => x.toLowerCase() === a)) return d.name;
  }
  return null;
}

export interface GuidedAddress {
  district: string;
  area: string;
  street: string;
  postal_code: string;
}

export const EMPTY_GUIDED: GuidedAddress = {
  district: DEFAULT_DISTRICT,
  area: '',
  street: '',
  postal_code: '',
};

export function isGuidedComplete(v: GuidedAddress): boolean {
  return v.area.trim().length >= 2 && v.street.trim().length >= 3;
}
