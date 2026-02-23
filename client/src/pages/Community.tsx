/* ============================================================
 * Community — Social feed with trip memories & reviews
 * Design: Alpine Glass / Lime-green brand
 * Hero banner, post cards with images, like/comment actions
 * ============================================================ */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Camera,
  TrendingUp,
  Star,
  Users,
} from "lucide-react";
import { COMMUNITY_POSTS, IMAGES, LOGOS } from "@/lib/data";
import { toast } from "sonner";

export default function Community() {
  const [posts, setPosts] = useState(COMMUNITY_POSTS);

  const toggleLike = (postId: string) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <section className="relative h-48 overflow-hidden">
        <img
          src={IMAGES.community}
          alt="Mountain Rangers Community"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
          <h1 className="text-2xl font-serif text-white">Community</h1>
          <p className="text-white/60 text-sm mt-1">
            Stories from the trail
          </p>
        </div>
      </section>

      {/* Quick stats */}
      <section className="px-5 -mt-3 relative z-10 mb-5">
        <div className="glass rounded-xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-lime text-sm font-bold">1.2K</p>
            <p className="text-muted-foreground text-[10px]">Members</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-sm font-bold">340</p>
            <p className="text-muted-foreground text-[10px]">Posts</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-sm font-bold">4.8</p>
            <p className="text-muted-foreground text-[10px]">Avg Rating</p>
          </div>
        </div>
      </section>

      {/* Share prompt */}
      <section className="px-5 mb-5">
        <button
          onClick={() => toast.info("Feature coming soon")}
          className="w-full glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-lime/10 flex items-center justify-center">
            <Camera size={18} className="text-lime" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">
              Share your trail memories...
            </p>
          </div>
          <Share2 size={16} className="text-muted-foreground" />
        </button>
      </section>

      {/* Posts feed */}
      <section className="px-5 space-y-4 pb-6">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Author header */}
            <div className="p-4 pb-3 flex items-center gap-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover border-2 border-lime/20"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {post.author}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star size={10} className="text-lime fill-lime" />
                  {post.tripTitle} · {post.timeAgo}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Image */}
            {post.images.length > 0 && (
              <div className="px-4 pb-3">
                <img
                  src={post.images[0]}
                  alt="Trip memory"
                  className="w-full h-48 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center gap-5">
              <button
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-1.5 group"
              >
                <Heart
                  size={18}
                  className={`transition-all ${
                    post.isLiked
                      ? "text-red-400 fill-red-400"
                      : "text-muted-foreground group-hover:text-red-400"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {post.likes}
                </span>
              </button>
              <button
                onClick={() => toast.info("Feature coming soon")}
                className="flex items-center gap-1.5 group"
              >
                <MessageCircle
                  size={18}
                  className="text-muted-foreground group-hover:text-lime transition-colors"
                />
                <span className="text-xs text-muted-foreground">
                  {post.comments}
                </span>
              </button>
              <button
                onClick={() => toast.info("Feature coming soon")}
                className="flex items-center gap-1.5 group ml-auto"
              >
                <Share2
                  size={16}
                  className="text-muted-foreground group-hover:text-lime transition-colors"
                />
              </button>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
