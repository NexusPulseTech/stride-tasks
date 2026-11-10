import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Crown, Loader2, X } from 'lucide-react';
import { useLanguage, formatMessage } from '../../../i18n';
import {
  PAYWALL_ENABLED,
  COMMERCE_CONFIG,
  PricingTier,
  buildCardCheckoutUrl,
  buildVietQrImageUrl,
  isDynamicVietQr,
} from '../../../config/commerceConfig';
import { ProLicenseApi, FREE_PROJECT_LIMIT, countBillableProjects } from '../../../hooks/useProLicense';
import { Project } from '../../../types';

export type StoreModalTab = 'pricing' | 'why';

export interface PaywallTriggerContext {
  featureKey: string;
  featureLabel: string;
}

export interface StoreCommercialModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: PaywallTriggerContext | null;
  pro: ProLicenseApi;
  projects: Project[];
  showToast: (msg: string) => void;
}

const MAX_CERTIFICATE_BYTES = 64 * 1024;

// Cùng hệ màu với các hộp thoại khác (SyncModal): nền sáng/tối theo giao diện, nút chính đỏ thương hiệu, không màu trang trí
const CARD = 'rounded-xl border border-slate-200 dark:border-slate-800';
const MUTED = 'text-slate-500 dark:text-slate-400';
const BTN_PRIMARY =
  'w-full py-2.5 rounded-xl bg-[#B20015] hover:bg-[#9C0012] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors';
const BTN_SECONDARY =
  'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50';

