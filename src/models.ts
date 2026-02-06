export type OrderStatus = 'pending' | 'preparing' | 'in_flight' | 'delivered' | 'cancelled';

export interface Location {
  lat: number;
  lon: number;
}

export interface Order {
  id: string;
  userId: string;
  items: string[];
  destination: Location;
  status: OrderStatus;
  etaMinutes?: number;
}
