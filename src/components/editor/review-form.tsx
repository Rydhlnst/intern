"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { RichEditor } from "./rich-editor";
import { RatingStars } from "./rating-stars";
import {
  REVIEW_MAX_CHARS,
  reviewSchema,
  type ReviewFormData,
} from "@/lib/validations/review";
import { emptyTiptapDoc, type TiptapDoc } from "@/lib/tiptap/types";
import {
  upsertReview,
  deleteReview,
} from "@/actions/reviews";

type Props = {
  bookId: number;
  existing: {
    id: number;
    rating: number;
    contentJson: TiptapDoc;
  } | null;
};

export function ReviewForm({ bookId, existing }: Props) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookId,
      rating: existing?.rating ?? 5,
      contentJson: existing?.contentJson ?? emptyTiptapDoc,
    },
  });

  const rating = form.watch("rating");
  const contentJson = form.watch("contentJson");

  function onSubmit(values: ReviewFormData) {
    startTransition(async () => {
      const res = await upsertReview(values);
      if (res.ok) {
        toast.success(existing ? "Review diperbarui" : "Review terkirim");
        if (!existing) form.reset({ ...values, contentJson: emptyTiptapDoc });
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete() {
    if (!existing) return;
    if (!window.confirm("Hapus review ini?")) return;
    startTransition(async () => {
      const res = await deleteReview(existing.id, bookId);
      if (res.ok) {
        toast.success("Review dihapus");
        form.reset({ bookId, rating: 5, contentJson: emptyTiptapDoc });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {existing ? "Review kamu" : "Tulis review"}
          </p>
          <p className="text-xs text-muted-foreground">
            Rating dan komentar akan tampil di halaman buku ini.
          </p>
        </div>
        <RatingStars
          value={rating}
          onChange={(v) => form.setValue("rating", v, { shouldDirty: true })}
        />
      </div>
      <RichEditor
        value={contentJson}
        onChange={(doc) =>
          form.setValue("contentJson", doc, { shouldDirty: true })
        }
        placeholder="Bagaimana bukunya menurut kamu?"
        maxChars={REVIEW_MAX_CHARS}
      />
      {form.formState.errors.contentJson ? (
        <p className="text-xs text-destructive">
          Konten review tidak valid.
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {existing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={isPending}
          >
            Hapus
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Menyimpan..."
            : existing
            ? "Simpan perubahan"
            : "Kirim review"}
        </Button>
      </div>
    </form>
  );
}
