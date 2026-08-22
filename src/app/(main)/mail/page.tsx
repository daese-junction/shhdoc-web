import { MailFolderView } from "@/components/mail";

/** `/mail` 은 메일의 기본 화면으로 수신함을 보여준다 */
export default function MailPage() {
  return <MailFolderView folder="inbox" />;
}
