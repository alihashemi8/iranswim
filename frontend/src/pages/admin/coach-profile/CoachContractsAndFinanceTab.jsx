import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CreditCard, Layers } from 'lucide-react';
import { CoachContractsTab } from './CoachContractsTab';
import { CoachPayrollTab } from './CoachPayrollTab';

export const CoachContractsAndFinanceTab = ({
  coach,
  contracts,
  payrolls,
  onContractsUpdated,
  onPayrollsUpdated,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial subtab: check 'subtab' param first, or 'tab' (e.g. if redirected from tab=PAYROLL)
  const getInitialSubTab = () => {
    const sub = searchParams.get('subtab');
    if (sub === 'PAYROLL' || sub === 'CONTRACTS' || sub === 'ALL') {
      return sub;
    }
    const main = searchParams.get('tab');
    if (main === 'PAYROLL') return 'PAYROLL';
    if (main === 'CONTRACTS') return 'CONTRACTS';
    return 'CONTRACTS';
  };

  const [subTab, setSubTab] = useState(getInitialSubTab);

  useEffect(() => {
    const sub = searchParams.get('subtab');
    const main = searchParams.get('tab');
    if (sub === 'PAYROLL' || sub === 'CONTRACTS' || sub === 'ALL') {
      if (sub !== subTab) setSubTab(sub);
    } else if (main === 'PAYROLL' && subTab !== 'PAYROLL') {
      setSubTab('PAYROLL');
    } else if (main === 'CONTRACTS' && subTab !== 'CONTRACTS') {
      setSubTab('CONTRACTS');
    }
  }, [searchParams]);

  const handleSubTabChange = (key) => {
    setSubTab(key);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'CONTRACTS_AND_FINANCE');
        next.set('subtab', key);
        return next;
      },
      { replace: true }
    );
  };

  const contractsCount = (contracts || []).length;
  const payrollsCount = (payrolls || []).length;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSubTabChange('CONTRACTS')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'CONTRACTS'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>احکام و قراردادها</span>
            {contractsCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {contractsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('PAYROLL')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'PAYROLL'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>حقوق و امور مالی</span>
            {payrollsCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {payrollsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('ALL')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>نمایش یکپارچه</span>
          </button>
        </div>

        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-3 hidden lg:inline">
          {subTab === 'CONTRACTS' && 'احکام همکاری، نرخ‌های پایه و سوابق قراردادهای مربی'}
          {subTab === 'PAYROLL' && 'فیش‌های حقوقی دوره‌ای، تسویه حساب و اسناد پرداختی'}
          {subTab === 'ALL' && 'نمایش توأم احکام، قراردادها و وضعیت مالی مربی'}
        </span>
      </div>

      {/* Sub-tab Content Panels */}
      <div>
        {subTab === 'CONTRACTS' && (
          <CoachContractsTab
            coach={coach}
            contracts={contracts}
            onContractsUpdated={onContractsUpdated}
          />
        )}

        {subTab === 'PAYROLL' && (
          <CoachPayrollTab
            coach={coach}
            payrolls={payrolls}
            onPayrollsUpdated={onPayrollsUpdated}
          />
        )}

        {subTab === 'ALL' && (
          <div className="space-y-10">
            <CoachContractsTab
              coach={coach}
              contracts={contracts}
              onContractsUpdated={onContractsUpdated}
            />

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-full text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5 shadow-xs border border-slate-200 dark:border-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                  امور مالی، فیش‌های حقوقی و پرداخت‌ها
                </span>
              </div>
            </div>

            <CoachPayrollTab
              coach={coach}
              payrolls={payrolls}
              onPayrollsUpdated={onPayrollsUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
};
