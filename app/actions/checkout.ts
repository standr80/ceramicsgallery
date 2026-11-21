"use server";

import { redirect } from "next/navigation";
import { startPieceCheckout, type Fulfilment } from "@/lib/orders";

export async function buyPiece(pieceId: string, _prev: { error?: string } | null, fd: FormData): Promise<{ error?: string }> {
  const fulfilment = fd.get("fulfilment");
  if (fulfilment !== "ship" && fulfilment !== "collect") return { error: "Please choose delivery or collection." };
  const res = await startPieceCheckout(pieceId, fulfilment as Fulfilment);
  if (res.url) redirect(res.url);
  return { error: res.error ?? "Something went wrong." };
}
