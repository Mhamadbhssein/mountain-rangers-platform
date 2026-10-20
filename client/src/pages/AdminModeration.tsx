import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminModeration() {
  const { data: pendingPosts, isLoading, refetch } = trpc.community.pendingPosts.useQuery();
  const approveMutation = trpc.community.approvePost.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Post approved");
    },
    onError: (error) => toast.error(error.message || "Failed to approve post"),
  });
  const rejectMutation = trpc.community.rejectPost.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Post rejected");
    },
    onError: (error) => toast.error(error.message || "Failed to reject post"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-lime animate-spin" />
      </div>
    );
  }

  const posts = pendingPosts || [];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-5">
        <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Community Moderation</h1>
        <p className="text-muted-foreground mb-6">
          {posts.length} post{posts.length !== 1 ? "s" : ""} awaiting approval
        </p>

        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending posts</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((item) => (
              <Card key={item.post.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {item.author.avatarUrl ? (
                    <img
                      src={item.author.avatarUrl}
                      alt={item.author.name || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center">
                      <span className="text-xs font-bold">{(item.author.name || "U").charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.author.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {item.post.tripTitle && (
                  <p className="text-sm font-semibold text-lime mb-2">
                    {item.post.tripTitle}
                  </p>
                )}

                <p className="text-sm mb-4">{item.post.content}</p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => approveMutation.mutate({ postId: item.post.id })}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-lime hover:bg-lime/90 text-black"
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate({ postId: item.post.id })}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
