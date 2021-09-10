export interface delivery {
  createdAt: Date;
  deliverY: number;
  departamento: {
    id: string;
    name: string
  };
  distritos: {
    department_id: string;
    id: string;
    name: string;
    province_ide: string
  }[];
  id: string;
  provincia: {
    dapartment_id: string;
    id: string;
    name: string
  }
}