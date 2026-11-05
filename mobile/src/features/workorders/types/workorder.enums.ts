//workorder.enum.ts
export enum SystemType {
  System1 = 1,
  System2 = 2,
}

export enum JobType {
  Montage = 1,
  Replace = 2,
  Fault = 3,
}

export enum ObjectType {
  Vehicle = 1,
  Device = 2,
  Sensor = 3,
}

// Backend ile birebir: 1=Gps, 2=Network, 3=Manual
export enum LocationSource {
  Gps = 1,
  Network = 2,
  Manual = 3,
}
 
