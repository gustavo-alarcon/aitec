/**
 * Firestore document
 * Path of collection: /db/aitec/config/generalConfig
 */
export interface GeneralConfig{
  categories: object[];
  salesRCounter: number;
  buysCounter: number;
  maxWeight: number;
  lastVersion: string;
  news: {
    visible: boolean,
    imageURL: string
  }
}

/**
 * Firestore document
 * Path of collection: /db/aitec/config/salesCorrelative
 */
export interface SalesCorrelative{
  rCorrelative: number;
}