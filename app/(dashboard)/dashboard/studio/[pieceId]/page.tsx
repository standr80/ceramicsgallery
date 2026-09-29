import { notFound, redirect } from "next/navigation";
import { getPieceWithImages } from "@/lib/data/pieces";
import { getCurrentPotter } from "@/lib/get-potter";
import { updatePiece, publishPiece, unpublishPiece, deletePiece } from "@/app/actions/pieces";
import { PieceEditForm } from "@/components/piece/PieceEditForm";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ pieceId: string }> }

export default async function EditPiecePage({ params }: Props) {
  const { pieceId } = await params;
  const [potter, result] = await Promise.all([getCurrentPotter(), getPieceWithImages(pieceId)]);

  if (!potter) redirect("/login");
  if (!result || result.piece.potter_id !== potter.id) notFound();

  const { piece, images } = result;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updatePiece(pieceId, formData);
    redirect(`/dashboard/studio/${pieceId}?saved=1`);
  }

  async function handlePublish() {
    "use server";
    await publishPiece(pieceId);
    redirect(`/dashboard/studio/${pieceId}`);
  }

  async function handleUnpublish() {
    "use server";
    await unpublishPiece(pieceId);
    redirect(`/dashboard/studio/${pieceId}`);
  }

  async function handleDelete() {
    "use server";
    await deletePiece(pieceId);
    redirect("/dashboard/studio");
  }

  return (
    <PieceEditForm
      piece={piece}
      images={images}
      stripeConnected={potter.stripe_charges_ok}
      onUpdate={handleUpdate}
      onPublish={handlePublish}
      onUnpublish={handleUnpublish}
      onDelete={handleDelete}
    />
  );
}
