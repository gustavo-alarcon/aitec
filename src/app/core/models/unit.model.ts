export interface Unit {
  description: string;
  abbreviation: string;
  weight: number;       //Peso en Kilos
}

export interface PackageUnit {
  description: string;
  abbreviation: string;
  weight?: number;       //Peso en Kilos
}