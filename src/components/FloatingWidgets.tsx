import React, { useEffect, useState } from 'react';
import { Award, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeDigitsPhone } from '../utils/commerce';

export function FloatingWidgets() {
  const { settings, user, currentPath, isCartDrawerOpen, navigate } = useStore();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isCartDrawerOpen || currentPath === '/checkout') {
    return null;
  }

  const digits = normalizeDigitsPhone(settings.whatsappIntl || '+923334934403');
  const whatsappHref = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hello Fresh Farm Vegetables, I would like to inquire about today's vegetable rates and supply options in Lahore."
  )}`;

  return (
    <>
      {/* Bottom-Left Sign-In / Account Quick Pill (matching reference footer corner) */}
      {currentPath !== '/account' && currentPath !== '/admin' && (
        <div className="fixed bottom-4 left-4 z-30 hidden sm:block">
          <button
            type="button"
            onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/account')}
            className="h-12 pl-2 pr-5 rounded-full bg-[#134E35] hover:bg-[#0D3B27] text-white shadow-lg flex items-center gap-2.5 text-xs font-semibold transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white text-[#22A843] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </span>
            <span>{user ? `Account · ${user.fullName.split(' ')[0]}` : 'Sign in to join'}</span>
          </button>
        </div>
      )}

      {/* Bottom-Right Scroll-Top Circle + Framed WhatsApp Button */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-center gap-2.5">
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            className="w-10 h-10 rounded-full bg-[#24A642] hover:bg-[#0F5338] text-white shadow-md flex items-center justify-center transition-colors"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Fresh Farm Vegetables on WhatsApp"
          className="w-12 h-12 rounded-xl bg-white border border-[#E4EAE4] shadow-lg flex items-center justify-center hover:border-[#12B326] transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29z" />
            </svg>
          </span>
        </a>
      </div>
    </>
  );
}
