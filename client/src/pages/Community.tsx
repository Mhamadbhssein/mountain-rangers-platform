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
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Settings,
  UserPlus,
} from "lucide-react";
import { IMAGES } from "@/lib/data";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Community() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();

  const { data: posts, isLoading } = trpc.community.posts.useQuery();
  const { data: stats } = trpc.community.stats.useQuery();
  const { data: leaderboard = [] } = trpc.profile.leaderboard.useQuery();
  const { data: followingIds = [] } = trpc.profile.following.useQuery(undefined, { enabled: isAuthenticated });
  const [section, setSection] = useState<"Feed" | "Gallery" | "Top">("Feed");
  const [filter, setFilter] = useState<"All" | "Trending" | "Following">("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [carouselIndex, setCarouselIndex] = useState<Record<number, number>>({});
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<Record<number, any[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [tripTitle, setTripTitle] = useState("");

  const createPostMutation = trpc.community.createPost.useMutation({
    onSuccess: () => {
      setPostContent("");
      setPostImages([]);
      setTripTitle("");
      setShowCreatePost(false);
      utils.community.posts.invalidate();
      toast.success("Post created");
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  const toggleLikeMutation = trpc.community.toggleLike.useMutation({
    onSuccess: () => {
      utils.community.posts.invalidate();
    },
  });

  const followMutation = trpc.profile.toggleFollow.useMutation({
    onSuccess: () => utils.profile.following.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const visiblePosts = (posts ?? [])
    .filter((post) => section !== "Gallery" || (Array.isArray(post.images) && post.images.length > 0))
    .filter((post) => filter !== "Following" || followingIds.includes(post.author?.id ?? -1))
    .filter((post) => !search.trim() || `${post.content} ${post.tripTitle ?? ""} ${post.author?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => filter === "Trending" ? (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount) : 0);

  const addCommentMutation = trpc.community.addComment.useMutation({
    onSuccess: (_, variables) => {
      setCommentText({ ...commentText, [variables.postId]: "" });
      setLoadingPostId(variables.postId);
      loadPostComments(variables.postId);
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const loadPostComments = async (postId: number) => {
    setLoadingPostId(postId);
    try {
      const data = await utils.community.getComments.fetch({ postId });
      setPostComments((prev) => ({ ...prev, [postId]: data }));
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setLoadingPostId(null);
    }
  };

  const handleLike = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toggleLikeMutation.mutate({ postId });
  };

  const handleExpandComments = (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!postComments[postId]) {
        loadPostComments(postId);
      }
    }
  };

  const handleAddComment = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const text = commentText[postId]?.trim();
    if (!text) {
      toast.error("Comment cannot be empty");
      return;
    }
    addCommentMutation.mutate({ postId, content: text });
  };

  const handleShare = (post: any) => {
    const url = window.location.href;
    const text = `Check out this post from ${post.author?.name || "Mountain Rangers"}: "${post.content.substring(0, 50)}..."`;

    if (navigator.share) {
      navigator.share({
        title: "Mountain Rangers Community",
        text: text,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied to clipboard");
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Community</h1>
            <div className="flex gap-2">
              <button aria-label="Search community" onClick={() => setSearchOpen((value) => !value)} className="rounded-full bg-black/30 p-2 text-white"><Search size={16} /></button>
              <button aria-label="Notifications" onClick={() => (window.location.href = "/notifications")} className="rounded-full bg-black/30 p-2 text-white"><Bell size={16} /></button>
              <button aria-label="Community settings" onClick={() => toast.info("Community settings are coming soon")} className="rounded-full bg-black/30 p-2 text-white"><Settings size={16} /></button>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-1">
            Stories from the trail
          </p>
        </div>
      </section>

      {searchOpen && <div className="px-5 pt-4"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stories, trips, or members" autoFocus /></div>}

      {/* Quick stats */}
      <section className="px-5 -mt-3 relative z-10 mb-5">
        <div className="glass rounded-xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-lime text-sm font-bold">{stats?.members ?? 0}</p>
            <p className="text-muted-foreground text-[10px]">Members</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-sm font-bold">{stats?.posts ?? posts?.length ?? 0}</p>
            <p className="text-muted-foreground text-[10px]">Posts</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-sm font-bold">{stats?.avgRating ?? "—"}</p>
            <p className="text-muted-foreground text-[10px]">Avg Rating</p>
          </div>
        </div>
      </section>

      <section className="px-5 mb-4 space-y-3">
        <div className="flex rounded-2xl bg-card p-1 shadow-sm">
          {(["Feed", "Gallery", "Top"] as const).map((item) => <button key={item} onClick={() => setSection(item)} className={`flex-1 rounded-xl py-2 text-xs font-bold ${section === item ? "bg-lime text-black" : "text-muted-foreground"}`}>{item}</button>)}
        </div>
        {section !== "Top" && <div className="flex gap-2 overflow-x-auto">{(["All", "Trending", "Following"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === item ? "border-lime bg-lime/15 text-lime" : "border-border text-muted-foreground"}`}>{item}</button>)}</div>}
      </section>

      {section === "Top" && <section className="px-5 pb-5 space-y-2">{leaderboard.map((member, index) => <div key={member.userId} className="glass rounded-xl p-3 flex items-center gap-3"><span className="w-6 text-center font-bold text-lime">#{index + 1}</span><div className="h-9 w-9 rounded-full bg-lime/15 flex items-center justify-center text-lime font-bold">{(member.name ?? "U").charAt(0)}</div><div className="flex-1"><p className="text-sm font-semibold">{member.name ?? "Member"}</p><p className="text-xs text-muted-foreground">{member.tripsCompleted} completed trips</p></div><span className="text-sm font-bold text-lime">{member.points} pts</span></div>)}</section>}

      {/* Create post prompt */}
      <section className="px-5 mb-5">
        <button
          onClick={() => {
            if (!isAuthenticated) {
              window.location.href = getLoginUrl();
              return;
            }
            setShowCreatePost(true);
          }}
          className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
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

      {/* Create post modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-3xl p-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Post</h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Trip title (optional)"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
              />
              <textarea
                placeholder="Share your story..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground min-h-24 resize-none"
              />
              
              {/* Image picker */}
              <div className="border-2 border-dashed border-lime/30 rounded-lg p-4 text-center cursor-pointer hover:border-lime/60 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        setPostImages((prev) => [...prev, result]);
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                  className="hidden"
                  id="image-input"
                />
                <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera size={20} className="text-lime" />
                  <span className="text-sm text-muted-foreground">Add photos ({postImages.length})</span>
                </label>
              </div>
              
              {/* Image preview */}
              {postImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {postImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-20 object-cover rounded" />
                      <button
                        onClick={() => setPostImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (!postContent.trim()) {
                      toast.error("Post cannot be empty");
                      return;
                    }
                    createPostMutation.mutate({
                      content: postContent,
                      tripTitle: tripTitle || undefined,
                      images: postImages,
                    });
                  }}
                  disabled={createPostMutation.isPending}
                  className="flex-1 bg-lime hover:bg-lime/90 text-black font-semibold"
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
                <Button
                  onClick={() => setShowCreatePost(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({
                        title: "Mountain Rangers",
                        text: "Check out Mountain Rangers - book amazing hiking trips!",
                        url: url,
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied");
                    }
                  }}
                  variant="outline"
                  size="icon"
                >
                  <Share2 size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts feed */}
      <section className="px-5 space-y-4 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-lime animate-spin" />
          </div>
        ) : (
          section !== "Top" && visiblePosts.map((post, i) => {
            const images: string[] = Array.isArray(post.images) ? post.images : [];
            const comments = postComments[post.id] || [];
            const imageIndex = carouselIndex[post.id] ?? 0;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="glass rounded-2xl overflow-hidden"
              >
                {/* Author header */}
                <div className="p-4 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center border-2 border-lime/20">
                    <span className="text-lime font-bold text-sm">
                      {(post.author?.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {post.author?.name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star size={10} className="text-lime fill-lime" />
                      {post.tripTitle ?? "Trail Story"} · {formatTimeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Images Carousel */}
                {images.length > 0 && (
                  <div className="px-4 pb-3">
                    {images.length === 1 ? (
                      <img
                        src={images[0]}
                        alt="Trip memory"
                        className="w-full h-48 object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative">
                        <img
                          src={images[imageIndex]}
                          alt="Trip memory"
                          className="w-full h-48 object-cover rounded-xl"
                          loading="lazy"
                        />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1 text-white text-xs">
                          <button aria-label="Previous image" onClick={() => setCarouselIndex((prev) => ({ ...prev, [post.id]: (imageIndex - 1 + images.length) % images.length }))}><ChevronLeft size={15} /></button>
                          <span>{imageIndex + 1} / {images.length}</span>
                          <button aria-label="Next image" onClick={() => setCarouselIndex((prev) => ({ ...prev, [post.id]: (imageIndex + 1) % images.length }))}><ChevronRight size={15} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-5">
                  <button
                    onClick={() => handleLike(post.id)}
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
                      {post.likesCount}
                    </span>
                  </button>
                  <button
                    onClick={() => handleExpandComments(post.id)}
                    className="flex items-center gap-1.5 group"
                  >
                    <MessageCircle
                      size={18}
                      className="text-muted-foreground group-hover:text-lime transition-colors"
                    />
                    <span className="text-xs text-muted-foreground">
                      {post.commentsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 group ml-auto"
                  >
                    <Share2
                      size={16}
                      className="text-muted-foreground group-hover:text-lime transition-colors"
                    />
                  </button>
                </div>

                {/* Comments section */}
                {expandedPost === post.id && (
                  <div className="border-t border-white/10 px-4 py-3 space-y-3">
                    {/* Comments list */}
                    {loadingPostId === post.id ? (
                      <div className="flex justify-center py-2">
                        <Loader2 size={16} className="text-lime animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {comments.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No comments yet
                          </p>
                        ) : (
                          comments.map((comment: any) => (
                            <div key={comment.comment.id} className="text-xs">
                              <p className="font-semibold text-foreground">
                                {comment.author.name}
                              </p>
                              <p className="text-muted-foreground">
                                {comment.comment.content}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {formatTimeAgo(comment.comment.createdAt)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Add comment */}
                    {isAuthenticated && (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <Input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText[post.id] || ""}
                          onChange={(e) =>
                            setCommentText({
                              ...commentText,
                              [post.id]: e.target.value,
                            })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddComment(post.id);
                            }
                          }}
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={addCommentMutation.isPending}
                          className="h-8"
                        >
                          Post
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );
}
