import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  partialPrefetching: false,
  async redirects() {
    // Legacy routes removed during the academics/certifications re-engineering.
    // The dedicated deep-dive pages (/services, /experience, /qualifications,
    // /skills, /engineering, /evidence) remain directly reachable from the
    // About hub, so they are intentionally NOT redirected.
    // /projects route deleted - content moved to home page
    return [
      { source: "/education", destination: "/qualifications", permanent: true },
      { source: "/certifications", destination: "/qualifications", permanent: true },
      { source: "/manage/education", destination: "/manage/academics", permanent: false },
      { source: "/projects", destination: "/#projects", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
