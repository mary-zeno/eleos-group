import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertCircle, Phone, Globe, MessageSquare, UserCheck } from 'lucide-react';

export default function EditProfile({ user }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryResidence, setCountryResidence] = useState('');
  const [language, setLanguage] = useState('');
  const [emergencyContactMember1, setEmergencyContactMember1] = useState('');
  const [emergencyContact1, setEmergencyContact1] = useState('');
  const [communicationReference, setCommunicationReference] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          name, 
          phone_number, 
          country_residence, 
          language, 
          emergency_contact_member1, 
          emergency_contact1, 
          communication_reference
        `)
        .eq('id', user.id)
        .single();

      if (data) {
        setName(data.name || '');
        setPhoneNumber(data.phone_number || '');
        setCountryResidence(data.country_residence || '');
        setLanguage(data.language || '');
        setEmergencyContactMember1(data.emergency_contact_member1 || '');
        setEmergencyContact1(data.emergency_contact1 || '');
        setCommunicationReference(data.communication_reference || '');
      }
      if (error) console.error('Failed to fetch profile:', error.message);
    };

    fetchProfile();
  }, [user]);

  const handleUpdate = async () => {
    if (!user?.id) {
      setStatus(t('editProfile.status.userNotFound'));
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      // Update auth info (email/password)
      const updates = {};
      if (email !== user.email && email.trim()) updates.email = email.trim();
      if (password.trim()) updates.password = password.trim();

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) {
          setStatus(t('editProfile.status.authUpdateError') + authError.message)
          setLoading(false);
          return;
        }
      }

      // Update profile information in profiles table
      const profileUpdates = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
        country_residence: countryResidence.trim() || null,
        language: language.trim() || null,
        emergency_contact_member1: emergencyContactMember1.trim() || null,
        emergency_contact1: emergencyContact1.trim() || null,
        communication_reference: communicationReference.trim() || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        setStatus(t('editProfile.status.profileUpdateError') + profileError.message)
        setLoading(false);
        return;
      }

      setStatus(t('editProfile.status.profileUpdateSuccess'));
      setPassword(''); // Clear password field after successful update
    } catch (error) {
      setStatus(t('editProfile.status.unexpectedError') + error.message)
    }

    setLoading(false);
  };

  const isFormValid = name.trim() && email.trim();

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-charcoal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editProfile.back')}
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              {t('editProfile.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">{t('editProfile.sections.basicInfo')}</h3>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-300">
                  <Mail className="h-4 w-4" />
                  {t('editProfile.emailLabel')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('editProfile.emailPlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-400">
                  {t('editProfile.emailNote')}
                </p>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-300">
                  <User className="h-4 w-4" />
                  {t('editProfile.nameLabel')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('editProfile.namePlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-gray-300">
                  <Lock className="h-4 w-4" />
                  {t('editProfile.passwordLabel')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('editProfile.passwordPlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-400">
                  {t('editProfile.passwordNote')}
                </p>
              </div>
            </div>

            <Separator className="bg-charcoal-700" />

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">{t('editProfile.sections.contactInfo')}</h3>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4" />
                  {t('editProfile.phoneLabel')}
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('editProfile.phonePlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Country of Residence */}
              <div className="space-y-2">
                <Label htmlFor="countryResidence" className="flex items-center gap-2 text-gray-300">
                  <Globe className="h-4 w-4" />
                  {t('editProfile.countryLabel')}
                </Label>
                <Input
                  id="countryResidence"
                  type="text"
                  value={countryResidence}
                  onChange={(e) => setCountryResidence(e.target.value)}
                  placeholder={t('editProfile.countryPlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2 text-gray-300">
                  <MessageSquare className="h-4 w-4" />
                  {t('editProfile.languageLabel')}
                </Label>
                <Input
                  id="language"
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder={t('editProfile.languagePlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Communication Preference */}
              <div className="space-y-2">
                <Label htmlFor="communicationPreference" className="flex items-center gap-2 text-gray-300">
                  <Mail className="h-4 w-4" />
                  {t('dashboard.profile.communicationPreference')}
                </Label>
                <Input
                  id="communicationPreference"
                  type="text"
                  value={communicationReference} 
                  onChange={(e) => setCommunicationReference(e.target.value)} 
                  placeholder={t('editProfile.communicationPlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />

              </div>
            </div>

            <Separator className="bg-charcoal-700" />

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">{t('editProfile.sections.emergencyContact')}</h3>

              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContactMember1" className="flex items-center gap-2 text-gray-300">
                  <UserCheck className="h-4 w-4" />
                  {t('editProfile.emergencyNameLabel')}
                </Label>
                <Input
                  id="emergencyContactMember1"
                  type="text"
                  value={emergencyContactMember1}
                  onChange={(e) => setEmergencyContactMember1(e.target.value)}
                  placeholder={t('editProfile.emergencyNamePlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContact1" className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4" />
                  {t('editProfile.emergencyPhoneLabel')}
                </Label>
                <Input
                  id="emergencyContact1"
                  type="tel"
                  value={emergencyContact1}
                  onChange={(e) => setEmergencyContact1(e.target.value)}
                  placeholder={t('editProfile.emergencyPhonePlaceholder')}
                  disabled={loading}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Status Message */}
            {status && (
              <Alert className={
                status.includes('successfully')
                  ? 'border-green-700 bg-green-900/20'
                  : 'border-red-700 bg-red-900/20'
              }>
                {status.includes('successfully') ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={
                  status.includes('successfully')
                    ? 'text-green-400'
                    : 'text-red-400'
                }>
                  {status}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={loading || !isFormValid}
                className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium"
              >
                {loading ? t('editProfile.saving') : t('editProfile.save')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700"
              >
                {t('editProfile.cancel')}
              </Button>
            </div>

            {/* User Info Display */}
            <div className="pt-4 border-t border-charcoal-700">
              <h3 className="text-sm font-medium text-white mb-2">{t('editProfile.currentInfo')}</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p><strong className="text-gray-300">{t('editProfile.created')}</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('common.na')}</p>
                <p><strong className="text-gray-300">{t('editProfile.emailVerified')}</strong> {user?.email_confirmed_at ? t('common.yes') : t('common.no')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}