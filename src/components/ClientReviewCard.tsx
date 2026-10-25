import React from 'react';
import {
  ClientReviewItem,
  getVerifiedBusinessType,
  getVerifiedStarRating,
  sanitizeReviewQuote,
} from '../data/reviewsData';

interface ClientReviewCardProps {
  review: ClientReviewItem;
}

export function ClientReviewCard({ review }: ClientReviewCardProps) {
  const cleanQuote = sanitizeReviewQuote(review.quote);
  const verifiedRating = getVerifiedStarRating(review);
  const verifiedBusinessType = getVerifiedBusinessType(review);
  const cleanTopic = review.topic.trim();

  return (
    <article className="group h-full bg-white rounded-2xl border border-[#E4EAE4] shadow-[0_10px_30px_-18px_rgba(15,83,56,0.12)] p-7 sm:p-8 lg:p-9 flex flex-col justify-between transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[#12B326]/45 hover:shadow-[0_18px_38px_-18px_rgba(15,83,56,0.18)]">
      <div>
        {/* Subtle quotation mark & optional genuine rating or unboxed review focus */}
        <div className="flex items-center justify-between gap-4">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center text-[#12B326]/75 group-hover:text-[#0F5338] transition-colors duration-200"
          >
            <svg
              width="28"
              height="22"
              viewBox="0 0 28 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-5 sm:w-7 sm:h-[22px]"
            >
              <path
                d="M11.4 1.6C6.1 3.3 2.6 7.5 2.6 13.4C2.6 17.7 5.2 20.4 8.6 20.4C11.5 20.4 13.6 18.4 13.6 15.6C13.6 12.9 11.7 11.1 9.3 11.1C8.5 11.1 7.7 11.3 7.2 11.6C7.5 8.1 9.7 5.3 12.8 3.9L11.4 1.6ZM25.2 1.6C19.9 3.3 16.4 7.5 16.4 13.4C16.4 17.7 19 20.4 22.4 20.4C25.3 20.4 27.4 18.4 27.4 15.6C27.4 12.9 25.5 11.1 23.1 11.1C22.3 11.1 21.5 11.3 21 11.6C21.3 8.1 23.5 5.3 26.6 3.9L25.2 1.6Z"
                fill="currentColor"
              />
            </svg>
          </span>

          {verifiedRating !== null ? (
            <div
              role="img"
              aria-label={`Rated ${verifiedRating} out of 5 stars`}
              className="inline-flex items-center gap-1 text-[#12B326]"
            >
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const filled = verifiedRating >= starIndex;
                return (
                  <svg
                    key={starIndex}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`w-3.5 h-3.5 ${
                      filled ? 'fill-[#12B326] text-[#12B326]' : 'fill-none text-[#CED8CE]'
                    }`}
                  >
                    <path
                      d="M10 1.75L12.47 6.76L18 7.57L14 11.46L14.94 16.97L10 14.37L5.06 16.97L6 11.46L2 7.57L7.53 6.76L10 1.75Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                );
              })}
            </div>
          ) : cleanTopic ? (
            <span className="font-sans text-xs font-medium tracking-[0.02em] text-[#687268]">
              {cleanTopic}
            </span>
          ) : null}
        </div>

        {/* Customer review text */}
        <blockquote className="mt-5 mb-7 font-sans text-[15.5px] sm:text-base text-[#202820] leading-[1.78] font-normal">
          {cleanQuote}
        </blockquote>
      </div>

      {/* Customer attribution & conditional verified business type */}
      <footer className="pt-5 border-t border-[#EDF2ED]">
        <p className="font-sans text-[15px] font-semibold text-[#0F5338] leading-snug">
          {review.customerName}
        </p>
        {(verifiedBusinessType || (verifiedRating !== null && cleanTopic)) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-xs text-[#687268]">
            {verifiedBusinessType && <span>{verifiedBusinessType}</span>}
            {verifiedBusinessType && verifiedRating !== null && cleanTopic && (
              <span aria-hidden="true">·</span>
            )}
            {verifiedRating !== null && cleanTopic && <span>{cleanTopic}</span>}
          </div>
        )}
      </footer>
    </article>
  );
}
