'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  MessageSquareIcon,
  LayoutDashboardIcon,
  DatabaseIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  MenuIcon,
  XIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '@/store/app-store';
import { OnboardingModal } from '@/components/OnboardingModal';
import { SchemaExplorer } from '@/components/SchemaExplorer';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquareIcon },
  { href: '/dashboards', label: 'Dashboards', icon: LayoutDashboardIcon },
  { href: '/connect', label: 'Connections', icon: DatabaseIcon },
  { href: '/settings', label: 'LLM Settings', icon: SettingsIcon },
];

function SidebarContent() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { connectionId, schemaAnalysis, schemaPanelOpen, toggleSchemaPanel, navSidebarOpen, toggleNavSidebar } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">QueryMind</h1>
        <div className="flex items-center gap-1">
          {schemaAnalysis && (
            <button
              onClick={toggleSchemaPanel}
              className="p-1.5 hover:bg-accent rounded-lg"
              title={schemaPanelOpen ? 'Hide Schema' : 'Show Schema'}
            >
              {schemaPanelOpen ? (
                <PanelLeftCloseIcon className="size-4" />
              ) : (
                <PanelLeftIcon className="size-4" />
              )}
            </button>
          )}
          <button
            onClick={toggleNavSidebar}
            className="p-1.5 hover:bg-accent rounded-lg"
            title={navSidebarOpen ? 'Hide Menu' : 'Show Menu'}
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent w-full"
          >
            {theme === 'dark' ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        )}

        {connectionId && schemaAnalysis && (
          <div className="flex items-center gap-2 px-3">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground truncate">
              {schemaAnalysis.tables.length} tables
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-1 hover:bg-accent rounded"
            title="Sign out"
          >
            <LogOutIcon className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const { llmConfig, connectionId, schemaPanelOpen, schemaAnalysis, navSidebarOpen, toggleNavSidebar, toggleSchemaPanel } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('querymind_onboarding_complete');
    if (status === 'authenticated' && (!llmConfig || !connectionId) && onboardingComplete !== 'true') {
      setOnboardingOpen(true);
    }
  }, [status, llmConfig, connectionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      {navSidebarOpen && (
        <aside className="hidden md:flex border-r bg-card flex-col w-60">
          <SidebarContent />
        </aside>
      )}

      {/* Toggle button for nav sidebar when closed */}
      {!navSidebarOpen && (
        <button
          onClick={toggleNavSidebar}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-card border border-r-0 p-2 rounded-r-lg shadow hover:bg-accent"
          title="Show Menu"
        >
          <PanelLeftIcon className="size-4" />
        </button>
      )}

      {/* Schema Panel - collapsible on right of sidebar */}
      {schemaPanelOpen && schemaAnalysis && (
        <aside className="hidden md:block w-72 border-r bg-card overflow-y-auto">
          <SchemaExplorer />
        </aside>
      )}

      {/* Toggle button for schema panel when closed */}
      {!schemaPanelOpen && schemaAnalysis && (
        <button
          onClick={toggleSchemaPanel}
          className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-card border border-l-0 p-2 rounded-l-lg shadow hover:bg-accent"
          title="Show Schema"
        >
          <PanelLeftCloseIcon className="size-4 rotate(180deg)" />
        </button>
      )}

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b">
          <div className="w-8" />
          <h1 className="text-lg font-bold">QueryMind</h1>
          <div className="w-8" />
        </header>

        {children}
      </main>

      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </div>
  );
}
