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

const SQFT_PER_SQM = 10.7639;
const AED_PER_USD = 3.6725;

const aed = (value: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
const num = (value: number, digits = 2) => (Number.isFinite(value) ? value : 0).toFixed(digits);

export default function CalculatorsPage() {
  const { arabic } = useLanguage();

  // Canonical values are always stored in sq ft and AED internally; the unit toggles
  // only change what's displayed/typed, so every downstream formula stays simple.
  const [areaUnit, setAreaUnit] = useState<"sqft" | "sqm">("sqft");
  const [areaSqFt, setAreaSqFt] = useState(880);
  const [priceCurrency, setPriceCurrency] = useState<"AED" | "USD">("AED");
  const [unitPriceAed, setUnitPriceAed] = useState(2112000);
  const [rentPerSqFt, setRentPerSqFt] = useState(250);
  const [appreciation, setAppreciation] = useState(13);
  const [expenses, setExpenses] = useState(0);
  const [stages, setStages] = useState<Stage[]>([
    { name: "Booking", nameAr: "الحجز", percent: 20, equity: true },
    { name: "Construction 1", nameAr: "أثناء البناء 1", percent: 30, equity: true },
    { name: "Construction 2", nameAr: "أثناء البناء 2", percent: 10, equity: true },
    { name: "Handover", nameAr: "عند التسليم", percent: 40, equity: true },
  ]);

  const areaDisplay = areaUnit === "sqft" ? areaSqFt : areaSqFt / SQFT_PER_SQM;
  const setAreaDisplay = (value: number) =>
    setAreaSqFt(areaUnit === "sqft" ? value : value * SQFT_PER_SQM);

  const priceDisplay = priceCurrency === "AED" ? unitPriceAed : unitPriceAed / AED_PER_USD;
  const setPriceDisplay = (value: number) =>
    setUnitPriceAed(priceCurrency === "AED" ? value : value * AED_PER_USD);

  const result = useMemo(() => {
    const propertyPrice = Math.max(unitPriceAed, 0);
    const annualRent = Math.max(areaSqFt * rentPerSqFt, 0);
    const netRent = Math.max(annualRent - expenses, 0);
    const projectedValue = propertyPrice * (1 + appreciation / 100);
    const capitalGain = projectedValue - propertyPrice;
    const planTotal = stages.reduce((sum, stage) => sum + stage.percent, 0);
    const paidEquity = stages.reduce(
      (sum, stage) => sum + (stage.equity ? propertyPrice * (stage.percent / 100) : 0),
      0,
    );
    const pricePerSqFt = areaSqFt ? propertyPrice / areaSqFt : 0;
    return {
      propertyPrice,
      pricePerSqFt,
      annualRent,
      netRent,
      projectedValue,
      capitalGain,
      paidEquity,
      planTotal,
      roa: propertyPrice ? (netRent / propertyPrice) * 100 : 0,
      roe: paidEquity ? (netRent / paidEquity) * 100 : 0,
      roi: paidEquity ? ((netRent + capitalGain) / paidEquity) * 100 : 0,
      capitalAppreciation: propertyPrice ? (capitalGain / propertyPrice) * 100 : 0,
      payback: netRent ? paidEquity / netRent : 0,
    };
  }, [unitPriceAed, areaSqFt, rentPerSqFt, appreciation, expenses, stages]);

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
        title={arabic ? "ROI وROE وROA، بالظبط زي شيتك." : "ROI, ROE and ROA, exactly as your sheet."}
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
            <CalculatorInputToggle
              label={arabic ? "المساحة" : "Area"}
              value={areaDisplay}
              setValue={setAreaDisplay}
              unit={areaUnit}
              setUnit={setAreaUnit}
              options={[
                { value: "sqft", label: arabic ? "قدم²" : "sq ft" },
                { value: "sqm", label: arabic ? "متر²" : "sq m" },
              ]}
            />
            <CalculatorInputToggle
              label={arabic ? "سعر الوحدة" : "Unit price"}
              value={priceDisplay}
              setValue={setPriceDisplay}
              unit={priceCurrency}
              setUnit={setPriceCurrency}
              options={[
                { value: "AED", label: "AED" },
                { value: "USD", label: "USD" },
              ]}
            />
            <p className="input-hint">{arabic ? `≈ ${aed(result.pricePerSqFt)} / قدم²` : `≈ ${aed(result.pricePerSqFt)} / sq ft`}</p>
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
            <ReturnCard label={arabic ? "ROA · عائد الأصول" : "ROA · Return on assets"} value={pct(result.roa)} formula={arabic ? "صافي الإيجار ÷ سعر العقار" : "Net rent ÷ property price"} />
            <ReturnCard label={arabic ? "رأس المال المدفوع" : "Paid equity"} value={aed(result.paidEquity)} formula={arabic ? "الدفعات المحددة: نعم" : "Stages marked: Yes"} />
            <ReturnCard label={arabic ? "ROE · عائد رأس المال" : "ROE · Return on equity"} value={pct(result.roe)} formula={arabic ? "صافي الإيجار ÷ رأس المال" : "Net rent ÷ paid equity"} />
            <ReturnCard label={arabic ? "الزيادة الرأسمالية %" : "Capital appreciation"} value={pct(result.capitalAppreciation)} formula={arabic ? "الزيادة ÷ سعر العقار" : "Capital gain ÷ property price"} />
            <ReturnCard label={arabic ? "ROI · العائد الكلي" : "ROI · Total return"} value={pct(result.roi)} formula={arabic ? "(الإيجار + الزيادة) ÷ رأس المال" : "(Rent + gain) ÷ paid equity"} />
            <ReturnCard label={arabic ? "فترة استرداد رأس المال" : "Equity payback period"} value={arabic ? `${result.payback.toFixed(1)} سنة` : `${result.payback.toFixed(1)} years`} formula={arabic ? "رأس المال ÷ صافي الإيجار" : "Equity ÷ net rent"} />
          </div>
        </div>

        <aside className="formula-guide">
          <div><span>PRICE</span><strong>{arabic ? "مُدخل مباشر (سعر الوحدة)" : "Direct input (unit price)"}</strong></div>
          <div><span>RENT</span><strong>{arabic ? "المساحة × إيجار القدم" : "Area × annual rent per sq ft"}</strong></div>
          <div><span>ROA</span><strong>{arabic ? "صافي الإيجار ÷ سعر العقار" : "Net rent ÷ property price"}</strong></div>
          <div><span>ROE</span><strong>{arabic ? "صافي الإيجار ÷ رأس المال المدفوع" : "Net rent ÷ paid equity"}</strong></div>
          <div><span>ROI</span><strong>{arabic ? "(صافي الإيجار + الزيادة الرأسمالية) ÷ رأس المال المدفوع" : "(Net rent + capital gain) ÷ paid equity"}</strong></div>
        </aside>

        <p className="calculator-disclaimer">
          {arabic ? "هذه الحاسبة تقديرية وليست نصيحة مالية. الأسعار والإيجارات والمصاريف ونسب الزيادة يجب التحقق منها قبل اتخاذ قرار استثماري." : "This calculator is illustrative and does not constitute financial advice. Prices, rents, expenses and appreciation rates should be verified before making an investment decision."}
        </p>
      </section>

      <section className="investment-calculator">
        <div className="calculator-title-row">
          <div>
            <span>03</span>
            <h2>{arabic ? "تحويل سريع" : "Quick converter"}</h2>
          </div>
          <p>{arabic ? "لأي رقم عايز تحوّله بسرعة، برّه حسابات الوحدة فوق" : "For any quick number, outside the unit's calculation above"}</p>
        </div>
        <div className="converter-grid">
          <AreaConverter arabic={arabic} />
          <CurrencyConverter arabic={arabic} />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function AreaConverter({ arabic }: { arabic: boolean }) {
  const [sqft, setSqft] = useState(1000);
  const [sqm, setSqm] = useState(1000 / SQFT_PER_SQM);
  return (
    <div className="converter-card">
      <p>{arabic ? "متر² ↔ قدم²" : "Sq m ↔ Sq ft"}</p>
      <div className="converter-row">
        <label>
          <span>{arabic ? "قدم²" : "Sq ft"}</span>
          <input type="number" min="0" value={num(sqft, 2)} onChange={(event) => {
            const value = Number(event.target.value);
            setSqft(value);
            setSqm(value / SQFT_PER_SQM);
          }} />
        </label>
        <b>=</b>
        <label>
          <span>{arabic ? "متر²" : "Sq m"}</span>
          <input type="number" min="0" value={num(sqm, 2)} onChange={(event) => {
            const value = Number(event.target.value);
            setSqm(value);
            setSqft(value * SQFT_PER_SQM);
          }} />
        </label>
      </div>
    </div>
  );
}

function CurrencyConverter({ arabic }: { arabic: boolean }) {
  const [aedValue, setAedValue] = useState(3672500);
  const [usdValue, setUsdValue] = useState(3672500 / AED_PER_USD);
  return (
    <div className="converter-card">
      <p>{arabic ? "درهم ↔ دولار (1$ = 3.6725 د.إ)" : "AED ↔ USD (1$ = AED 3.6725)"}</p>
      <div className="converter-row">
        <label>
          <span>AED</span>
          <input type="number" min="0" value={num(aedValue, 0)} onChange={(event) => {
            const value = Number(event.target.value);
            setAedValue(value);
            setUsdValue(value / AED_PER_USD);
          }} />
        </label>
        <b>=</b>
        <label>
          <span>USD</span>
          <input type="number" min="0" value={num(usdValue, 0)} onChange={(event) => {
            const value = Number(event.target.value);
            setUsdValue(value);
            setAedValue(value * AED_PER_USD);
          }} />
        </label>
      </div>
      <span className="converter-note">{aed(aedValue)} = {usd(usdValue)}</span>
    </div>
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

function CalculatorInputToggle<T extends string>({
  label,
  value,
  setValue,
  unit,
  setUnit,
  options,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  unit: T;
  setUnit: (unit: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="sheet-input">
      <span><strong>{label}</strong></span>
      <span>
        <input type="number" min="0" step="1" value={Number(value.toFixed(2))} onChange={(event) => setValue(Number(event.target.value))} />
        <span className="unit-toggle">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={unit === option.value ? "active" : ""}
              onClick={() => setUnit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </span>
      </span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span><strong>{label}</strong></span><b>{value}</b></div>;
}

function ReturnCard({ label, value, formula }: { label: string; value: string; formula: string }) {
  return <div className="return-row"><span><strong>{label}</strong><small>{formula}</small></span><b>{value}</b></div>;
}
