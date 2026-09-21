import { BetaInvitationHistory } from "@/features/beta/BetaInvitationHistory";

export default function AdminBetaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="bg-[#0f0b07] px-6 pb-12 text-[#f7f1e8]">
        <div className="mx-auto max-w-3xl">
          <BetaInvitationHistory />
        </div>
      </div>
    </>
  );
}
