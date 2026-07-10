import "server-only";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichView } from "./rich-view";
import { RatingStars } from "./rating-stars";
import type { TiptapDoc } from "@/lib/tiptap/types";

export type ReviewListItem = {
  id: number;
  rating: number;
  contentJson: TiptapDoc;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(d);
}

export function ReviewList({
  items,
  currentUserId,
}: {
  items: ReviewListItem[];
  currentUserId?: string | null;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada review. Jadilah yang pertama menulis review!
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                {r.user.image ? (
                  <AvatarImage src={r.user.image} alt={r.user.name} />
                ) : null}
                <AvatarFallback>{initials(r.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {r.user.name}
                  {currentUserId === r.user.id ? (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      Kamu
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                  {r.updatedAt.getTime() !== r.createdAt.getTime()
                    ? " · diedit"
                    : null}
                </p>
              </div>
            </div>
            <RatingStars value={r.rating} readOnly size="sm" />
          </div>
          <RichView doc={r.contentJson} />
        </li>
      ))}
    </ul>
  );
}
