import { patientTabs, type TabKey } from "../types";

type PatientTabsProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function PatientTabs({ activeTab, onChange }: PatientTabsProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white px-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex min-w-max items-center gap-6">
        {patientTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`inline-flex h-14 items-center gap-2 border-b-2 text-sm font-medium transition-colors ${active ? "border-primary-600 text-primary-600" : "border-transparent text-slate-600 hover:text-primary-600"}`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
