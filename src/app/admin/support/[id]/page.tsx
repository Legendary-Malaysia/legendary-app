import { TicketForm } from "../ticket-form";
import { getTicket } from "../actions";
import { notFound } from "next/navigation";

interface EditTicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTicketPage({ params }: EditTicketPageProps) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) {
    notFound();
  }

  return <TicketForm initialData={ticket} />;
}
