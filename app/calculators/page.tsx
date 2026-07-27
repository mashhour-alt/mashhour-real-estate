"use client";

import { useMemo, useState } from "react";
import { Footer, Header, PageIntro } from "../components";

type Stage = {
  name: string;
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
  const [area, setArea] = useState(880);
  const [pricePerSqFt, setPricePerSqFt] = useState(2400);
  const [rentPerSqFt, setRentPerSqFt] = useState(250);
  const [appreciation, setAppreciation] = useState(13);
  const [expenses, setExpenses] = useState(0);
  const [stages, setStages] = useState<Stage[]>([
    { name: "الحجز | Booking", percent: 20, equity: true },
    { name: "أثناء البناء 1 | Construction 1", percent: 30, equity: true },
    { name: "أثناء البناء 2 | Construction 2", percent: 10, equity: true },
    { name: "عند التسليم | Handover", percent: 40, equity: true },
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
        eyebrow="INVESTMENT CALCULATOR · حاسبة الاستثمار"
        title="ROI and ROE, exactly as your sheet."
        intro="غيّر الخلايا الحمراء فقط، وستتحدث كل النتائج تلقائيًا. Change the red input fields and every result updates instantly."
      />

      <section className="investment-calculator">
        <div className="calculator-title-row">
          <div>
            <span>01</span>
            <h2>بيانات الوحدة <em>Property inputs</em></h2>
          </div>
          <p>Based on: real_estate_investment_calculator.xlsx</p>
        </div>

        <div className="investment-top-grid">
          <div className="input-panel">
            <CalculatorInput label="المساحة (قدم²)" english="Area (sq ft)" value={area} setValue={setArea} suffix="FT²" />
            <CalculatorInput label="سعر القدم (درهم)" english="Price per sq ft" value={pricePerSqFt} setValue={setPricePerSqFt} suffix="AED" />
            <CalculatorInput label="إيجار القدم السنوي" english="Annual rent per sq ft" value={rentPerSqFt} setValue={setRentPerSqFt} suffix="AED" />
            <CalculatorInput label="نسبة الزيادة المتوقعة" english="Expected appreciation" value={appreciation} setValue={setAppreciation} suffix="%" step="0.1" />
            <CalculatorInput label="مصاريف سنوية" english="Annual expenses" value={expenses} setValue={setExpenses} suffix="AED" />
          </div>

          <div className="summary-panel">
            <p>ملخص الاستثمار <span>Investment summary</span></p>
            <SummaryRow label="سعر العقار" english="Property price" value={aed(result.propertyPrice)} />
            <SummaryRow label="الإيجار السنوي" english="Annual rent" value={aed(result.annualRent)} />
            <SummaryRow label="صافي الإيجار" english="Net annual rent" value={aed(result.netRent)} />
            <SummaryRow label="السعر المتوقع بعد سنة" english="Projected value (1Y)" value={aed(result.projectedValue)} />
            <SummaryRow label="الزيادة الرأسمالية" english="Capital gain" value={aed(result.capitalGain)} />
          </div>
        </div>

        <div className="calculator-title-row second">
          <div>
            <span>02</span>
            <h2>خطة الدفع والعوائد <em>Payment plan & returns</em></h2>
          </div>
          <strong className={planOk ? "plan-status ok" : "plan-status warning"}>
            {planOk ? "الخطة 100% · OK ✓" : `راجع النسب · ${result.planTotal.toFixed(1)}%`}
          </strong>
        </div>

        <div className="payment-return-grid">
          <div className="plan-editor">
            <div className="plan-head">
              <span>المرحلة | Stage</span>
              <span>النسبة | %</span>
              <span>المبلغ | Amount</span>
              <span>ضمن رأس المال؟</span>
            </div>
            {stages.map((stage, index) => (
              <div className="plan-row" key={stage.name}>
                <strong>{stage.name}</strong>
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
                  {stage.equity ? "نعم | Yes" : "لا | No"}
                </button>
              </div>
            ))}
            <div className="plan-total">
              <strong>الإجمالي | Total</strong>
              <b>{result.planTotal.toFixed(1)}%</b>
              <b>{aed(result.propertyPrice * (result.planTotal / 100))}</b>
              <span />
            </div>
          </div>

          <div className="returns-panel">
            <p>العوائد والتوقعات <span>Returns & projection</span></p>
            <ReturnCard label="ROI · عائد الإيجار" value={pct(result.roi)} formula="صافي الإيجار ÷ سعر العقار" />
            <ReturnCard label="رأس المال المدفوع" value={aed(result.paidEquity)} formula="الدفعات المحددة: نعم" />
            <ReturnCard label="ROE · عائد رأس المال" value={pct(result.roe)} formula="صافي الإيجار ÷ رأس المال" />
            <ReturnCard label="العائد الكلي سنة 1" value={pct(result.totalReturn)} formula="الإيجار + الزيادة ÷ السعر" />
            <ReturnCard label="فترة استرداد رأس المال" value={`${result.payback.toFixed(1)} سنة`} formula="رأس المال ÷ صافي الإيجار" />
          </div>
        </div>

        <aside className="formula-guide">
          <div><span>PRICE</span><strong>المساحة × سعر القدم</strong><small>Area × price per sq ft</small></div>
          <div><span>RENT</span><strong>المساحة × إيجار القدم</strong><small>Area × annual rent per sq ft</small></div>
          <div><span>ROI</span><strong>صافي الإيجار ÷ سعر العقار</strong><small>Net rent ÷ property price</small></div>
          <div><span>ROE</span><strong>صافي الإيجار ÷ رأس المال المدفوع</strong><small>Net rent ÷ paid equity</small></div>
        </aside>

        <p className="calculator-disclaimer">
          هذه الحاسبة تقديرية وليست نصيحة مالية. الأسعار والإيجارات والمصاريف ونسب الزيادة يجب التحقق منها قبل اتخاذ قرار استثماري.
          <span>This calculator is illustrative and does not constitute financial advice.</span>
        </p>
      </section>
      <Footer />
    </main>
  );
}

function CalculatorInput({
  label,
  english,
  value,
  setValue,
  suffix,
  step = "1",
}: {
  label: string;
  english: string;
  value: number;
  setValue: (value: number) => void;
  suffix: string;
  step?: string;
}) {
  return (
    <label className="sheet-input">
      <span><strong>{label}</strong><small>{english}</small></span>
      <span><input type="number" min="0" step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} /><b>{suffix}</b></span>
    </label>
  );
}

function SummaryRow({ label, english, value }: { label: string; english: string; value: string }) {
  return <div className="summary-row"><span><strong>{label}</strong><small>{english}</small></span><b>{value}</b></div>;
}

function ReturnCard({ label, value, formula }: { label: string; value: string; formula: string }) {
  return <div className="return-row"><span><strong>{label}</strong><small>{formula}</small></span><b>{value}</b></div>;
}
