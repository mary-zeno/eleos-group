import { useState } from 'react';
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


  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    if (!user) {
      setStatus('You must be logged in to submit this form.');
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
      setStatus('Submission failed: ' + error.message);
    } else {
      setStatus('Submitted successfully!');
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
    setEstimate({ error: "Please fill in accommodation, number of travelers, and dates to get an estimate." });
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
      setEstimate({ error: "Could not parse estimate." });
    }
  } catch (err) {
    setEstimate({ error: "Error contacting the travel estimator." });
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
                  Travel & Relocation Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Purpose */}
                  <div className="space-y-2">
                    <Label>Purpose of Travel</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleChange('purpose', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visit">Visit</SelectItem>
                        <SelectItem value="Move">Move</SelectItem>
                        <SelectItem value="Vacation">Vacation</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* City */}
                  <div className="space-y-2">
                    <Label>Specific City or Region in Ethiopia</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g. Addis Ababa, Lalibela"
                      required
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <Label>Dates of Travel</Label>
                    <Input
                      value={formData.dates}
                      onChange={(e) => handleChange('dates', e.target.value)}
                      placeholder="e.g. July 10 - July 20, 2024"
                      required
                    />
                  </div>

                  {/* Number of Travelers */}
                  <div className="space-y-2">
                    <Label>Number of Travelers</Label>
                    <Input
                      type="number"
                      value={formData.num_travelers}
                      onChange={(e) => handleChange('num_travelers', e.target.value)}
                      placeholder="1"
                      required
                      min="1"
                      max="20"
                    />
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-2">
                    <Label>Accommodation Needed</Label>
                    <Select value={formData.accommodation} onValueChange={(value) => handleChange('accommodation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select accommodation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hotel">Hotel</SelectItem>
                        <SelectItem value="Guesthouse">Guesthouse</SelectItem>
                        <SelectItem value="Long-Term">Long-Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Additional Services</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="airport_pickup"
                          checked={formData.airport_pickup}
                          onCheckedChange={(checked) => handleChange('airport_pickup', checked)}
                        />
                        <Label htmlFor="airport_pickup" className="text-sm">Airport Pickup</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="car_rental"
                          checked={formData.car_rental}
                          onCheckedChange={(checked) => handleChange('car_rental', checked)}
                        />
                        <Label htmlFor="car_rental" className="text-sm">Car Rental</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="document_support"
                          checked={formData.document_support}
                          onCheckedChange={(checked) => handleChange('document_support', checked)}
                        />
                        <Label htmlFor="document_support" className="text-sm">Document Support (Visa, ID, etc.)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="phone_banking_setup"
                          checked={formData.phone_banking_setup}
                          onCheckedChange={(checked) => handleChange('phone_banking_setup', checked)}
                        />
                        <Label htmlFor="phone_banking_setup" className="text-sm">Phone & Banking Setup</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="city_orientation"
                          checked={formData.city_orientation}
                          onCheckedChange={(checked) => handleChange('city_orientation', checked)}
                        />
                        <Label htmlFor="city_orientation" className="text-sm">City Orientation Needed</Label>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label>Additional Services or Notes</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => handleChange('additional_notes', e.target.value)}
                      placeholder="Any special requirements or additional information..."
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Submitting...' : 'Submit Travel Request'}
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
                  Travel Cost Estimator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Get an AI-powered cost estimate for your travel needs.
                </p>
                
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Requires travel estimation service running on 127.0.0.1.8000
                  </AlertDescription>
                </Alert>
                
                <Button 
                  type="button" 
                  onClick={fetchEstimate}
                  disabled={loadingEstimate || !formData.accommodation || !formData.num_travelers || !formData.dates}
                  variant="outline"
                  className="w-full"
                >
                  {loadingEstimate ? 'Getting Estimate...' : 'Get Travel Estimate'}
                </Button>

                {estimate && !estimate.error && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Travel Cost Estimate</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Low Estimate Range:</strong> ${estimate.lowStart} - ${estimate.lowEnd} <br />
                      <strong>High Estimate Range:</strong> ${estimate.highStart} - ${estimate.highEnd}
                    </p>

                    {estimate.notes && (
                      <>
                        <button
                          className="text-blue-600 mt-2 text-sm underline"
                          onClick={() => setDetailsVisible(!detailsVisible)}
                        >
                          {detailsVisible ? "Hide Breakdown" : "Show Cost Breakdown"}
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
                      Please fill in accommodation type, number of travelers, and dates to get an estimate.
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
                  Ethiopia Travel Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Visa required for most travelers</p>
                <p>• Best time to visit: October to March</p>
                <p>• Local currency: Ethiopian Birr (ETB)</p>
                <p>• Time zone: EAT (UTC+3)</p>
                <p>• Major airports: ADD (Addis Ababa)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}