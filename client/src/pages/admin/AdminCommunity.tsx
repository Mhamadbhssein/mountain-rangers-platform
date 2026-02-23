import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Search, Trash2, Heart, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminCommunity() {
  const utils = trpc.useUtils();
  // admin.allPosts returns { post: CommunityPost, author: { id, name, avatarUrl } }[]
  const { data: posts, isLoading } = trpc.admin.allPosts.useQuery();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deletePostMutation = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      utils.admin.allPosts.invalidate();
      setDeleteId(null);
      toast.success("Post deleted.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!posts) return [];
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.post.content?.toLowerCase().includes(q) ||
        p.author.name?.toLowerCase().includes(q) ||
        p.post.tripTitle?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  const totalLikes = posts?.reduce((sum, p) => sum + (p.post.likesCount ?? 0), 0) ?? 0;
  const uniqueAuthors = posts ? new Set(posts.map((p) => p.post.userId)).size : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Community Moderation</h1>
          <p className="text-gray-400 text-sm mt-1">{posts?.length ?? 0} total posts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-lime-400">{posts?.length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Posts</p>
          </div>
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-pink-400">{totalLikes}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Likes</p>
          </div>
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-blue-400">{uniqueAuthors}</p>
            <p className="text-xs text-gray-400 mt-0.5">Contributors</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by content, user, or trip..."
            className="pl-9 bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
          />
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No posts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ post, author }) => (
              <div
                key={post.id}
                className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-lime-400 text-xs font-bold">
                      {author.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white text-sm font-medium">
                        {author.name ?? "Unknown"}
                      </span>
                      {post.tripTitle && (
                        <span className="text-xs text-lime-400/70 bg-lime-500/10 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                          {post.tripTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {post.content}
                    </p>
                    {/* Images preview */}
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {post.images.slice(0, 3).map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover border border-[#1a2a1a]"
                          />
                        ))}
                        {post.images.length > 3 && (
                          <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 text-xs">
                            +{post.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        {post.likesCount ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(post.id)}
                    className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the post and all its likes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1a2a1a] text-gray-400 hover:bg-white/5 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId !== null) {
                  deletePostMutation.mutate({ postId: deleteId });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
