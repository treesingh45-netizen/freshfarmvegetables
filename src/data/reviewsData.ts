export interface ClientReviewItem {
  id: string;
  topic: string;
  quote: string;
  customerName: string;
  businessType?: string;
  verifiedBusinessType?: boolean;
  rating?: number;
  ratingVerified?: boolean;
  approved: boolean;
  featuredOnHome: boolean;
}

/**
 * Genuine, approved customer reviews for Fresh Farm Vegetables.
 * Do not add unverified customer names, businesses, star ratings, or testimonials.
 */
export const CLIENT_REVIEWS: ClientReviewItem[] = [
  {
    id: 'review-01',
    topic: 'Product Quality',
    quote:
      "Fresh Farm Vegetables provides excellent-quality produce. The vegetables are fresh, well presented, and suitable for our kitchen's daily needs.",
    customerName: 'Restaurant Customer',
    approved: true,
    featuredOnHome: true,
  },
  {
    id: 'review-02',
    topic: 'Freshness & Consistency',
    quote:
      'We appreciate the quality of their fresh vegetables and their focus on consistent supply. A helpful option for professional food businesses.',
    customerName: 'Food Business Customer',
    approved: true,
    featuredOnHome: true,
  },
  {
    id: 'review-03',
    topic: 'Customer Service',
    quote:
      'Professional communication and a good selection of local and imported vegetables make sourcing our kitchen essentials more convenient.',
    customerName: 'Hospitality Customer',
    approved: true,
    featuredOnHome: true,
  },
];

export function sanitizeReviewQuote(rawQuote: string): string {
  return rawQuote
    .trim()
    .replace(/^[“"']+/, '')
    .replace(/[”"']+$/, '')
    .trim();
}

export function getApprovedClientReviews(
  reviews: ClientReviewItem[],
  options?: { featuredOnly?: boolean; limit?: number }
): ClientReviewItem[] {
  const filtered = reviews.filter((review) => {
    if (!review.approved) return false;
    if (!sanitizeReviewQuote(review.quote) || !review.customerName.trim()) return false;
    if (options?.featuredOnly && !review.featuredOnHome) return false;
    return true;
  });

  if (typeof options?.limit === 'number' && options.limit >= 0) {
    return filtered.slice(0, options.limit);
  }
  return filtered;
}

export function getVerifiedStarRating(review: ClientReviewItem): number | null {
  if (!review.ratingVerified) return null;
  if (typeof review.rating !== 'number' || !Number.isFinite(review.rating)) return null;
  if (review.rating < 1 || review.rating > 5) return null;
  return Math.round(review.rating * 2) / 2;
}

export function getVerifiedBusinessType(review: ClientReviewItem): string | null {
  if (!review.verifiedBusinessType) return null;
  const trimmed = review.businessType?.trim();
  return trimmed ? trimmed : null;
}
