import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function PropertyForm({ user }) {
  const [formData, setFormData] = useState({
    property_type: '',
    purpose: '',
    location_preferences: '',
    budget: '',
    financing_needs: false,
    financing_details: '',
    timeline: '',
    existing_property: false,
    existing_property_location: '',
    additional_requests: '',
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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
      budget: formData.budget ? Number(formData.budget) : null,
      user_id: user.id,
    };

    const { error } = await supabase.from('property_interest_forms').insert([insertData]);

    if (error) {
      setStatus('Submission failed: ' + error.message);
    } else {
      setStatus('Submitted successfully!');
      // Reset form
      setFormData({
        property_type: '',
        purpose: '',
        location_preferences: '',
        budget: '',
        financing_needs: false,
        financing_details: '',
        timeline: '',
        existing_property: false,
        existing_property_location: '',
        additional_requests: '',
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Property Interest Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Property Type */}
            <div className="space-y-2">
              <Label>Type of Property</Label>
              <Select value={formData.property_type} onValueChange={(value) => handleChange('property_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Land">Land</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={formData.purpose} onValueChange={(value) => handleChange('purpose', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Manage Existing">Manage Existing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location Preferences</Label>
              <Input
                value={formData.location_preferences}
                onChange={(e) => handleChange('location_preferences', e.target.value)}
                placeholder="e.g. Addis Ababa, Bole area"
                required
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label>Budget (USD)</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
                placeholder="Enter your budget"
                required
                min="0"
              />
            </div>

            {/* Financing Needs */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="financing"
                checked={formData.financing_needs}
                onCheckedChange={(checked) => handleChange('financing_needs', checked)}
              />
              <Label htmlFor="financing">Do you need financing?</Label>
            </div>

            {/* Financing Details (conditional) */}
            {formData.financing_needs && (
              <div className="space-y-2">
                <Label>Bank or Support Request</Label>
                <Input
                  value={formData.financing_details}
                  onChange={(e) => handleChange('financing_details', e.target.value)}
                  placeholder="Describe your financing needs"
                />
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Select value={formData.timeline} onValueChange={(value) => handleChange('timeline', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate</SelectItem>
                  <SelectItem value="1–3 months">1–3 months</SelectItem>
                  <SelectItem value="6+ months">6+ months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Existing Property */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="existing"
                checked={formData.existing_property}
                onCheckedChange={(checked) => handleChange('existing_property', checked)}
              />
              <Label htmlFor="existing">Do you have an existing property to manage?</Label>
            </div>

            {/* Existing Property Location (conditional) */}
            {formData.existing_property && (
              <div className="space-y-2">
                <Label>Existing Property Location</Label>
                <Input
                  value={formData.existing_property_location}
                  onChange={(e) => handleChange('existing_property_location', e.target.value)}
                  placeholder="Location of existing property"
                />
              </div>
            )}

            {/* Additional Requests */}
            <div className="space-y-2">
              <Label>Additional Requests / Comments</Label>
              <Textarea
                value={formData.additional_requests}
                onChange={(e) => handleChange('additional_requests', e.target.value)}
                placeholder="Any additional information or special requests"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Property Interest'}
            </Button>

            {/* Status Message */}
            {status && (
              <div className={`text-sm font-medium ${
                status.includes('failed') || status.includes('error')
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {status}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}