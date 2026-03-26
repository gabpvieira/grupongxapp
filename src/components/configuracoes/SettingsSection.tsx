import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <div className="py-8 border-b border-white/5 last:border-0">
    <div className="mb-6">
      <h3 className="text-white font-semibold text-sm tracking-tight">{title}</h3>
      {description && (
        <p className="text-white/35 text-xs mt-1.5 leading-relaxed max-w-lg font-medium">
          {description}
        </p>
      )}
    </div>
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  </div>
);
