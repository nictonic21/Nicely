import type { MetadataRoute } from "next";

// Lets people add Nicelyy to their phone's home screen and open it full-screen,
// like an app, without an app store.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nicelyy",
    short_name: "Nicelyy",
    description: "Say difficult things the easy way. Say it nicelyy.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#FBF9F6",
    theme_color: "#0E0B1F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
