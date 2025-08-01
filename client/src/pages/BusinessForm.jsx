import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, DollarSign, MapPin, Users, FileText } from 'lucide-react';

export default function BusinessSetupForm({ user }) {
  const [formData, setFormData] = useState({
    business_type: '',
    sector: '',
    legal_status: '',
    office_setup: false,
    investment: '',
    location: '',
    need_local_staff: false,
    support_needed: [],
    timeline: '',
    notes: '',
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();


  const supportOptions = [
    'businessForm.options.support.legal',
    'businessForm.options.support.tax',
    'businessForm.options.support.license',
    'businessForm.options.support.recruit'
  ];

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSupportChange = (option, checked) => {
    const newSupport = checked
      ? [...formData.support_needed, option]
      : formData.support_needed.filter((item) => item !== option);
    setFormData({ ...formData, support_needed: newSupport });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    if (!user) {
      setStatus(t('businessForm.status.auth'));
      setLoading(false);
      return;
    }

    const insertData = {
      ...formData,
      investment: formData.investment ? String(formData.investment) : null,
      support_needed: formData.support_needed.join(', '),
      user_id: user.id,
    };

    const { error } = await supabase.from('business_setup_forms').insert([insertData]);

    if (error) {
      setStatus(t('businessForm.status.fail') + error.message);
    } else {
      setStatus(t('businessForm.status.success'));
      // Reset form
      setFormData({
        business_type: '',
        sector: '',
        legal_status: '',
        office_setup: false,
        investment: '',
        location: '',
        need_local_staff: false,
        support_needed: [],
        timeline: '',
        notes: '',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('businessForm.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label>{t('businessForm.typeLabel')}</Label>
                    <Select value={formData.business_type} onValueChange={(value) => handleChange('business_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('businessForm.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sole Proprietorship">{t('businessForm.options.businessType.sole')}</SelectItem>
                        <SelectItem value="PLC">{t('businessForm.options.businessType.plc')}</SelectItem>
                        <SelectItem value="Branch">{t('businessForm.options.businessType.branch')}</SelectItem>
                        <SelectItem value="Partnership">{t('businessForm.options.businessType.partner')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <Label>{t('businessForm.sectorLabel')}</Label>
                    <Input
                      value={formData.sector}
                      onChange={(e) => handleChange('sector', e.target.value)}
                      placeholder={t('businessForm.sectorPlaceholder')}
                      required
                    />
                  </div>

                  {/* Legal Status */}
                  <div className="space-y-2">
                    <Label>{t('businessForm.legalStatusLabel')}</Label>
                    <Select value={formData.legal_status} onValueChange={(value) => handleChange('legal_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('businessForm.legalStatusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">{t('businessForm.options.legalStatus.new')}</SelectItem>
                        <SelectItem value="Expanding existing">{t('businessForm.options.legalStatus.expand')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Investment Amount */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {t('businessForm.investmentLabel')}
                    </Label>
                    <Input
                      value={formData.investment}
                      onChange={(e) => handleChange('investment', e.target.value)}
                      placeholder={t('businessForm.investmentPlaceholder')}
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('businessForm.locationLabel')}
                    </Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder={t('businessForm.locationPlaceholder')}
                      required
                    />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <Label>{t('businessForm.timelineLabel')}</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleChange('timeline', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('businessForm.timelinePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1–3 months">{t('businessForm.options.timeline.short')}</SelectItem>
                        <SelectItem value="3–6 months">{t('businessForm.options.timeline.medium')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">{t('businessForm.additionalRequirementsLabel')}</Label>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="office_setup"
                          checked={formData.office_setup}
                          onCheckedChange={(checked) => handleChange('office_setup', checked)}
                        />
                        <Label htmlFor="office_setup" className="text-sm">{t('businessForm.officeSetup')}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="need_local_staff"
                          checked={formData.need_local_staff}
                          onCheckedChange={(checked) => handleChange('need_local_staff', checked)}
                        />
                        <Label htmlFor="need_local_staff" className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {t('businessForm.localStaff')}
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Support Needed */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">{t('businessForm.supportLabel')}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {supportOptions.map((key) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={formData.support_needed.includes(t(key))}
                            onCheckedChange={(checked) => handleSupportChange(t(key), checked)}
                          />
                          <Label htmlFor={key} className="text-sm">{t(key)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('businessForm.notesLabel')}
                    </Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder={t('businessForm.notesPlaceholder')}
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? t('businessForm.submitting') : t('businessForm.submit')}
                  </Button>

                  {/* Status Message */}
                  {status && (
                    <Alert className={
                      status.includes('successfully')
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }>
                      <AlertDescription className={
                        status.includes('successfully')
                          ? 'text-green-800'
                          : 'text-red-800'
                      }>
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">

            {/* Business Types Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('businessForm.sidebar.typesTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">{t('businessForm.sidebar.sole.title')}</p>
                  <p>{t('businessForm.sidebar.sole.desc')}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('businessForm.sidebar.plc.title')}</p>
                  <p>{t('businessForm.sidebar.plc.desc')}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('businessForm.sidebar.branch.title')}</p>
                  <p>{t('businessForm.sidebar.branch.desc')}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('businessForm.sidebar.partner.title')}</p>
                  <p>{t('businessForm.sidebar.partner.desc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Investment Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('businessForm.sidebar.investmentTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>{t('businessForm.sidebar.invest.manufacturing')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.invest.service')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.invest.trading')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.invest.joint')}</strong></p>
                <p className="text-xs text-gray-500 mt-2">{t('businessForm.sidebar.invest.note')}</p>
              </CardContent>
            </Card>

            {/* Process Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t('businessForm.sidebar.timelineTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>{t('businessForm.sidebar.timeline.name')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.timeline.legal')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.timeline.license')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.timeline.tax')}</strong></p>
                <p>• <strong>{t('businessForm.sidebar.timeline.bank')}</strong></p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}