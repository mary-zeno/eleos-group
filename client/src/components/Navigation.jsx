import { useState } from "react";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = user
    ? [
      { href: "/dashboard", label: t("nav.dashboard") },
      { href: "/property-form", label: t("nav.propertyForm") },
      { href: "/travel-form", label: t("nav.travelForm") },
      { href: "/business-form", label: t("nav.businessForm") },
    ]
    : [];

  return (
    <header className="bg-gradient-to-r from-charcoal-900 via-black to-charcoal-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-xl font-light text-white hover:text-accent p-0 h-auto transition-colors duration-300"
            >
              <img src={logo} alt="ELOS Services" className="h-8 w-8 filter brightness-0 invert" />
              <span>{t("nav.appName")}</span>
            </Button>
          </div>
          
          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-light transition-all duration-300 uppercase tracking-wider ${
                    location.pathname === item.href
                      ? "bg-accent text-black"
                      : "text-gray-300 hover:text-white hover:bg-accent/20 hover:backdrop-blur-sm hover:shadow-lg hover:shadow-accent/50"
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
                    <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-accent hover:bg-gray-800 transition-colors duration-300">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-light">{user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-charcoal-800 border-gray-700 text-white">
                    <DropdownMenuItem 
                      onClick={() => navigate("/edit-profile")}
                      className="hover:bg-gray-700 focus:bg-gray-700 text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.editProfile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/settings")}
                      className="hover:bg-gray-700 focus:bg-gray-700 text-white"
                    >
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      {t("nav.settings")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 hover:bg-gray-700 focus:bg-gray-700 hover:text-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/auth")}
                  className="text-white hover:text-accent hover:bg-gray-800 font-light transition-colors duration-300"
                >
                  {t("nav.login")}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:text-accent hover:bg-gray-800">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 bg-charcoal-900 border-gray-800">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-gray-800">
                      <h2 className="text-lg font-light text-white">{t("nav.appName")}</h2>
                      {user && (
                        <p className="text-sm text-gray-400">{user?.email}</p>
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 font-light ${
                                  location.pathname === item.href
                                    ? "bg-accent text-black"
                                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                                }`}
                              >
                                <span>{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        </nav>

                        <div className="p-4 border-t border-gray-800 space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800 hover:text-white font-light"
                            onClick={() => {
                              navigate("/edit-profile");
                              setIsOpen(false);
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            {t("nav.editProfile")}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800 hover:text-white font-light"
                            onClick={() => {
                              navigate("/settings");
                              setIsOpen(false);
                            }}
                          >
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            {t("nav.settings")}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent border-gray-700 text-red-400 hover:bg-gray-800 hover:text-red-300 font-light"
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
                          className="w-full bg-accent text-black hover:bg-accent/80 font-light"
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