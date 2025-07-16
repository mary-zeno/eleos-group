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

  const supportOptions = [
    'Legal registration',
    'Tax ID',
    'Licensing',
    'Recruitment'
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
      setStatus('You must be logged in to submit this form.');
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
      setStatus('Submission failed: ' + error.message);
    } else {
      setStatus('Submitted successfully!');
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Setup Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label>Type of Business</Label>
                    <Select value={formData.business_type} onValueChange={(value) => handleChange('business_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="PLC">PLC (Private Limited Company)</SelectItem>
                        <SelectItem value="Branch">Branch Office</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <Label>Sector/Industry</Label>
                    <Input
                      value={formData.sector}
                      onChange={(e) => handleChange('sector', e.target.value)}
                      placeholder="e.g. Technology, Manufacturing, Trading"
                      required
                    />
                  </div>

                  {/* Legal Status */}
                  <div className="space-y-2">
                    <Label>Legal Status</Label>
                    <Select value={formData.legal_status} onValueChange={(value) => handleChange('legal_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select legal status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New Business</SelectItem>
                        <SelectItem value="Expanding existing">Expanding Existing Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Investment Amount */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Estimated Investment (USD/ETB)
                    </Label>
                    <Input
                      value={formData.investment}
                      onChange={(e) => handleChange('investment', e.target.value)}
                      placeholder="e.g. $50,000 or 2,500,000 ETB"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Preferred Location
                    </Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="e.g. Addis Ababa, Bole area"
                      required
                    />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <Label>Timeline for Setup</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleChange('timeline', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1–3 months">1–3 months</SelectItem>
                        <SelectItem value="3–6 months">3–6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Additional Requirements</Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="office_setup"
                          checked={formData.office_setup}
                          onCheckedChange={(checked) => handleChange('office_setup', checked)}
                        />
                        <Label htmlFor="office_setup" className="text-sm">Need Office Setup</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="need_local_staff"
                          checked={formData.need_local_staff}
                          onCheckedChange={(checked) => handleChange('need_local_staff', checked)}
                        />
                        <Label htmlFor="need_local_staff" className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Need Local Staff Recruitment
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Support Needed */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Support Services Needed</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {supportOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={option}
                            checked={formData.support_needed.includes(option)}
                            onCheckedChange={(checked) => handleSupportChange(option, checked)}
                          />
                          <Label htmlFor={option} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Any specific requirements, questions, or additional information..."
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Submitting...' : 'Submit Business Setup Request'}
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
                  Business Types in Ethiopia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Sole Proprietorship</p>
                  <p>Simplest form, single owner, unlimited liability</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">PLC</p>
                  <p>Private Limited Company, limited liability, min 2 shareholders</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Branch Office</p>
                  <p>Extension of foreign company, same legal entity</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Partnership</p>
                  <p>2+ partners, shared ownership and liability</p>
                </div>
              </CardContent>
            </Card>

            {/* Investment Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Investment Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Manufacturing:</strong> Min $200,000</p>
                <p>• <strong>Service:</strong> Min $150,000</p>
                <p>• <strong>Trading:</strong> Min $50,000</p>
                <p>• <strong>Joint ventures:</strong> Lower minimums may apply</p>
                <p className="text-xs text-gray-500 mt-2">
                  *Requirements may vary based on sector and current regulations
                </p>
              </CardContent>
            </Card>

            {/* Process Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Typical Setup Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Name reservation:</strong> 1-2 weeks</p>
                <p>• <strong>Legal registration:</strong> 2-4 weeks</p>
                <p>• <strong>Licensing:</strong> 2-6 weeks</p>
                <p>• <strong>Tax registration:</strong> 1-2 weeks</p>
                <p>• <strong>Bank account:</strong> 1-2 weeks</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}