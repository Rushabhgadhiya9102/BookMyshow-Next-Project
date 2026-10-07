export interface ShowPriceItem {
  tier: string;
  price: number;
}

export interface ShowtimeItem {
  id: string;
  startTime: string;
  endTime: string;
  screenName: string;
  screenType: string;
  prices: ShowPriceItem[];
}

export interface TheaterItem {
  id: string;
  name: string;
  address: string;
  amenities: string[];
  shows: ShowtimeItem[];
}

export interface MovieTheatersResponse {
  movie: {
    id: string;
    title: string;
    posterUrl?: string;
    durationMinutes?: number;
    language?: string;
    certification?: string;
  };
  city: string;
  date: string;
  theaters: TheaterItem[];
  status: number;
}

export interface ShowSeatGridItem {
  showSeatId: string;
  seatId: string;
  seatNumber: string;
  rowLabel: string;
  seatType: string;
  tier: string;
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
}

export interface ShowSeatsResponse {
  show: {
    id: string;
    startTime: string;
    endTime: string;
    movie: {
      id: string;
      title: string;
      posterUrl?: string;
      durationMinutes?: number;
      language?: string;
      certification?: string;
    };
    screen: {
      id: string;
      name: string;
      screenType: string;
    };
    theater: {
      id: string;
      name: string;
      address: string;
    };
  };
  prices: ShowPriceItem[];
  seats: ShowSeatGridItem[];
  status: number;
}
