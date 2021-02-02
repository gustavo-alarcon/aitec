import { Unit, PackageUnit } from './unit.model';

export interface GeneralConfig{
  categories: object[];
  units: Unit[];
  packagesUnits: PackageUnit[];
  salesRCounter: number;
  buysCounter: number;
  maxWeight: number;
  lastVersion: string;
  news: {
    visible: boolean,
    imageURL: string
  }
}