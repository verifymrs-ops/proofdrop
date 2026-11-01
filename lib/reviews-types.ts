export interface Review {
  id: string;
  name: string;
  role?: string;
  rating: number;
  title: string;
  body: string;
  useCase?: string;
  email?: string;
  createdAt: string;
  published: boolean;
  helpful: number;
  userAgent?: string;
}

export interface ReviewPublic {
  id: string;
  name: string;
  role?: string;
  rating: number;
  title: string;
  body: string;
  useCase?: string;
  createdAt: string;
  helpful: number;
}

export interface ReviewInput {
  name: string;
  role?: string;
  rating: number;
  title: string;
  body: string;
  useCase?: string;
  email?: string;
}

export interface ReviewStats {
  total: number;
  published: number;
  averageRating: number;
  requestedFeatures: { feature: string; count: number }[];
  useCases: { name: string; count: number }[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewSubmissionResponse {
  ok: boolean;
  review?: ReviewPublic;
  error?: string;
}

export function toPublicReview(review: Review): ReviewPublic {
  return {
    id: review.id,
    name: review.name,
    role: review.role,
    rating: review.rating,
    title: review.title,
    body: review.body,
    useCase: review.useCase,
    createdAt: review.createdAt,
    helpful: review.helpful,
  };
}
