export interface City {
  name: string;
  tier: 1 | 2 | 3;
}

export interface StateLocations {
  state: string;
  cities: City[];
}

export const STATE_LOCATIONS_DATABASE: StateLocations[] = [
  {
    state: "Telangana",
    cities: [
      { name: "Hyderabad", tier: 1 },
      { name: "Warangal", tier: 2 },
      { name: "Karimnagar", tier: 3 },
      { name: "Nizamabad", tier: 3 },
      { name: "Adilabad", tier: 3 },
      { name: "Khammam", tier: 3 },
      { name: "Mancherial", tier: 3 }
    ]
  },
  {
    state: "Andhra Pradesh",
    cities: [
      { name: "Visakhapatnam", tier: 2 },
      { name: "Vijayawada", tier: 2 },
      { name: "Tirupati", tier: 3 }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      { name: "Bengaluru", tier: 1 },
      { name: "Mysore", tier: 2 },
      { name: "Hubli", tier: 2 }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      { name: "Mumbai", tier: 1 },
      { name: "Pune", tier: 1 },
      { name: "Nagpur", tier: 2 },
      { name: "Nanded", tier: 3 }
    ]
  },
  {
    state: "Delhi",
    cities: [
      { name: "Delhi", tier: 1 }
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      { name: "Chennai", tier: 1 }
    ]
  },
  {
    state: "West Bengal",
    cities: [
      { name: "Kolkata", tier: 1 }
    ]
  },
  {
    state: "Gujarat",
    cities: [
      { name: "Ahmedabad", tier: 1 },
      { name: "Surat", tier: 1 }
    ]
  },
  {
    state: "Rajasthan",
    cities: [
      { name: "Jaipur", tier: 2 }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      { name: "Lucknow", tier: 2 }
    ]
  },
  {
    state: "Chandigarh",
    cities: [
      { name: "Chandigarh", tier: 2 }
    ]
  },
  {
    state: "Kerala",
    cities: [
      { name: "Kochi", tier: 2 }
    ]
  },
  {
    state: "Madhya Pradesh",
    cities: [
      { name: "Indore", tier: 2 }
    ]
  }
];

export const ALL_CITIES_LIST: string[] = STATE_LOCATIONS_DATABASE.reduce<string[]>((acc, stateLoc) => {
  stateLoc.cities.forEach(city => acc.push(city.name));
  return acc;
}, []);

export function searchLocations(query: string): StateLocations[] {
  if (!query.trim()) return STATE_LOCATIONS_DATABASE;
  const term = query.toLowerCase();

  return STATE_LOCATIONS_DATABASE.map(stateLoc => {
    const stateMatches = stateLoc.state.toLowerCase().includes(term);
    const filteredCities = stateLoc.cities.filter(city =>
      stateMatches || city.name.toLowerCase().includes(term)
    );

    return {
      state: stateLoc.state,
      cities: filteredCities
    };
  }).filter(stateLoc => stateLoc.cities.length > 0);
}
