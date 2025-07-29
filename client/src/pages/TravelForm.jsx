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

    const { error } = await supabase.from('travel_forms').insert([insertData]);

    if (error) {
      setStatus(t("travelForm.status.failurePrefix") + error.message);
    } else {
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
    }
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  {t("travelForm.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Purpose */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.purposeLabel")}</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleChange('purpose', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("travelForm.purposePlaceholder")}/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visit">{t("travelForm.purposeOptions.visit")}</SelectItem>
                        <SelectItem value="Move">{t("travelForm.purposeOptions.move")}</SelectItem>
                        <SelectItem value="Vacation">{t("travelForm.purposeOptions.vacation")}</SelectItem>
                        <SelectItem value="Work">{t("travelForm.purposeOptions.work")}</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                  {/* City */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.cityLabel")}</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder={t("travelForm.cityPlaceholder")}
                      required
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.datesLabel")}</Label>
                    <Input
                      value={formData.dates}
                      onChange={(e) => handleChange('dates', e.target.value)}
                      placeholder={t("travelForm.datesPlaceholder")}
                      required
                    />
                  </div>

                  {/* Number of Travelers */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.numTravelersLabel")}</Label>
                    <Input
                      type="number"
                      value={formData.num_travelers}
                      onChange={(e) => handleChange('num_travelers', e.target.value)}
                      placeholder={t("travelForm.numTravelersPlaceholder")}
                      required
                      min="1"
                      max="20"
                    />
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.accommodationLabel")}</Label>
                    <Select value={formData.accommodation} onValueChange={(value) => handleChange('accommodation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("travelForm.accommodationPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hotel">{t("travelForm.accommodationOptions.hotel")}</SelectItem>
                        <SelectItem value="Guesthouse">{t("travelForm.accommodationOptions.guesthouse")}</SelectItem>
                        <SelectItem value="Long-Term">{t("travelForm.accommodationOptions.longTerm")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">{t("travelForm.additionalServicesLabel")}</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="airport_pickup"
                          checked={formData.airport_pickup}
                          onCheckedChange={(checked) => handleChange('airport_pickup', checked)}
                        />
                        <Label htmlFor="airport_pickup" className="text-sm">{t("travelForm.services.airportPickup")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="car_rental"
                          checked={formData.car_rental}
                          onCheckedChange={(checked) => handleChange('car_rental', checked)}
                        />
                        <Label htmlFor="car_rental" className="text-sm">{t("travelForm.services.carRental")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="document_support"
                          checked={formData.document_support}
                          onCheckedChange={(checked) => handleChange('document_support', checked)}
                        />
                        <Label htmlFor="document_support" className="text-sm">{t("travelForm.services.documentSupport")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="phone_banking_setup"
                          checked={formData.phone_banking_setup}
                          onCheckedChange={(checked) => handleChange('phone_banking_setup', checked)}
                        />
                        <Label htmlFor="phone_banking_setup" className="text-sm">{t("travelForm.services.phoneBanking")}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="city_orientation"
                          checked={formData.city_orientation}
                          onCheckedChange={(checked) => handleChange('city_orientation', checked)}
                        />
                        <Label htmlFor="city_orientation" className="text-sm">{t("travelForm.services.cityOrientation")}</Label>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label>{t("travelForm.additionalNotesLabel")}</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => handleChange('additional_notes', e.target.value)}
                      placeholder={t("travelForm.additionalNotesPlaceholder")}
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? t("travelForm.submitting") : t("travelForm.submitButton")}
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

          {/* Cost Estimator Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t("travelEstimator.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                {t("travelEstimator.subtitle")}
                </p>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                  {t("travelEstimator.warning")}
                  </AlertDescription>
                </Alert>

                <Button
                  type="button"
                  onClick={fetchEstimate}
                  disabled={loadingEstimate || !formData.accommodation || !formData.num_travelers || !formData.dates}
                  variant="outline"
                  className="w-full"
                >
                  {loadingEstimate ? t("travelEstimator.loading") : t("travelEstimator.button")}
                </Button>

                {estimate && !estimate.error && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">{t("travelEstimator.estimate.title")}</h4>
                    <p className="text-sm text-gray-700">
                      <strong>{t("travelEstimator.estimate.lowRange")}</strong> ${estimate.lowStart} - ${estimate.lowEnd} <br />
                      <strong>{t("travelEstimator.estimate.highRange")}</strong> ${estimate.highStart} - ${estimate.highEnd}
                    </p>

                    {estimate.notes && (
                      <>
                        <button
                          className="text-blue-600 mt-2 text-sm underline"
                          onClick={() => setDetailsVisible(!detailsVisible)}
                        >
                          {detailsVisible ? t("travelEstimator.estimate.hideBreakdown") : t("travelEstimator.estimate.showBreakdown")}
                        </button>
                        {detailsVisible && (
                          <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                            {estimate.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {estimate && estimate.error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {estimate.error}
                  </div>
                )}


                {!formData.accommodation || !formData.num_travelers || !formData.dates ? (
                  <Alert>
                    <AlertDescription className="text-sm">
                    {t("travelEstimator.estimate.missingFields")}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("travelInfo.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
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