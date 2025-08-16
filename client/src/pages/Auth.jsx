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

  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryResidence, setCountryResidence] = useState('');
  const [language, setLanguage] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState('');
  const [emergencyContactMember1, setEmergencyContactMember1] = useState('');
  const [emergencyContact1, setEmergencyContact1] = useState('');

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // when true, show the full profile fields 
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

  const handleGoogleLogin = async () => {
    setStatus('');
    setGoogleLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setStatus(t('auth.status.googleError') || 'Google login failed: ' + error.message);
      }
     
    } catch (err) {
      setStatus(t('auth.status.googleError') || 'Google login failed: ' + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickSignup = async () => {
    setStatus('');

    //  client-side validation
    if (!email.trim() || !password.trim() || !name.trim()) {
      setStatus(t('auth.status.signupError') + (t('auth.status.missingBasic') || ' Missing name/email/password.'));
      return;
    }

    setLoading(true);

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

    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        name: name.trim(),
        
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

   
    navigate('/dashboard');
  };

  const handleFullSignup = async () => {
    setStatus('');

    
    if (!email.trim() || !password.trim() || !name.trim()) {
      setStatus(t('auth.status.signupError') + (t('auth.status.missingBasic') || ' Missing name/email/password.'));
      return;
    }

    setLoading(true);

  
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
      
      setShowSignupFields(true);
    } else {
      
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
         
          <Button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            variant="outline"
            className="w-full border-charcoal-600 text-white hover:bg-charcoal-800 hover:text-white flex items-center gap-2"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {googleLoading 
              ? (t('auth.googleSigning') || 'Signing in...') 
              : "Sign in with Google"
            }
          </Button>

          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-charcoal-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-charcoal-900 px-2 text-gray-400">
                {t('auth.or') || 'Or continue with email'}
              </span>
            </div>
          </div>

          
          <Input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || googleLoading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />
          <Input
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || googleLoading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />
          <Input
            type="text"
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || googleLoading}
            className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
          />

          
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
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.countryPlaceholder') || 'Country of Residence (optional)'}
                  value={countryResidence}
                  onChange={(e) => setCountryResidence(e.target.value)}
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.languagePlaceholder') || 'Preferred Language (optional)'}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.communicationPlaceholder') || 'Communication Preference (optional)'}
                  value={communicationPreference}
                  onChange={(e) => setCommunicationPreference(e.target.value)}
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  placeholder={t('auth.emergencyNamePlaceholder') || 'Emergency Contact Name (optional)'}
                  value={emergencyContactMember1}
                  onChange={(e) => setEmergencyContactMember1(e.target.value)}
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <Input
                  type="tel"
                  placeholder={t('auth.emergencyPhonePlaceholder') || 'Emergency Contact Phone (optional)'}
                  value={emergencyContact1}
                  onChange={(e) => setEmergencyContact1(e.target.value)}
                  disabled={loading || googleLoading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleLogin}
              disabled={loading || googleLoading}
              variant="default"
              className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {t('auth.login')}
            </Button>
            <Button
              onClick={handleSignupClick}
              disabled={loading || googleLoading}
              variant="outline"
              className="flex-1 border-charcoal-600 text-white hover:bg-charcoal-800 hover:text-white"
            >
              {!showSignupFields ? (t('auth.signup')) : (t('auth.completeProfile') || 'Complete Profile')}
            </Button>
          </div>

          {/* Quick signup option */}
          {showSignupFields && (
            <Button
              onClick={handleQuickSignup}
              disabled={loading || googleLoading}
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