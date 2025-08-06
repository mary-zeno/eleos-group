import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { supabase } from '../supabaseClient';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Plane, MapPin, AlertTriangle } from 'lucide-react';

export default function TravelForm({ user }) {
  const [formData, setFormData] = useState({
    purpose: '',
    city: '',
    dates: '',
    num_travelers: '',
    airport_pickup: false,
    accommodation: '',
    car_rental: false,
    document_support: false,
    phone_banking_setup: false,
    city_orientation: false,
    additional_notes: '',
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState('');
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const { t } = useTranslation();


  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    if (!user) {
      setStatus(t("travelForm.status.loginRequired"));
      setLoading(false);
      return;
    }

    const insertData = {
      ...formData,
      num_travelers: formData.num_travelers ? Number(formData.num_travelers) : null,
      user_id: user.id,
    };

    // Insert into travel_forms table first
    const { data: travelFormData, error: travelFormError } = await supabase
      .from('travel_forms')
      .insert([insertData])
      .select('id')
      .single();

    if (travelFormError) {
      setStatus(t("travelForm.status.failurePrefix") + travelFormError.message);
      setLoading(false);
      return;
    }

    // Insert into invoices table with the generated travel_forms id
    const invoiceData = {
      user_id: user.id,
      service_type: 'Travel',
      service_uuid: travelFormData.id,
    };

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData]);

    if (invoiceError) {
      setStatus(t("travelForm.status.failurePrefix") + invoiceError.message);
      setLoading(false);
      return;
    }

    setStatus(t("travelForm.status.success"));
    // Reset form
    setFormData({
      purpose: '',
      city: '',
      dates: '',
      num_travelers: '',
      airport_pickup: false,
      accommodation: '',
      car_rental: false,
      document_support: false,
      phone_banking_setup: false,
      city_orientation: false,
      additional_notes: '',
    });
    setEstimate(''); // Clear estimate
    setLoading(false);
  };

  const fetchEstimate = async () => {
    if (!formData.accommodation || !formData.num_travelers || !formData.dates) {
      setEstimate({ error: t("travelEstimator.estimate.missingFields") });
      return;
    }

    const season = formData.dates.toLowerCase(); // pass full month or string

    setLoadingEstimate(true);
    setEstimate(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location || "Ethiopia", // Add location field to formData if not there
          accommodation: formData.accommodation,
          people: Number(formData.num_travelers),
          season: season
        }),
      });

      const data = await res.json();

      if (data.low_estimate_start && data.low_estimate_end && data.high_estimate_start && data.high_estimate_end) {
        setEstimate({
          lowStart: data.low_estimate_start,
          lowEnd: data.low_estimate_end,
          highStart: data.high_estimate_start,
          highEnd: data.high_estimate_end,
          notes: data.notes || "",
        });
      } else {
        setEstimate({ error: t("travelEstimator.estimate.error") });
      }
    } catch (err) {
      setEstimate({ error: t("travelEstimator.estimate.errorFetch") });
      console.error("Estimate fetch error:", err);
    }

    setLoadingEstimate(false);
  };


  return (
    <div className="min-h-screen bg-charcoal-950 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-charcoal-900 border-charcoal-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plane className="h-5 w-5" />
                  {t("travelForm.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Purpose */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.purposeLabel")}</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleChange('purpose', value)}>
                      <SelectTrigger className="bg-charcoal-800 border-charcoal-700 text-white">
                        <SelectValue placeholder={t("travelForm.purposePlaceholder")}/>
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal-800 border-charcoal-700">
                        <SelectItem value="Visit" className="text-white hover:bg-charcoal-700">{t("travelForm.purposeOptions.visit")}</SelectItem>
                        <SelectItem value="Move" className="text-white hover:bg-charcoal-700">{t("travelForm.purposeOptions.move")}</SelectItem>
                        <SelectItem value="Vacation" className="text-white hover:bg-charcoal-700">{t("travelForm.purposeOptions.vacation")}</SelectItem>
                        <SelectItem value="Work" className="text-white hover:bg-charcoal-700">{t("travelForm.purposeOptions.work")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* City */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.cityLabel")}</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder={t("travelForm.cityPlaceholder")}
                      required
                      className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.datesLabel")}</Label>
                    <Input
                      value={formData.dates}
                      onChange={(e) => handleChange('dates', e.target.value)}
                      placeholder={t("travelForm.datesPlaceholder")}
                      required
                      className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Number of Travelers */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.numTravelersLabel")}</Label>
                    <Input
                      type="number"
                      value={formData.num_travelers}
                      onChange={(e) => handleChange('num_travelers', e.target.value)}
                      placeholder={t("travelForm.numTravelersPlaceholder")}
                      required
                      min="1"
                      max="20"
                      className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.accommodationLabel")}</Label>
                    <Select value={formData.accommodation} onValueChange={(value) => handleChange('accommodation', value)}>
                      <SelectTrigger className="bg-charcoal-800 border-charcoal-700 text-white">
                        <SelectValue placeholder={t("travelForm.accommodationPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal-800 border-charcoal-700">
                        <SelectItem value="Hotel" className="text-white hover:bg-charcoal-700">{t("travelForm.accommodationOptions.hotel")}</SelectItem>
                        <SelectItem value="Guesthouse" className="text-white hover:bg-charcoal-700">{t("travelForm.accommodationOptions.guesthouse")}</SelectItem>
                        <SelectItem value="Long-Term" className="text-white hover:bg-charcoal-700">{t("travelForm.accommodationOptions.longTerm")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-gray-300">{t("travelForm.additionalServicesLabel")}</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="airport_pickup"
                          checked={formData.airport_pickup}
                          onCheckedChange={(checked) => handleChange('airport_pickup', checked)}
                          className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor="airport_pickup" className="text-sm text-gray-300">{t("travelForm.services.airportPickup")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="car_rental"
                          checked={formData.car_rental}
                          onCheckedChange={(checked) => handleChange('car_rental', checked)}
                          className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor="car_rental" className="text-sm text-gray-300">{t("travelForm.services.carRental")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="document_support"
                          checked={formData.document_support}
                          onCheckedChange={(checked) => handleChange('document_support', checked)}
                          className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor="document_support" className="text-sm text-gray-300">{t("travelForm.services.documentSupport")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="phone_banking_setup"
                          checked={formData.phone_banking_setup}
                          onCheckedChange={(checked) => handleChange('phone_banking_setup', checked)}
                          className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor="phone_banking_setup" className="text-sm text-gray-300">{t("travelForm.services.phoneBanking")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="city_orientation"
                          checked={formData.city_orientation}
                          onCheckedChange={(checked) => handleChange('city_orientation', checked)}
                          className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor="city_orientation" className="text-sm text-gray-300">{t("travelForm.services.cityOrientation")}</Label>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">{t("travelForm.additionalNotesLabel")}</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => handleChange('additional_notes', e.target.value)}
                      placeholder={t("travelForm.additionalNotesPlaceholder")}
                      rows={4}
                      className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-black font-medium">
                    {loading ? t("travelForm.submitting") : t("travelForm.submitButton")}
                  </Button>

                  {/* Status Message */}
                  {status && (
                    <Alert className={
                      status.includes('successfully')
                        ? 'border-green-700 bg-green-900/20'
                        : 'border-red-700 bg-red-900/20'
                    }>
                      <AlertDescription className={
                        status.includes('successfully')
                          ? 'text-green-400'
                          : 'text-red-400'
                      }>
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Cost Estimator Sidebar */}
          <div className="space-y-6">
            <Card className="bg-charcoal-900 border-charcoal-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calculator className="h-5 w-5" />
                  {t("travelEstimator.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                {t("travelEstimator.subtitle")}
                </p>

                <Alert className="border-amber-700 bg-amber-900/20">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-400 text-xs">
                  {t("travelEstimator.warning")}
                  </AlertDescription>
                </Alert>

                <Button
                  type="button"
                  onClick={fetchEstimate}
                  disabled={loadingEstimate || !formData.accommodation || !formData.num_travelers || !formData.dates}
                  variant="outline"
                  className="w-full bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700"
                >
                  {loadingEstimate ? t("travelEstimator.loading") : t("travelEstimator.button")}
                </Button>

                {estimate && !estimate.error && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <h4 className="font-medium mb-2 text-white">{t("travelEstimator.estimate.title")}</h4>
                    <p className="text-sm text-gray-300">
                      <strong>{t("travelEstimator.estimate.lowRange")}</strong> ${estimate.lowStart} - ${estimate.lowEnd} <br />
                      <strong>{t("travelEstimator.estimate.highRange")}</strong> ${estimate.highStart} - ${estimate.highEnd}
                    </p>

                    {estimate.notes && (
                      <>
                        <button
                          className="text-blue-400 mt-2 text-sm underline hover:text-blue-300"
                          onClick={() => setDetailsVisible(!detailsVisible)}
                        >
                          {detailsVisible ? t("travelEstimator.estimate.hideBreakdown") : t("travelEstimator.estimate.showBreakdown")}
                        </button>
                        {detailsVisible && (
                          <div className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
                            {estimate.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {estimate && estimate.error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-700 text-red-400 rounded-lg">
                    {estimate.error}
                  </div>
                )}


                {!formData.accommodation || !formData.num_travelers || !formData.dates ? (
                  <Alert className="border-charcoal-700 bg-charcoal-800/50">
                    <AlertDescription className="text-sm text-gray-400">
                    {t("travelEstimator.estimate.missingFields")}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-charcoal-900 border-charcoal-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5" />
                  {t("travelInfo.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-400">
                <p>• {t("travelInfo.visa")}</p>
                <p>• {t("travelInfo.season")}</p>
                <p>• {t("travelInfo.currency")}</p>
                <p>• {t("travelInfo.timezone")}</p>
                <p>•{t("travelInfo.airport")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
