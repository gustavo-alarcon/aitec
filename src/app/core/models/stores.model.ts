export interface Stores {
  id: string;
  address: string
  createdAt: Date
  departamento: {
    id: string;
    name: string
  }
  distrito: {
    department_id: string
    id: string
    name: string
    province_id: string
  }
  provincia: {
    department_id: string
    id: string
    name: string
  }
  schedule: string        //lun a sab 9:00am - 9:00pm
}