/** Tên nước theo ngôn ngữ giao diện (Intl), không dùng cờ emoji */
function countryName(code: string | null, language: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([language === 'vi' ? 'vi' : 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function StoreCommercialModal({
  isOpen,
  onClose,
  triggerContext = null,
  pro,
  projects,
  showToast,
}: StoreCommercialModalProps) {
  const { t, language } = useLanguage();
  const s = t.store;
  const [activeTab, setActiveTab] = useState<StoreModalTab>('pricing');
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const { refreshPricing } = pro;

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('pricing');
    setErrorMsg(null);
    // Máy chủ quyết định giá theo quốc gia mỗi lần mở (A12); đã nhớ thì hiện ngay, hỏi lại ở nền
    void refreshPricing();
  }, [isOpen, triggerContext, refreshPricing]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { license, currentTier: tier, pricingCountry, pricingStatus } = pro;
  const checkingPrice = pricingStatus === 'loading';
  const regionLabel = tier && tier.id !== 'global-us' ? countryName(pricingCountry, language) : null;

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setErrorMsg(null);
    setIsActivating(true);
    const res = await pro.activateWithToken(tokenInput);
    setIsActivating(false);
    if (res.ok) {
      setTokenInput('');
      showToast(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_CERTIFICATE_BYTES) {
      setErrorMsg(t.license.corruptCertificate);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const res = await pro.importCertificate(String(ev.target?.result || ''));
      if (res.ok) {
        setErrorMsg(null);
        showToast(res.message);
      } else {
        setErrorMsg(res.message);
      }
    };
    reader.onerror = () => setErrorMsg(t.license.corruptCertificate);
    reader.readAsText(file);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => showToast(`${t.common.copy}: ${text}`),
      () => {}
    );
  };

  const orderForTier = (x: PricingTier) => (pro.pendingOrder && pro.pendingOrder.region === x.id ? pro.pendingOrder : null);

  const handleCardCheckout = (x: PricingTier) => {
    const order = orderForTier(x) || pro.startOrder(x.id);
    window.open(buildCardCheckoutUrl(x, order.code), '_blank', 'noopener,noreferrer');
  };

  const renderVietQr = (x: PricingTier) => {
    const order = orderForTier(x);
    if (!order) {
      return (
        <div className="space-y-2">
          <p className={`text-xs leading-relaxed ${MUTED}`}>{s.vnBody}</p>
          <button type="button" onClick={() => pro.startOrder(x.id)} className={BTN_PRIMARY}>
            {formatMessage(s.vnTitle, { price: x.priceDisplay })}
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <img
          src={buildVietQrImageUrl(x.checkoutUrl, COMMERCE_CONFIG.vnPriceVnd, order.code)}
          alt={s.vnQrAlt}
          className="w-40 h-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1.5 object-contain shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="space-y-2 min-w-0 flex-1 text-xs">
          <div>
            <div className={MUTED}>{s.vnAmountLabel}</div>
            <div className="font-mono font-bold text-sm">{`${COMMERCE_CONFIG.vnPriceVnd.toLocaleString('vi-VN')}₫`}</div>
          </div>
          <div>
            <div className={MUTED}>{s.vnContentLabel}</div>
            <button
              type="button"
              onClick={() => handleCopy(order.code)}
              className="font-mono font-bold text-sm inline-flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              {order.code}
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          {!isDynamicVietQr(x.checkoutUrl) && <p className="text-amber-700 dark:text-amber-300">{s.vnStaticQrHint}</p>}
          {pro.canAutoClaim ? (
            <p className={`flex items-start gap-1.5 ${MUTED}`}>
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" aria-hidden="true" />
              <span>{s.vnWaiting}</span>
            </p>
          ) : (
            <p className={MUTED}>{formatMessage(s.vnManualHint, { email: COMMERCE_CONFIG.supportEmail })}</p>
          )}
          <button type="button" onClick={() => pro.startOrder(x.id)} className={`text-[11px] underline cursor-pointer ${MUTED}`}>
            {s.vnNewOrder}
          </button>
        </div>
      </div>
    );
  };

  const benefits = [COMMERCE_CONFIG.syncApiUrl ? s.benefitSync : null, s.benefitProjects, s.benefitReports, s.benefitSupport].filter(
    (item): item is string => Boolean(item)
  );

  const renderOffer = () => {
    if (!tier) {
      return <p className={`text-xs ${MUTED}`}>{formatMessage(s.channelUnavailable, { email: COMMERCE_CONFIG.supportEmail })}</p>;
    }
    return (
      <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
        <div aria-live="polite">
          {checkingPrice ? (
            <div className="space-y-2" aria-label={s.priceChecking}>
              <div className="h-8 w-24 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-40 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{tier.priceDisplay}</span>
                <span className={`text-xs ${MUTED}`}>{s.priceOneTime}</span>
              </div>
              {regionLabel && <p className={`text-xs mt-1 ${MUTED}`}>{formatMessage(s.priceForCountry, { country: regionLabel })}</p>}
            </>
          )}
        </div>

        <ul className="space-y-2">
          {benefits.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {tier.channel === 'vietqr' ? (
          renderVietQr(tier)
        ) : (
          <div className="space-y-2">
            <button type="button" disabled={checkingPrice} onClick={() => handleCardCheckout(tier)} className={BTN_PRIMARY}>
              {formatMessage(s.buyButton, { price: tier.priceDisplay })}
            </button>
            {orderForTier(tier) && pro.canAutoClaim && (
              <p className={`text-xs flex items-start gap-1.5 ${MUTED}`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" aria-hidden="true" />
                <span>{s.afterBuyHint}</span>
              </p>
            )}
          </div>
        )}

        <p className={`text-[11px] leading-relaxed ${MUTED}`}>
          {s.foundingNote} {s.trustLine}
        </p>
      </section>
    );
  };

  const billableProjects = countBillableProjects(projects);

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={s.modalTitle}
    >
      <input ref={certFileInputRef} type="file" accept=".json,application/json" onChange={handleCertificateFileChange} className="hidden" />
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-[#11141c] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#B20015] text-white flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">{s.modalTitle}</h2>
              <p className={`text-xs mt-0.5 ${MUTED}`}>{s.modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer shrink-0"
            aria-label={s.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 shrink-0">
          <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs" role="tablist">
            {(['pricing', 'why'] as StoreModalTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'pricing' ? s.tabPricing : s.tabWhy}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'pricing' && (
            <>
              {!license.isPro && triggerContext && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs">
                  <div className="font-semibold text-amber-800 dark:text-amber-300">
                    {formatMessage(s.paywallTitle, { feature: triggerContext.featureLabel })}
                  </div>
                  <p className="mt-0.5 leading-relaxed text-amber-700 dark:text-amber-200/80">
                    {formatMessage(s.paywallBody, { feature: triggerContext.featureLabel })}
                  </p>
                </div>
              )}

              {license.isPro ? (
                <section className={`${CARD} p-4 space-y-3`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} aria-hidden="true" />
                    <span>{s.statusPro}</span>
                  </div>
                  <dl className={`text-xs space-y-1 ${MUTED}`}>
                    <div className="flex gap-1.5">
                      <dt>{s.licenseIdLabel}:</dt>
                      <dd className="font-mono text-slate-700 dark:text-slate-200 break-all">{license.licenseId}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>{s.activatedAtLabel}:</dt>
                      <dd>{formatDate(license.activatedAt)}</dd>
                    </div>
                    {license.plan === 'team' && <div>{formatMessage(s.planTeam, { seats: license.seats || 5 })}</div>}
                  </dl>
                  {!license.isDevSimulation && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pro.exportCertificate()) showToast(s.certificateExported);
                      }}
                      className={BTN_SECONDARY}
                    >
                      {s.exportCertificate}
                    </button>
                  )}
                </section>
              ) : (
                <>
                  {PAYWALL_ENABLED && renderOffer()}
                  {PAYWALL_ENABLED && <p className={`text-xs leading-relaxed ${MUTED}`}>{s.freeIncludes}</p>}

                  <section className={`${CARD} p-4 space-y-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold">{s.alreadyBought}</h3>
                      <button type="button" onClick={() => certFileInputRef.current?.click()} className={BTN_SECONDARY}>
                        {s.importCertificate}
                      </button>
                    </div>
                    <form onSubmit={handleActivateSubmit} className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder={s.activatePlaceholder}
                        aria-label={s.activatePlaceholder}
                        rows={2}
                        spellCheck={false}
                        className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono outline-none focus:border-sky-500 resize-none break-all"
                      />
                      <button
                        type="submit"
                        disabled={isActivating || !tokenInput.trim()}
                        className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isActivating && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                        <span>{s.activateButton}</span>
                      </button>
                    </form>
                    <p className={`text-[11px] ${MUTED}`}>{s.activateHint}</p>
                  </section>
                </>
              )}

              {errorMsg && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
                  {errorMsg}
                </p>
              )}

              {!license.isPro && PAYWALL_ENABLED && (
                <section className={`${CARD} p-4 space-y-2 text-xs`}>
                  <h3 className="font-semibold">{s.usageTitle}</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
                    <span>
                      {pro.isGrandfathered
                        ? s.trialProjectsGrandfathered
                        : formatMessage(s.trialProjects, { count: billableProjects, limit: FREE_PROJECT_LIMIT })}
                    </span>
                    <span>
                      {s.trialMarkdown}: {formatMessage(s.trialRemaining, { count: pro.trials.markdownReport })}
                    </span>
                  </div>
                  <p className={`text-[11px] ${MUTED}`}>{s.trialsSubtitle}</p>
                </section>
              )}

              {/* Công cụ nhà phát triển, không tồn tại trong bản build production */}
              {pro.devTools && (
                <section className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 space-y-2 text-xs">
                  <h3 className="font-semibold">{s.devToolsTitle}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        [s.devSimulatePro, pro.devTools.simulatePro],
                        [s.devDeactivate, pro.devTools.deactivate],
                        [s.devResetTrials, pro.devTools.resetTrials],
                      ] as const
                    ).map(([label, action]) => (
                      <button key={label} type="button" onClick={() => showToast(action())} className={BTN_SECONDARY}>
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === 'why' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s.whyTitle}</h3>
                <p className={`leading-relaxed ${MUTED}`}>{s.whyIntro}</p>
                <p className={`leading-relaxed ${MUTED}`}>{s.whyUseBoth}</p>
              </div>
              <div className={`${CARD} overflow-x-auto`}>
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">{s.compareFeature}</th>
                      <th className="py-2.5 px-3 text-[#B20015] dark:text-red-300">Stride Tasks</th>
                      <th className="py-2.5 px-3">Notion</th>
                      <th className="py-2.5 px-3">Todoist</th>
                      <th className="py-2.5 px-3">Things 3</th>
                      <th className="py-2.5 px-3">TickTick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {s.compareRows.map((row) => (
                      <tr key={row.feature}>
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-200">{row.feature}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{row.stride}</td>
                        <td className={`py-2 px-3 ${MUTED}`}>{row.notion}</td>
                        <td className={`py-2 px-3 ${MUTED}`}>{row.todoist}</td>
                        <td className={`py-2 px-3 ${MUTED}`}>{row.things}</td>
                        <td className={`py-2 px-3 ${MUTED}`}>{row.ticktick}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`text-[10.5px] ${MUTED}`}>{s.compareFootnote}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
