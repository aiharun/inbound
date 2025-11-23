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
  sessionId: string; // Unique identifier for the login instance
  deviceAgent?: string;
}

export interface AdminMessage {
  id: string;
  targetUsername: string; // The user meant to receive this
  message: string;
  sentAt: string;
  sentBy: string;
}

export interface ChatMessage {
  id: string;
  senderUsername: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  actionType: 'LOGIN' | 'LOGOUT' | 'VEHICLE_ADD' | 'RAMP_ASSIGN' | 'RAMP_CLEAR' | 'CANCEL' | 'UPDATE' | 'RESET' | 'USER_MGMT';
  description: string;
  performedBy: string; // Username
  performedByName: string; // Real Name
  timestamp: string;
  metadata?: string; // Optional JSON string for extra details
}