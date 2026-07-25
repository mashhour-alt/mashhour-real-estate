"use client";

import { useMemo, useState } from "react";
import SectionHead from "@/components/SectionHead";
import { useLang, useSiteData } from "@/lib/site-context";

type Stage = { id: string; label: string; pct: number; equity: boolean };

const DEFAULT_INPUTS = {
  areaSqft: 880,
  pricePerSqft: 2400,
  rentPerSqft: 250,
  appreciation: 13,
  expenses: 0,
};

const defaultStages = (): Stage[] => [
  { id: "s1", label: "Booking", pct: 20, equity: true },
  { id: "s2", label: "Construction 1", pct: 30, equity: true },
  { id: "s3", label: "Construction 2", pct: 10, equity: true },
  { id: "s4", label: "Handover", pct: 40, equity: true },
];

const aed = (value: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value: number) =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(2)}%`;

export default function RoiPage() {
  const { t } = useLang();
  const { data } = useSiteData();

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [stages, setStages] = useState<Stage[]>(defaultStages);
  const [benchmark, setBenchmark] = useState("");

  const setInput = (key: keyof typeof DEFAULT_INPUTS, raw: string) => {
    const value = raw === "" ? 0 : Number(raw);
    setInputs((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : 0,
    }));
  };

  const updateStage = (id: string, patch: Partial<Stage>) =>
    setStages((current) =>
      current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    );

  const addStage = () =>
    setStages((current) => [
      ...current,
      { id: `s${Date.now()}`, label: `Stage ${current.length + 1}`, pct: 0, equity: true },
    ]);

  const removeStage = (id: string) =>
    setStages((current) => (current.length > 1 ? current.filter((s) => s.id !== id) : current));

  const reset = () => {
    setInputs(DEFAULT_INPUTS);
    setStages(defaultStages());
    setBenchmark("");
  };

  // Area benchmarks give a grounded starting point instead of invented numbers.
  const benchmarks = useMemo(
    () =>
      (data?.areas || [])
        .filter((item) => item["PSF Benchmark"] && item["Gross Yield"])
        .filter(
          (item, index, all) =>
            all.findIndex((other) => other.Area === item.Area) === index,
        )
        .sort((a, b) => a.Area.localeCompare(b.Area)),
    [data],
  );

  const applyBenchmark = (areaName: string) => {
    setBenchmark(areaName);
    const match = benchmarks.find((item) => item.Area === areaName);
    if (!match) return;
    const psf = match["PSF Benchmark"] || 0;
    const yieldRate = match["Gross Yield"] || 0;
    setInputs((current) => ({
      ...current,
      pricePerSqft: Math.round(psf),
      rentPerSqft: Math.round(psf * yieldRate),
    }));
  };

  /* --- Formulas, mirroring the workbook cell for cell ------------------ */
  const price = inputs.areaSqft * inputs.pricePerSqft;              // F6
  const annualRent = inputs.areaSqft * inputs.rentPerSqft;          // F7
  const netRent = Math.max(annualRent - inputs.expenses, 0);        // F8
  const projected = price * (1 + inputs.appreciation / 100);        // F9
  const capitalGain = projected - price;                            // F10

  const totalPct = stages.reduce((sum, stage) => sum + stage.pct, 0);
  const planOk = Math.abs(totalPct - 100) < 0.000001;
  const amountOf = (stage: Stage) => price * (stage.pct / 100);     // C15:C18
  const equityPaid = stages                                          // F15
    .filter((stage) => stage.equity)
    .reduce((sum, stage) => sum + amountOf(stage), 0);

  const roi = price ? netRent / price : 0;                          // F14
  const roe = equityPaid ? netRent / equityPaid : 0;                // F16
  const totalReturn = price ? (netRent + capitalGain) / price : 0;  // F17
  const payback = netRent ? equityPaid / netRent : 0;               // F18

  const fields: [keyof typeof DEFAULT_INPUTS, string][] = [
    ["areaSqft", t.calcAreaSqft],
    ["pricePerSqft", t.calcPricePerSqft],
    ["rentPerSqft", t.calcRentPerSqft],
    ["appreciation", t.calcAppreciation],
    ["expenses", t.calcExpenses],
  ];

  return (
    <section className="section light">
      <SectionHead
        number="06"
        eyebrow="INVESTMENT TOOL"
        title={t.roiTitle}
        sub={t.roiSub}
        aside={
          <button className="calc-reset" onClick={reset}>
            {t.calcReset} ↺
          </button>
        }
      />

      <div className="calc-layout">
        <div className="calc-main">
          {/* Inputs */}
          <div className="calc-block">
            <div className="detail-heading">
              <span>01</span>
              <h3>{t.calcInputs}</h3>
            </div>

            {benchmarks.length > 0 && (
              <label className="calc-benchmark">
                <small>{t.calcUseBenchmark}</small>
                <select value={benchmark} onChange={(e) => applyBenchmark(e.target.value)}>
                  <option value="">{t.allAreas}</option>
                  {benchmarks.map((item) => (
                    <option key={item.Area} value={item.Area}>
                      {item.Area} — AED {item["PSF Benchmark"]?.toLocaleString()} PSF
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="calc-fields">
              {fields.map(([key, label]) => (
                <label key={key}>
                  <small>{label}</small>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={inputs[key]}
                    onChange={(event) => setInput(key, event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Payment plan */}
          <div className="calc-block">
            <div className="detail-heading">
              <span>02</span>
              <h3>{t.calcPlan}</h3>
            </div>

            <div className="calc-plan">
              <div className="calc-plan-head">
                <span>{t.calcStage}</span>
                <span>{t.calcPercent}</span>
                <span>{t.calcAmount}</span>
                <span>{t.calcEquity}</span>
                <span />
              </div>

              {stages.map((stage) => (
                <div className="calc-plan-row" key={stage.id}>
                  <input
                    className="calc-stage-name"
                    value={stage.label}
                    onChange={(event) => updateStage(stage.id, { label: event.target.value })}
                    aria-label={t.calcStage}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    value={stage.pct}
                    onChange={(event) =>
                      updateStage(stage.id, { pct: Number(event.target.value) || 0 })
                    }
                    onFocus={(event) => event.currentTarget.select()}
                    aria-label={t.calcPercent}
                  />
                  <b className="calc-stage-amount">{aed(amountOf(stage))}</b>
                  <label className="calc-toggle">
                    <input
                      type="checkbox"
                      checked={stage.equity}
                      onChange={(event) =>
                        updateStage(stage.id, { equity: event.target.checked })
                      }
                    />
                    <span>{t.calcEquity}</span>
                  </label>
                  <button
                    className="calc-remove"
                    onClick={() => removeStage(stage.id)}
                    aria-label={t.calcRemove}
                    disabled={stages.length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="calc-plan-foot">
                <button className="calc-add" onClick={addStage}>
                  + {t.calcAddStage}
                </button>
                <div className={planOk ? "calc-status ok" : "calc-status bad"}>
                  <strong>
                    {t.calcTotal} {totalPct.toFixed(2)}%
                  </strong>
                  <small>{planOk ? t.calcPlanOk : t.calcPlanError}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Formula guide */}
          <div className="calc-block">
            <div className="detail-heading">
              <span>03</span>
              <h3>{t.calcFormulas}</h3>
            </div>
            <ul className="calc-formulas">
              <li>{t.calcF1}</li>
              <li>{t.calcF2}</li>
              <li>{t.calcF3}</li>
              <li>{t.calcF4}</li>
              <li>{t.calcF5}</li>
            </ul>
            <p className="source-note">{t.calcNote}</p>
          </div>
        </div>

        {/* Results */}
        <aside className="calc-results">
          <div className="calc-result-block">
            <h4>{t.calcSummary}</h4>
            <dl>
              <div>
                <dt>{t.calcPrice}</dt>
                <dd>{aed(price)}</dd>
              </div>
              <div>
                <dt>{t.calcAnnualRent}</dt>
                <dd>{aed(annualRent)}</dd>
              </div>
              <div>
                <dt>{t.calcNetRent}</dt>
                <dd>{aed(netRent)}</dd>
              </div>
              <div>
                <dt>{t.calcProjected}</dt>
                <dd>{aed(projected)}</dd>
              </div>
              <div>
                <dt>{t.calcGain}</dt>
                <dd>{aed(capitalGain)}</dd>
              </div>
            </dl>
          </div>

          <div className="calc-headline">
            <div>
              <small>{t.calcRoi}</small>
              <strong>{pct(roi)}</strong>
            </div>
            <div className="accent">
              <small>{t.calcRoe}</small>
              <strong>{pct(roe)}</strong>
            </div>
          </div>

          <div className="calc-result-block">
            <h4>{t.calcReturns}</h4>
            <dl>
              <div>
                <dt>{t.calcEquityPaid}</dt>
                <dd>{aed(equityPaid)}</dd>
              </div>
              <div>
                <dt>{t.calcTotalReturn}</dt>
                <dd>{pct(totalReturn)}</dd>
              </div>
              <div>
                <dt>{t.calcPayback}</dt>
                <dd>
                  {payback.toFixed(1)} {t.calcYears}
                </dd>
              </div>
            </dl>
          </div>

          <div className="calc-result-block">
            <h4>{t.calcAppreciationTitle}</h4>
            <div className="calc-projection">
              {[1, 3, 5, 10].map((years) => {
                const value = price * Math.pow(1 + inputs.appreciation / 100, years);
                const gain = value - price;
                return (
                  <div key={years}>
                    <small>
                      {years} {t.calcYears}
                    </small>
                    <strong>{aed(value)}</strong>
                    <span>+{aed(gain)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
