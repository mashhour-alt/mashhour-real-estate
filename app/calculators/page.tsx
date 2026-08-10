"use client";

import { useMemo, useState } from "react";
import { Footer, Header, PageIntro } from "../components";
import { useLanguage } from "../language-context";

type Stage = {
  name: string;
  nameAr: string;
  percent: number;
  equity: boolean;
};

const aed = (value: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

export default function CalculatorsPage() {
  const { arabic } = useLanguage();
  const [area, setArea] = useState(880);
  const [pricePerSqFt, setPricePerSqFt] = useState(2400);
  const [rentPerSqFt, setRentPerSqFt] = useState(250);
  const [appreciation, setAppreciation] = useState(13);
  const [expenses, setExpenses] = useState(0);
  const [stages, setStages] = useState<Stage[]>([
    { name: "Booking", nameAr: "الحجز", percent: 20, equity: true },
    { name: "Construction 1", nameAr: "أثناء البناء 1", percent: 30, equity: true },
    { name: "Construction 2", nameAr: "أثناء البناء 2", percent: 10, equity: true },
    { name: "Handover", nameAr: "عند التسليم", percent: 40, equity: true },
  ]);

  const result = useMemo(() => {
    const propertyPrice = Math.max(area * pricePerSqFt, 0);
    const annualRent = Math.max(area * rentPerSqFt, 0);
    const netRent = Math.max(annualRent - expenses, 0);
    const projectedValue = propertyPrice * (1 + appreciation / 100);
    const capitalGain = projectedValue - propertyPrice;
    const planTotal = stages.reduce((sum, stage) => sum + stage.percent, 0);
    const paidEquity = stages.reduce(
      (sum, stage) => sum + (stage.equity ? propertyPrice * (stage.percent / 100) : 0),
      0,
    );
    return {
      propertyPrice,
      annualRent,
      netRent,
      projectedValue,
      capitalGain,
      paidEquity,
      planTotal,
      roi: propertyPrice ? (netRent / propertyPrice) * 100 : 0,
      roe: paidEquity ? (netRent / paidEquity) * 100 : 0,
      totalReturn: propertyPrice ? ((netRent + capitalGain) / propertyPrice) * 100 : 0,
      payback: netRent ? paidEquity / netRent : 0,
    };
  }, [area, pricePerSqFt, rentPerSqFt, appreciation, expenses, stages]);

  const updateStage = (index: number, patch: Partial<Stage>) =>
    setStages((current) =>
      current.map((stage, stageIndex) => stageIndex === index ? { ...stage, ...patch } : stage),
    );

  const planOk = Math.abs(result.planTotal - 100) < 0.000001;

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow={arabic ? "حاسبة الاستثمار" : "INVESTMENT CALCULATOR"}
        title={arabic ? "العائد على الاستثمار ورأس المال، بالظبط زي شيتك." : "ROI and ROE, exactly as your sheet."}
        intro={arabic ? "غيّر الخلايا الحمراء فقط، وستتحدث كل النتائج تلقائيًا." : "Change the red input fields and every result updates instantly."}
      />

      <section className="investment-calculator">
        <div className="calculator-title-row">
          <div>
            <span>01</span>
            <h2>{arabic ? "بيانات الوحدة" : "Property inputs"}</h2>
          </div>
          <p>{arabic ? "استناداً إلى: real_estate_investment_calculator.xlsx" : "Based on: real_estate_investment_calculator.xlsx"}</p>
        </div>

        <div className="investment-top-grid">
          <div className="input-panel">
            <CalculatorInput label={arabic ? "المساحة (قدم²)" : "Area (sq ft)"} value={area} setValue={setArea} suffix="FT²" />
            <CalculatorInput label={arabic ? "سعر القدم (درهم)" : "Price per sq ft"} value={pricePerSqFt} setValue={setPricePerSqFt} suffix="AED" />
            <CalculatorInput label={arabic ? "إيجار القدم السنوي" : "Annual rent per sq ft"} value={rentPerSqFt} setValue={setRentPerSqFt} suffix="AED" />
            <CalculatorInput label={arabic ? "نسبة الزيادة المتوقعة" : "Expected appreciation"} value={appreciation} setValue={setAppreciation} suffix="%" step="0.1" />
            <CalculatorInput label={arabic ? "مصاريف سنوية" : "Annual expenses"} value={expenses} setValue={setExpenses} suffix="AED" />
          </div>

          <div className="summary-panel">
            <p>{arabic ? "ملخص الاستثمار" : "Investment summary"}</p>
            <SummaryRow label={arabic ? "سعر العقار" : "Property price"} value={aed(result.propertyPrice)} />
            <SummaryRow label={arabic ? "الإيجار السنوي" : "Annual rent"} value={aed(result.annualRent)} />
            <SummaryRow label={arabic ? "صافي الإيجار" : "Net annual rent"} value={aed(result.netRent)} />
            <SummaryRow label={arabic ? "السعر المتوقع بعد سنة" : "Projected value (1Y)"} value={aed(result.projectedValue)} />
            <SummaryRow label={arabic ? "الزيادة الرأسمالية" : "Capital gain"} value={aed(result.capitalGain)} />
          </div>
        </div>

        <div className="calculator-title-row second">
          <div>
            <span>02</span>
            <h2>{arabic ? "خطة الدفع والعوائد" : "Payment plan & returns"}</h2>
          </div>
          <strong className={planOk ? "plan-status ok" : "plan-status warning"}>
            {planOk ? (arabic ? "الخطة 100% ✓" : "OK ✓ 100%") : (arabic ? `راجع النسب · ${result.planTotal.toFixed(1)}%` : `Review percentages · ${result.planTotal.toFixed(1)}%`)}
          </strong>
        </div>

        <div className="payment-return-grid">
          <div className="plan-editor">
            <div className="plan-head">
              <span>{arabic ? "المرحلة" : "Stage"}</span>
              <span>{arabic ? "النسبة" : "%"}</span>
              <span>{arabic ? "المبلغ" : "Amount"}</span>
              <span>{arabic ? "ضمن رأس المال؟" : "Part of equity?"}</span>
            </div>
            {stages.map((stage, index) => (
              <div className="plan-row" key={stage.name}>
                <strong>{arabic ? stage.nameAr : stage.name}</strong>
                <label>
                  <input
                    aria-label={`${stage.name} percentage`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={stage.percent}
                    onChange={(event) => updateStage(index, { percent: Number(event.target.value) })}
                  />
                  <span>%</span>
                </label>
                <b>{aed(result.propertyPrice * (stage.percent / 100))}</b>
                <button
                  className={stage.equity ? "equity-toggle selected" : "equity-toggle"}
                  onClick={() => updateStage(index, { equity: !stage.equity })}
                  aria-pressed={stage.equity}
                >
                  {stage.equity ? (arabic ? "نعم" : "Yes") : (arabic ? "لا" : "No")}
                </button>
              </div>
            ))}
            <div className="plan-total">
              <strong>{arabic ? "الإجمالي" : "Total"}</strong>
              <b>{result.planTotal.toFixed(1)}%</b>
              <b>{aed(result.propertyPrice * (result.planTotal / 100))}</b>
              <span />
            </div>
          </div>

          <div className="returns-panel">
            <p>{arabic ? "العوائد والتوقعات" : "Returns & projection"}</p>
            <ReturnCard label={arabic ? "ROI · عائد الإيجار" : "ROI · Rental yield"} value={pct(result.roi)} formula={arabic ? "صافي الإيجار ÷ سعر العقار" : "Net rent ÷ property price"} />
            <ReturnCard label={arabic ? "رأس المال المدفوع" : "Paid equity"} value={aed(result.paidEquity)} formula={arabic ? "الدفعات المحددة: نعم" : "Stages marked: Yes"} />
            <ReturnCard label={arabic ? "ROE · عائد رأس المال" : "ROE · Return on equity"} value={pct(result.roe)} formula={arabic ? "صافي الإيجار ÷ رأس المال" : "Net rent ÷ paid equity"} />
            <ReturnCard label={arabic ? "العائد الكلي سنة 1" : "Total return, Year 1"} value={pct(result.totalReturn)} formula={arabic ? "الإيجار + الزيادة ÷ السعر" : "Rent + gain ÷ price"} />
            <ReturnCard label={arabic ? "فترة استرداد رأس المال" : "Equity payback period"} value={arabic ? `${result.payback.toFixed(1)} سنة` : `${result.payback.toFixed(1)} years`} formula={arabic ? "رأس المال ÷ صافي الإيجار" : "Equity ÷ net rent"} />
          </div>
        </div>

        <aside className="formula-guide">
          <div><span>PRICE</span><strong>{arabic ? "المساحة × سعر القدم" : "Area × price per sq ft"}</strong></div>
          <div><span>RENT</span><strong>{arabic ? "المساحة × إيجار القدم" : "Area × annual rent per sq ft"}</strong></div>
          <div><span>ROI</span><strong>{arabic ? "صافي الإيجار ÷ سعر العقار" : "Net rent ÷ property price"}</strong></div>
          <div><span>ROE</span><strong>{arabic ? "صافي الإيجار ÷ رأس المال المدفوع" : "Net rent ÷ paid equity"}</strong></div>
        </aside>

        <p className="calculator-disclaimer">
          {arabic ? "هذه الحاسبة تقديرية وليست نصيحة مالية. الأسعار والإيجارات والمصاريف ونسب الزيادة يجب التحقق منها قبل اتخاذ قرار استثماري." : "This calculator is illustrative and does not constitute financial advice. Prices, rents, expenses and appreciation rates should be verified before making an investment decision."}
        </p>
      </section>
      <Footer />
    </main>
  );
}

function CalculatorInput({
  label,
  value,
  setValue,
  suffix,
  step = "1",
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  suffix: string;
  step?: string;
}) {
  return (
    <label className="sheet-input">
      <span><strong>{label}</strong></span>
      <span><input type="number" min="0" step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} /><b>{suffix}</b></span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span><strong>{label}</strong></span><b>{value}</b></div>;
}

function ReturnCard({ label, value, formula }: { label: string; value: string; formula: string }) {
  return <div className="return-row"><span><strong>{label}</strong><small>{formula}</small></span><b>{value}</b></div>;
}
