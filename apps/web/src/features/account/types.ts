export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  preferredCity?: string | null;
  preferredLanguage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileInput {
  username?: string;
  phone?: string;
  avatar?: string;
  preferredCity?: string;
  preferredLanguage?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface SessionItem {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface BookingSeatItem {
  showSeat: {
    price: number;
    seat: {
      row: string;
      number: number;
      type: string;
    };
  };
}

export interface TicketItem {
  id: string;
  ticketNumber: string;
  qrCode?: string;
  status: string;
}

export interface BookingItem {
  id: string;
  totalAmount: number;
  status: "CONFIRMED" | "CANCELLED" | "PENDING" | "REFUNDED" | "FAILED";
  createdAt: string;
  show: {
    id: string;
    startTime: string;
    endTime: string;
    movie: {
      id: string;
      title: string;
      posterUrl?: string;
      language?: string;
      genre?: string;
      duration?: number;
    };
    screen: {
      id: string;
      name: string;
      theater: {
        id: string;
        name: string;
        city: string;
      };
    };
  };
  bookingSeats: BookingSeatItem[];
  payment?: {
    id: string;
    status: string;
    amount: number;
    paymentMethod?: string;
  } | null;
  tickets: TicketItem[];
}

export const CITIES = [
  "Ahmedabad",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Pune",
  "Surat",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Kochi",
  "Navsari",
] as const;

export const LANGUAGES = [
  "Hindi",
  "English",
  "Gujarati",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Punjabi",
] as const;
