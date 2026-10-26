import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CLIENT_REVIEWS,
  ClientReviewItem,
  getApprovedClientReviews,
} from '../constants/reviewsData';
import { ClientReviewCard } from './ClientReviewCard';

interface ClientReviewsSectionProps {
  reviews?: ClientReviewItem[];
  featuredOnly?: boolean;
  limit?: number;
  headingTag?: 'h1' | 'h2';
}

export function ClientReviewsSection({
  reviews = CLIENT_REVIEWS,
  featuredOnly = false,
  limit = 3,
  headingTag = 'h2',
}: ClientReviewsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (typeof IntersectionObserver === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  useEffect(() => {
    if (isRevealed) return;
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -24px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isRevealed]);

  const approvedReviews = useMemo(
    () => getApprovedClientReviews(reviews, { featuredOnly, limit }),
    [reviews, featuredOnly, limit]
  );

  const HeadingTag = headingTag;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="trusted-customers-heading"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Section Heading */}
      <div
        className={`max-w-2xl mx-auto text-center mb-10 sm:mb-12 lg:mb-14 ${
          isRevealed ? 'ffv-review-header-enter' : 'ffv-review-pre'
        }`}
      >
        <p className="font-signature text-[1.75rem] sm:text-[2rem] text-[#12B326] py-0.5">
          Trusted by Our Customers
        </p>
        <HeadingTag
          id="trusted-customers-heading"
          className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12] text-balance mt-1 mb-4"
        >
          Fresh Quality. Lasting Relationships.
        </HeadingTag>
        <p className="font-sans text-sm sm:text-base text-[#5C665E] leading-[1.7] max-w-xl mx-auto text-pretty">
          We value the trust of our customers and are committed to providing quality fresh produce and dependable service to professional kitchens.
        </p>
      </div>

      {/* Review Cards Grid or Ready-for-Content Empty State */}
      {approvedReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          {approvedReviews.map((review, index) => {
            const staggerClass =
              index === 0
                ? 'ffv-review-enter-1'
                : index === 1
                ? 'ffv-review-enter-2'
                : 'ffv-review-enter-3';

            return (
              <div
                key={review.id}
                className={`h-full ${isRevealed ? staggerClass : 'ffv-review-pre'}`}
              >
                <ClientReviewCard review={review} />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`max-w-3xl mx-auto bg-white rounded-2xl border border-[#E4EAE4] shadow-[0_10px_30px_-18px_rgba(15,83,56,0.10)] p-8 sm:p-10 text-center ${
            isRevealed ? 'ffv-review-enter-1' : 'ffv-review-pre'
          }`}
        >
          <p className="font-display text-xl sm:text-2xl font-semibold text-[#0F5338] mb-2">
            Verified Kitchen Feedback
          </p>
          <p className="font-sans text-sm sm:text-base text-[#687268] leading-relaxed max-w-lg mx-auto">
            Customer testimonials from our restaurant, hotel, and hospitality partners are published here once verified and approved.
          </p>
        </div>
      )}
    </section>
  );
}
