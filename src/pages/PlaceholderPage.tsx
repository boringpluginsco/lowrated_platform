import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle: string;
}

export default function PlaceholderPage({ title, subtitle }: Props) {
  return (
    <section className="max-w-screen-xl mx-auto py-12 px-4 space-y-8 font-mono">
      <div className="max-w-4xl mx-auto text-center">
        {/* Video Placeholder */}
        <div className="relative w-full max-w-3xl mx-auto mb-8">
          <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-600 shadow-lg">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-primary">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </div>
              <div className="text-text-secondary text-sm">
                <div className="font-medium">Video Preview</div>
                <div className="text-xs mt-1">0:04 / 3:33</div>
              </div>
            </div>
          </div>
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-text-primary hover:text-accent transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <div className="text-xs text-text-secondary">0:04 / 3:33</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-text-primary hover:text-accent transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 5L6 9l5 4V5zM13 19l5-4-5-4v8z"/>
                </svg>
              </button>
              <button className="text-text-primary hover:text-accent transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                </svg>
              </button>
              <button className="text-text-primary hover:text-accent transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                  <circle cx="12" cy="1" r="1"/>
                  <circle cx="12" cy="23" r="1"/>
                  <circle cx="4.22" cy="4.22" r="1"/>
                  <circle cx="19.78" cy="19.78" r="1"/>
                  <circle cx="1" cy="12" r="1"/>
                  <circle cx="23" cy="12" r="1"/>
                  <circle cx="4.22" cy="19.78" r="1"/>
                  <circle cx="19.78" cy="4.22" r="1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          {title} 💫
        </h1>

        {/* Subtitle Text */}
        <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* Join Now Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6M23 11h-6"/>
          </svg>
          Join now
        </Link>

        {/* Stats Section */}
        <div className="flex items-center justify-center gap-12 mt-12 pt-8 border-t border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">$1,361,976,719</div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">Made by people</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">9,663,298</div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">Users on platform</div>
          </div>
        </div>
      </div>
    </section>
  );
} 