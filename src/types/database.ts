export type Park = {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  owner_user_id: string | null;
  venmo_username: string | null;
  address: string | null;
  timezone: string;
  created_at: string;
};

export type Pedestal = {
  id: string;
  park_id: string;
  pedestal_number: number;
  amp_rating: number;
  has_water: boolean;
  water_device_id: string | null;
  electric_device_id: string | null;
  price_day_cents: number;
  price_week_cents: number;
  price_month_cents: number;
  status: "available" | "occupied" | "maintenance";
  created_at: string;
};

export type Session = {
  id: string;
  pedestal_id: string;
  park_id: string;
  guest_email: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  duration: "day" | "week" | "month";
  start_time: string;
  end_time: string;
  amount_cents: number;
  platform_fee_cents: number;
  payment_method: string;
  payment_reference: string | null;
  status: "pending" | "active" | "expired" | "cancelled" | "extended";
  water_on: boolean;
  electric_on: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  session_id: string;
  park_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_to_owner_cents: number;
  payment_method: string;
  payment_reference: string | null;
  status: "pending" | "completed" | "refunded";
  created_at: string;
};

export type IoTCommand = {
  id: string;
  pedestal_id: string;
  session_id: string | null;
  command: "activate" | "deactivate";
  device_type: "water" | "electric" | "both";
  status: "sent" | "confirmed" | "failed";
  response: Record<string, unknown> | null;
  created_at: string;
};

export type PedestalWithPark = Pedestal & { gorv_parks: Park };
export type SessionWithPedestal = Session & { gorv_pedestals: Pedestal };

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getDurationLabel(duration: string): string {
  switch (duration) {
    case "day": return "1 Day";
    case "week": return "1 Week";
    case "month": return "1 Month";
    default: return duration;
  }
}

export function getDurationHours(duration: string): number {
  switch (duration) {
    case "day": return 24;
    case "week": return 168;
    case "month": return 720;
    default: return 24;
  }
}
