import { MailDetailView } from "@/components/mail";

interface MailViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function MailViewPage({ params }: MailViewPageProps) {
  const { id } = await params;

  return <MailDetailView id={id} />;
}
