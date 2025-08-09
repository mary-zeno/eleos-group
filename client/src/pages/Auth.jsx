import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Auth() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // extra profile fields for signup
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryResidence, setCountryResidence] = useState('');
  const [language, setLanguage] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState('');
  const [emergencyContactMember1, setEmergencyContactMember1] = useState('');
  const [emergencyContact1, setEmergencyContact1] = useState('');

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // when true, show the full profile fields (2nd step of signup)
  const [showSignupFields, setShowSignupFields] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async () => {
    setStatus('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) {
      setStatus(t('auth.status.loginError') + error.message);
    } else {
      setStatus(t('auth.status.loginSuccess'));
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleQuickSignup = async () => {
    setStatus('');

    // basic client-side validation
    if (!email.trim() || !password.trim() || !name.trim()) {
      setStatus(t('auth.status.signupError') + (t('auth.status.missingBasic') || ' Missing name/email/password.'));
      return;
    }

    setLoading(true);

    // 1) create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setStatus(t('auth.status.signupError') + error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setStatus(t('auth.status.signupError') + (t('auth.status.noUser') || ' Could not create user.'));
      setLoading(false);
      return;
    }

    // 2) insert basic profile row (only required fields)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        name: name.trim(),
        // Optional fields are left as null - user can fill them later
        phone_number: null,
        country_residence: null,
        language: null,
        communication_reference: null,
        emergency_contact_member1: null,
        emergency_contact1: null,
      }]);

    if (insertError) {
      setStatus(t('auth.status.profileError') + insertError.message);
      setLoading(false);
      return;
    }

    setStatus(t('auth.status.signupSuccess'));
    setLoading(false);

    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleFullSignup = async () => {
    setStatus('');

    // basic client-side validation
    if (!email.trim() || !password.trim() || !name.trim()) {
      setStatus(t('auth.status.signupError') + (t('auth.status.missingBasic') || ' Missing name/email/password.'));
      return;
    }

    setLoading(true);

    // 1) create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setStatus(t('auth.status.signupError') + error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setStatus(t('auth.status.signupError') + (t('auth.status.noUser') || ' Could not create user.'));
      setLoading(false);
      return;
    }

    // 2) insert complete profile row with all provided information
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
        country_residence: countryResidence.trim() || null,
        language: language.trim() || null,
        communication_reference: communicationPreference.trim() || null,
        emergency_contact_member1: emergencyContactMember1.trim() || null,
        emergency_contact1: emergencyContact1.trim() || null,
      }]);

    if (insertError) {
      setStatus(t('auth.status.profileError') + insertError.message);
      setLoading(false);
      return;
    }

    setStatus(t('auth.status.signupSuccess'));
    setLoading(false);

    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleSignupClick = () => {
    if (!showSignupFields) {
      // first click: reveal profile fields
      setShowSignupFields(true);
    } else {
      // second click: complete signup with full profile
      handleFullSignup();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-950 p-4">
      <Card className="w-full max-w-md bg-charcoal-900 border-charcoal-800">
        <CardHeader>
          <CardTitle className="text-white">{t('auth.welcome')}</CardTitle>
          <CardDescription className="text-gray-300">{t('auth.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic fields (always visible) */}
          <Input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />
          <Input
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />
          <Input
            type="text"
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />

          {/* Signup-only fields (step 2) - Optional */}
          {showSignupFields && (
            <div className="space-y-3 pt-2 border-t border-charcoal-800">
              <div className="text-sm text-gray-400 mb-3">
                {t('auth.optionalInfo') || 'Optional: Complete your profile (you can skip this and add it later)'}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  type="tel"
                  placeholder={t('auth.phonePlaceholder') || 'Phone Number (optional)'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.countryPlaceholder') || 'Country of Residence (optional)'}
                  value={countryResidence}
                  onChange={(e) => setCountryResidence(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.languagePlaceholder') || 'Preferred Language (optional)'}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.communicationPlaceholder') || 'Communication Preference (optional)'}
                  value={communicationPreference}
                  onChange={(e) => setCommunicationPreference(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.emergencyNamePlaceholder') || 'Emergency Contact Name (optional)'}
                  value={emergencyContactMember1}
                  onChange={(e) => setEmergencyContactMember1(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="tel"
                  placeholder={t('auth.emergencyPhonePlaceholder') || 'Emergency Contact Phone (optional)'}
                  value={emergencyContact1}
                  onChange={(e) => setEmergencyContact1(e.target.value)}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleLogin}
              disabled={loading}
              variant="default"
              className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium"
            >
              {t('auth.login')}
            </Button>
            <Button
              onClick={handleSignupClick}
              disabled={loading}
              variant="outline"
              className="flex-1 border-charcoal-600 text-white hover:bg-charcoal-800 hover:text-white"
            >
              {!showSignupFields ? (t('auth.signup')) : (t('auth.completeProfile') || 'Complete Profile')}
            </Button>
          </div>

          {/* Quick signup option when extended form is visible */}
          {showSignupFields && (
            <Button
              onClick={handleQuickSignup}
              disabled={loading}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-charcoal-800"
            >
              {t('auth.skipProfile') || 'Skip for now - Create account with basic info'}
            </Button>
          )}

          {status && (
            <div
              className={`text-sm font-medium ${
                status.toLowerCase().includes('error') ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}