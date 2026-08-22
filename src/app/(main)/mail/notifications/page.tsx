import { NotificationList } from "@/components/notification";

/** 내가 보낸 검토 요청을 관리자가 승인·거부한 결과를 모아 보여준다 */
export default function MailNotificationsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-text-primary">알림</h1>
      <NotificationList className="min-h-0 flex-1" />
    </div>
  );
}
