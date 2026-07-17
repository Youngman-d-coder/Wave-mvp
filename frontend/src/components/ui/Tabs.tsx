import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  defaultTab,
  variant = 'pills',
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  const pillStyles = {
    active: 'bg-wave-500 text-white shadow-lg shadow-wave-500/30',
    inactive: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-border',
  };

  const underlineStyles = {
    active: 'text-wave-500 border-b-2 border-wave-500',
    inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent',
  };

  const styles = variant === 'pills' ? pillStyles : underlineStyles;

  return (
    <div className={className}>
      <div className={`flex gap-1 ${variant === 'underline' ? 'border-b border-gray-200 dark:border-dark-border' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all duration-200
              ${variant === 'pills' ? 'rounded-xl' : ''}
              ${activeTab === tab.id ? styles.active : styles.inactive}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 animate-fade-in">
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
