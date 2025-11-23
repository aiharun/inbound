export enum VehicleStatus {
  INCOMING = 'INCOMING',
  WAITING = 'WAITING',
  DOCKING = 'DOCKING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  arrivalTime: string; // ISO String (Actual arrival)
  estimatedArrivalTime?: string; // ISO String (Planned arrival)
  rampId: string | null;
  dockingStartTime?: string; // ISO String
  exitTime?: string; // ISO String
  productCount: number;
  status: VehicleStatus;
  tripCount: number;
  isUnplanned?: boolean;
}

export interface Ramp {
  id: string;
  name: string;
  status: 'FREE' | 'OCCUPIED';
  currentVehicleId: string | null;
}

export interface WarehouseStats {
  totalVehicles: number;
  avgTurnaroundMinutes: number;
  totalProducts: number;
  canceledCount: number;
  waitingCount: number;
}

export interface User {
  username: string;
  password: string; // In a real app, this should be hashed
  name: string;
  role: 'admin' | 'user';
}

export interface ActiveSession {
  username: string;
  name: string;
  loginTime: string;
  deviceAgent?: string;
}