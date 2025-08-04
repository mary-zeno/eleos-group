import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LanguageToggle from './LanguageToggle';
import { Menu, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import logo from "@/assets/images/Logo.svg";

export default function Navigation({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && data?.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  const navItems = user
    ? [
      { href: "/dashboard", label: t("nav.dashboard") },
      { href: "/property-form", label: t("nav.propertyForm") },
      { href: "/travel-form", label: t("nav.travelForm") },
      { href: "/business-form", label: t("nav.businessForm") },
    ]
    : [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-xl font-thin text-charcoal hover:text-charcoal p-0 h-auto"
            >
              <img src={logo} alt="ELOS Services" className="h-8 w-8" />
              <span>{t("nav.appName")}</span>
            </Button>
          </div>
          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          )}
          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            {user ? (
              /* Desktop User Dropdown */
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.editProfile")}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        {t("nav.settings")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex space-x-4">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {t("nav.login")}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <h2 className="text-lg font-semibold">{t("nav.appName")}</h2>
                      {user && (
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      )}
                    </div>

                    {user ? (
                      <>
                        <nav className="flex-1 p-4">
                          <div className="space-y-2">
                            {navItems.map((item) => (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === item.href
                                  ? "bg-blue-100 text-blue-700"
                                  : "hover:bg-gray-100"
                                  }`}
                              >
                                <span>{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        </nav>

                        <div className="p-4 border-t space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              navigate("/edit-profile");
                              setIsOpen(false);
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            {t("nav.editProfile")}
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                navigate("/settings");
                                setIsOpen(false);
                              }}
                            >
                              <SettingsIcon className="mr-2 h-4 w-4" />
                              {t("nav.settings")}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700"
                            onClick={handleLogout}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("nav.logout")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 p-4 flex flex-col justify-center space-y-4">
                        <Button
                          onClick={() => {
                            navigate("/auth");
                            setIsOpen(false);
                          }}
                          className="w-full"
                        >
                          {t("nav.login")}
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
