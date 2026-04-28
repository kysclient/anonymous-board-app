import { InvestmentHeader } from "@/components/investment/investment-header";
import { InvestmentDashboard } from "@/components/investment/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "개미들 화이팅",
  description: "기술적 지표 기반 자동 추천 종목, 실시간 시세, 차트, 뉴스를 한 페이지에서.",
};

export default function InvestmentPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#0f1115]">
      <InvestmentHeader />
      <InvestmentDashboard />
    </div>
  );
}
