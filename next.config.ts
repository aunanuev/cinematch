import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strip X-Powered-By header to avoid framework fingerprinting
  poweredByHeader: false,
  // ─── Security Headers ────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent this site from being embedded in iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent browsers from MIME-sniffing the content type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control how much referrer information is passed
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable access to hardware APIs not used by this app
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy — restrict where resources can load from
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-inline for its runtime chunks
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // TMDB poster images
              "img-src 'self' data: https://image.tmdb.org",
              // Firebase / Firestore / Google APIs
              [
                "connect-src 'self'",
                "https://*.googleapis.com",
                "https://*.firebaseio.com",
                "wss://*.firebaseio.com",
                "https://firestore.googleapis.com",
                "https://identitytoolkit.googleapis.com",
              ].join(" "),
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ─── Images ─────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
