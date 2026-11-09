export interface LocationOption {
  id: string;
  name: string;
}

export interface LocationGroup {
  county: string;
  locations: LocationOption[];
}

export const RENTAL_LOCATION_GROUPS: LocationGroup[] = [
  {
    county: "Nairobi",
    locations: [
      { id: "nairobi_cbd", name: "Nairobi CBD" },
      { id: "westlands", name: "Westlands" },
      { id: "kilimani", name: "Kilimani" },
      { id: "upper_hill", name: "Upper Hill" },
      { id: "hurlingham", name: "Hurlingham" },
      { id: "kileleshwa", name: "Kileleshwa" },
      { id: "lavington", name: "Lavington" },
      { id: "parklands", name: "Parklands" },
      { id: "spring_valley", name: "Spring Valley" },
      { id: "gigiri", name: "Gigiri" },
      { id: "kitisuru", name: "Kitisuru" },
      { id: "runda", name: "Runda" },
      { id: "muthaiga", name: "Muthaiga" },
      { id: "karen", name: "Karen" },
      { id: "langata", name: "Lang'ata" },
      { id: "south_c", name: "South C" },
      { id: "south_b", name: "South B" },
      { id: "embakasi", name: "Embakasi" },
      { id: "umoja", name: "Umoja" },
      { id: "buruburu", name: "Buruburu" },
      { id: "donholm", name: "Donholm" },
      { id: "komarock", name: "Komarock" },
      { id: "kasarani", name: "Kasarani" },
      { id: "roysambu", name: "Roysambu" },
      { id: "thome", name: "Thome" },
      { id: "ruai", name: "Ruai" },
      { id: "kawangware", name: "Kawangware" },
      { id: "dagoretti", name: "Dagoretti" },
      { id: "uthiru", name: "Uthiru" },
      { id: "jkia", name: "Jomo Kenyatta International Airport (JKIA)" },
      { id: "wilson_airport", name: "Wilson Airport" },
    ],
  },
  {
    county: "Kiambu County",
    locations: [
      { id: "kiambu_town", name: "Kiambu Town" },
      { id: "ruaka", name: "Ruaka" },
      { id: "ndenderu", name: "Ndenderu" },
      { id: "banana", name: "Banana Hill" },
      { id: "limuru", name: "Limuru" },
      { id: "kikuyu", name: "Kikuyu" },
      { id: "thika", name: "Thika" },
      { id: "juja", name: "Juja" },
      { id: "ruiru", name: "Ruiru" },
      { id: "kahawa_wendani", name: "Kahawa Wendani" },
      { id: "kahawa_sukari", name: "Kahawa Sukari" },
      { id: "githurai", name: "Githurai" },
      { id: "githunguri", name: "Githunguri" },
      { id: "gatundu", name: "Gatundu" },
    ],
  },
  {
    county: "Machakos County",
    locations: [
      { id: "syokimau", name: "Syokimau" },
      { id: "mombasa_road", name: "Mombasa Road" },
      { id: "mlolongo", name: "Mlolongo" },
      { id: "sabaki", name: "Sabaki" },
      { id: "athi_river", name: "Athi River" },
      { id: "mavoko", name: "Mavoko" },
      { id: "kitengela", name: "Kitengela" },
      { id: "machakos_town", name: "Machakos Town" },
      { id: "masii", name: "Masii" },
      { id: "kangundo", name: "Kangundo" },
      { id: "tala", name: "Tala" },
      { id: "matuu", name: "Matuu" },
      { id: "joska", name: "Joska" },
      { id: "malaa", name: "Malaa" },
      { id: "daystar", name: "Daystar University (Athi River)" },
    ],
  },
  {
    county: "Kajiado County",
    locations: [
      { id: "ngong", name: "Ngong" },
      { id: "ongata_rongai", name: "Ongata Rongai" },
      { id: "kiserian", name: "Kiserian" },
      { id: "namanga", name: "Namanga" },
      { id: "isinya", name: "Isinya" },
      { id: "athi_kapiti", name: "Athi-Kapiti" },
    ],
  },
  {
    county: "Murang'a County",
    locations: [
      { id: "muranga_town", name: "Murang'a Town" },
      { id: "kenol", name: "Kenol" },
      { id: "maragua", name: "Maragua" },
      { id: "makuyu", name: "Makuyu" },
    ],
  },
];
