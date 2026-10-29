import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Crown,
  X,
  Lock,
  Unlock,
  Download,
  Upload,
  KeyRound,
  QrCode,
  Globe,
  ExternalLink,
  Sparkles,
  FlaskConical,
  Copy,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage, formatMessage } from '../../../i18n';
import {
  PAYWALL_ENABLED,
  COMMERCE_CONFIG,
  PricingRegionId,
  PricingTier,
  buildLemonSqueezyCheckoutUrl,
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

  useEffect(() => {
    if (isOpen) {
      setActiveTab('pricing');
      setErrorMsg(null);
    }
  }, [isOpen, triggerContext]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { license, availableTiers, pricingRegion } = pro;
  const visibleTiers = availableTiers;
  const activeTier: PricingTier | undefined =
    visibleTiers.find((tier) => tier.id === pricingRegion) || visibleTiers[0];

  const regionName = (id: PricingRegionId) =>
    id === 'vn-ppp' ? s.regionVn : id === 'emerging-ppp' ? s.regionEmerging : s.regionGlobal;
  const regionNote = (id: PricingRegionId) =>
    id === 'vn-ppp' ? s.regionNoteVn : id === 'emerging-ppp' ? s.regionNoteEmerging : s.regionNoteGlobal;

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
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

  const orderForTier = (tier: PricingTier) =>
    pro.pendingOrder && pro.pendingOrder.region === tier.id ? pro.pendingOrder : null;

  const handleLemonSqueezyCheckout = (tier: PricingTier) => {
    const order = orderForTier(tier) || pro.startOrder(tier.id);
    window.open(buildLemonSqueezyCheckoutUrl(tier.checkoutUrl, order.code), '_blank', 'noopener,noreferrer');
  };

  const renderVietQr = (tier: PricingTier) => {
    const order = orderForTier(tier);
    const amountText = `${COMMERCE_CONFIG.vnPriceVnd.toLocaleString('vi-VN')}₫`;
    return (
      <div className="bg-[#0b0f17] border border-emerald-500/30 rounded-xl p-4 space-y-3 text-xs">
        <div className="font-bold text-emerald-300 flex items-center gap-2">
          <QrCode className="w-4 h-4 shrink-0" />
          <span>{formatMessage(s.vnTitle, { price: tier.priceDisplay })}</span>
        </div>
        <p className="text-slate-300 leading-relaxed">{s.vnBody}</p>

        {order ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img
              src={buildVietQrImageUrl(tier.checkoutUrl, COMMERCE_CONFIG.vnPriceVnd, order.code)}
              alt={s.vnQrAlt}
              className="w-44 h-44 rounded-lg bg-white p-1.5 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-2 min-w-0 flex-1">
              <div>
                <div className="text-[10.5px] text-slate-400">{s.vnAmountLabel}</div>
                <div className="font-mono font-bold text-white text-sm">{amountText}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-400">{s.vnContentLabel}</div>
                <button
                  type="button"
                  onClick={() => handleCopy(order.code)}
                  className="font-mono font-bold text-emerald-300 text-sm inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  {order.code}
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {!isDynamicVietQr(tier.checkoutUrl) && <p className="text-amber-300">{s.vnStaticQrHint}</p>}
              {pro.canAutoClaim ? (
                <p className="text-sky-300 flex items-start gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />
                  <span>{s.vnWaiting}</span>
                </p>
              ) : (
                <p className="text-slate-300">{formatMessage(s.vnManualHint, { email: COMMERCE_CONFIG.supportEmail })}</p>
              )}
              <button
                type="button"
                onClick={() => pro.startOrder(tier.id)}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                {s.vnNewOrder}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => pro.startOrder(tier.id)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg inline-flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{formatMessage(s.vnTitle, { price: tier.priceDisplay })}</span>
          </button>
        )}
      </div>
    );
  };

  const renderLemonSqueezy = (tier: PricingTier) => (
    <div className="bg-[#0b0f17] border border-indigo-500/30 rounded-xl p-4 space-y-3 text-xs">
      <div className="font-bold text-indigo-300 flex items-center gap-2">
        <Globe className="w-4 h-4 shrink-0" />
        <span>{formatMessage(s.globalTitle, { price: tier.priceDisplay })}</span>
      </div>
      <p className="text-slate-300 leading-relaxed">{s.globalBody}</p>
      <button
        type="button"
        onClick={() => handleLemonSqueezyCheckout(tier)}
        className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        <span>{formatMessage(s.globalBuy, { price: tier.priceDisplay })}</span>
      </button>
      {orderForTier(tier) && pro.canAutoClaim && (
        <p className="text-sky-300 flex items-start gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />
          <span>{s.globalAfterHint}</span>
        </p>
      )}
    </div>
  );

  const billableProjects = countBillableProjects(projects);

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={s.modalTitle}
    >
      <input
        ref={certFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleCertificateFileChange}
        className="hidden"
      />
      <div
        className="w-full max-w-3xl max-h-[92vh] bg-[#0b0f17] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#111722] border-b border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#B20015] flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">{s.modalTitle}</h2>
              <p className="text-[11px] text-slate-400 truncate">{s.modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={s.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0e141f] border-b border-slate-800/80 flex items-center gap-1.5 shrink-0" role="tablist">
          {(['pricing', 'why'] as StoreModalTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-sky-500 text-slate-950 shadow-xs'
                  : 'bg-[#161f30] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'pricing' ? <Crown className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{tab === 'pricing' ? s.tabPricing : s.tabWhy}</span>
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'pricing' && (
            <>
              {/* Ngữ cảnh paywall */}
              {!license.isPro && triggerContext && (
                <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 space-y-1 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{formatMessage(s.paywallTitle, { feature: triggerContext.featureLabel })}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {formatMessage(s.paywallBody, { feature: triggerContext.featureLabel })}
                  </p>
                </div>
              )}

              {/* Trạng thái bản quyền */}
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      license.isPro
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {license.isPro ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1 min-w-0 text-xs">
                    <div className="text-sm font-bold text-white">{license.isPro ? s.statusPro : s.statusFree}</div>
                    {license.isPro ? (
                      <div className="text-slate-400 space-y-0.5">
                        <div>
                          {s.licenseIdLabel}: <span className="font-mono text-slate-200 break-all">{license.licenseId}</span>
                        </div>
                        <div>
                          {license.regionLabel} · {s.activatedAtLabel}: {formatDate(license.activatedAt)}
                        </div>
                        {license.plan === 'team' && (
                          <div>{formatMessage(s.planTeam, { seats: license.seats || 5 })}</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 leading-relaxed">{s.statusFreeHint}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {license.isPro && !license.isDevSimulation && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pro.exportCertificate()) showToast(s.certificateExported);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{s.exportCertificate}</span>
                    </button>
                  )}
                  {!license.isPro && (
                    <button
                      type="button"
                      onClick={() => certFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{s.importCertificate}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quyền lợi PRO — chỉ liệt kê tính năng đang thực sự hoạt động */}
              {!license.isPro && PAYWALL_ENABLED && (
                <div className="bg-[#131b29] border border-emerald-500/30 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider">{s.benefitsTitle}</div>
                  <ul className="space-y-1.5">
                    {[
                      COMMERCE_CONFIG.syncApiUrl ? s.benefitSync : null,
                      s.benefitProjects,
                      s.benefitReports,
                      s.benefitSupport,
                    ]
                      .filter((item): item is string => Boolean(item))
                      .map((item) => (
                        <li key={item} className="flex items-start gap-2 text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                  <p className="text-[11px] text-slate-400">{s.freeIncludes}</p>
                </div>
              )}

              {/* Bảng giá theo vùng + đúng 1 nút mua cho vùng đang chọn */}
              {!license.isPro && PAYWALL_ENABLED && (
                <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{s.regionTitle}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {s.oneTimeBadge}
                    </span>
                  </div>

                  {visibleTiers.length > 1 && (
                    <div className="inline-flex flex-wrap rounded-lg bg-[#0b0f17] p-1 border border-slate-800 gap-1">
                      {visibleTiers.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => pro.setPricingRegion(tier.id)}
                          className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            activeTier?.id === tier.id ? 'bg-sky-500 text-slate-950 shadow-2xs' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{tier.flag}</span>
                          <span>
                            {regionName(tier.id)} · {tier.priceDisplay}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTier ? (
                    <>
                      <p className="text-[11.5px] text-slate-300">{regionNote(activeTier.id)}</p>
                      {activeTier.channel === 'vietqr' ? renderVietQr(activeTier) : renderLemonSqueezy(activeTier)}
                    </>
                  ) : (
                    <p className="text-xs text-slate-300">
                      {formatMessage(s.channelUnavailable, { email: COMMERCE_CONFIG.supportEmail })}
                    </p>
                  )}
                </div>
              )}

              {/* Kích hoạt bằng link / token */}
              {!license.isPro && (
                <form onSubmit={handleActivateSubmit} className="bg-[#131b29] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>{s.activateTitle}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={s.activatePlaceholder}
                      rows={2}
                      spellCheck={false}
                      className="flex-1 bg-[#0b0f17] border border-slate-700/80 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 outline-none resize-none break-all"
                    />
                    <button
                      type="submit"
                      disabled={isActivating || !tokenInput.trim()}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-white disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
                    >
                      {isActivating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{s.activateButton}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{s.activateHint}</p>
                </form>
              )}

              {errorMsg && <p className="text-xs text-rose-400 font-medium" role="alert">{errorMsg}</p>}

              {/* Lượt dùng thử */}
              {!license.isPro && PAYWALL_ENABLED && (
                <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{s.trialsTitle}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.trialsSubtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5 font-mono tabular-nums text-slate-100">
                      {pro.isGrandfathered
                        ? s.trialProjectsGrandfathered
                        : formatMessage(s.trialProjects, { count: billableProjects, limit: FREE_PROJECT_LIMIT })}
                    </div>
                    {(
                      [
                        ['markdownReport', s.trialMarkdown, 'text-emerald-300'],
                      ] as const
                    ).map(([key, label, color]) => (
                      <div key={key} className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5">
                        <div className="text-[10.5px] text-slate-400">{label}</div>
                        <div className={`font-mono font-bold mt-0.5 tabular-nums ${color}`}>
                          {formatMessage(s.trialRemaining, { count: pro.trials[key] })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Công cụ nhà phát triển — không tồn tại trong bản build production */}
              {pro.devTools && (
                <div className="border border-dashed border-amber-500/40 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{s.devToolsTitle}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        [s.devSimulatePro, pro.devTools.simulatePro],
                        [s.devDeactivate, pro.devTools.deactivate],
                        [s.devResetTrials, pro.devTools.resetTrials],
                      ] as const
                    ).map(([label, action]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => showToast(action())}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'why' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#131b29] border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="font-bold text-amber-300 text-sm">{s.whyTitle}</div>
                <p className="text-slate-300 leading-relaxed">{s.whyIntro}</p>
                <p className="text-slate-400 leading-relaxed">{s.whyUseBoth}</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[560px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-[#0f1623]">
                        <th className="py-2.5 px-3">{s.compareFeature}</th>
                        <th className="py-2.5 px-3 text-sky-300 bg-sky-500/5">Stride Tasks</th>
                        <th className="py-2.5 px-3">Notion</th>
                        <th className="py-2.5 px-3">Todoist</th>
                        <th className="py-2.5 px-3">Things 3</th>
                        <th className="py-2.5 px-3">TickTick</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {s.compareRows.map((row) => (
                        <tr key={row.feature}>
                          <td className="py-2 px-3 font-semibold text-slate-200">{row.feature}</td>
                          <td className="py-2 px-3 text-emerald-400 font-semibold bg-sky-500/5">{row.stride}</td>
                          <td className="py-2 px-3 text-slate-300">{row.notion}</td>
                          <td className="py-2 px-3 text-slate-300">{row.todoist}</td>
                          <td className="py-2 px-3 text-slate-300">{row.things}</td>
                          <td className="py-2 px-3 text-slate-300">{row.ticktick}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-500">{s.compareFootnote}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
