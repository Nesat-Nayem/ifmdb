import mongoose, { Document, Schema } from 'mongoose';

// Event Performer Schema
const EventPerformerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['artist', 'comedian', 'band', 'speaker', 'other'],
    default: 'artist'
  },
  image: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  }
});

// Event Organizer Schema
const EventOrganizerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  }
});

// Location Schema
const LocationSchema = new Schema({
  venueName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  }
});

// Event Interface
export interface IEvent extends Document {
  title: string;
  description: string;
  eventType: string;
  category: string;
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
  location: typeof LocationSchema;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  posterImage: string;
  galleryImages: string[];
  performers: typeof EventPerformerSchema[];
  organizers: typeof EventOrganizerSchema[];
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Event description is required']
    },
    eventType: {
      type: String,
      enum: ['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other'],
      required: [true, 'Event type is required']
    },
    category: {
      type: String,
      required: [true, 'Event category is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    },
    location: {
      type: LocationSchema,
      required: [true, 'Location is required']
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Ticket price cannot be negative']
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1']
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [0, 'Available seats cannot be negative']
    },
    posterImage: {
      type: String,
      required: [true, 'Poster image is required']
    },
    galleryImages: [{
      type: String
    }],
    performers: [EventPerformerSchema],
    organizers: [EventOrganizerSchema],
    tags: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ eventType: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isActive: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
