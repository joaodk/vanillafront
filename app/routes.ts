import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("chat", "routes/chat.tsx"),
  route("audiochat", "routes/audiochat.tsx"),
  route("about", "routes/about.tsx"),
  route("transcriptions", "routes/transcriptions.tsx"),
  route("video&text learning", "routes/video-text-learning.tsx"),
] satisfies RouteConfig;
