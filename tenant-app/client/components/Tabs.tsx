import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  tab_name: string;
  tab_label: string;
  tab_slug: string;
  tab_order: number;
  is_enabled: boolean;
  content_type: "text" | "page" | "html";
  content?: string;
  page_slug?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTabSlug?: string;
  onTabChange?: (tabSlug: string) => void;
  contentClassName?: string;
  tabListClassName?: string;
  tabTriggerClassName?: string;
  tabContentClassName?: string;
}

export function InfoTabs({
  tabs,
  activeTabSlug,
  onTabChange,
  contentClassName = "",
  tabListClassName = "",
  tabTriggerClassName = "",
  tabContentClassName = "",
}: TabsProps) {
  const enabledTabs = tabs.filter((tab) => tab.is_enabled).sort((a, b) => a.tab_order - b.tab_order);

  const [activeTab, setActiveTab] = useState<string>(
    activeTabSlug || (enabledTabs[0]?.tab_slug || "")
  );

  const handleTabChange = (tabSlug: string) => {
    setActiveTab(tabSlug);
    onTabChange?.(tabSlug);
  };

  const currentTab = enabledTabs.find((tab) => tab.tab_slug === activeTab);

  if (enabledTabs.length === 0) {
    return null;
  }

  return (
    <div className={cn("tabs-container", contentClassName)}>
      {/* Tab Navigation */}
      <div
        className={cn(
          "tab-list flex border-b border-gray-200",
          tabListClassName
        )}
      >
        {enabledTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.tab_slug)}
            className={cn(
              "px-6 py-3 font-medium text-sm transition-colors relative",
              activeTab === tab.tab_slug
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900",
              tabTriggerClassName
            )}
          >
            {tab.tab_label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {currentTab && (
        <div className={cn("tab-content py-6", tabContentClassName)}>
          {currentTab.content_type === "text" && (
            <div className="prose max-w-none">
              {currentTab.content ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {currentTab.content}
                </p>
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
          )}
          {currentTab.content_type === "html" && (
            <div className="prose max-w-none">
              {currentTab.content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: currentTab.content }}
                  className="text-gray-700"
                />
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
          )}
          {currentTab.content_type === "page" && (
            <div className="text-gray-500">
              <p>Page content will be loaded from: {currentTab.page_slug}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
