import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


export default function PropertyForm({ user }) {
  const [formData, setFormData] = useState({
    property_type: "",
    purpose: "",
    location_preferences: "",
    budget: "",
    financing_needs: false,
    financing_details: "",
    timeline: "",
    existing_property: false,
    existing_property_location: "",
    additional_requests: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const { t } = useTranslation();

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!user) {
      setStatus(t("propertyform.status.notLoggedIn"));
      setLoading(false);
      return;
    }

    const insertData = {
      ...formData,
      budget: formData.budget ? Number(formData.budget) : null,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("property_interest_forms")
      .insert([insertData]);

    if (error) {
      setStatus(t("propertyform.status.error") + error.message);
    } else {
      setStatus(t("propertyform.status.success"));
      setFormData({
        property_type: "",
        purpose: "",
        location_preferences: "",
        budget: "",
        financing_needs: false,
        financing_details: "",
        timeline: "",
        existing_property: false,
        existing_property_location: "",
        additional_requests: "",
      });
      fetchProperties();
    }
    setLoading(false);
  };

  const fetchProperties = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error.message);
    } else {
      setProperties(data);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  return (
    // CHANGED: Main background from bg-gray-100 to bg-charcoal-950
    <div className="min-h-screen bg-charcoal-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        {/* CHANGED: Added dark styling to Card - bg-charcoal-900 border-charcoal-800 */}
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            {/* CHANGED: Added text-white to title */}
            <CardTitle className="text-white">{t("propertyform.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Type */}
              <div className="space-y-2">
                {/* CHANGED: Added text-gray-300 to labels throughout */}
                <Label className="text-gray-300">{t("propertyform.fields.propertyType")}</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleChange("property_type", value)}
                >
                  {/* CHANGED: Added dark styling to Select trigger */}
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-700 text-white">
                    <SelectValue placeholder={t("propertyform.fields.propertyTypePlaceholder")} />
                  </SelectTrigger>
                  {/* CHANGED: Added dark styling to Select content */}
                  <SelectContent className="bg-charcoal-800 border-charcoal-700">
                    <SelectItem value="Land" className="text-white hover:bg-charcoal-700">{t("propertyform.options.propertyTypes.land")}</SelectItem>
                    <SelectItem value="House" className="text-white hover:bg-charcoal-700">{t("propertyform.options.propertyTypes.house")}</SelectItem>
                    <SelectItem value="Apartment" className="text-white hover:bg-charcoal-700">{t("propertyform.options.propertyTypes.apartment")}</SelectItem>
                    <SelectItem value="Commercial" className="text-white hover:bg-charcoal-700">{t("propertyform.options.propertyTypes.commercial")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t("propertyform.fields.purpose")}</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => handleChange("purpose", value)}
                >
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-700 text-white">
                    <SelectValue placeholder={t("propertyform.fields.purposePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-800 border-charcoal-700">
                    <SelectItem value="Buy" className="text-white hover:bg-charcoal-700">{t("propertyform.options.purposes.buy")}</SelectItem>
                    <SelectItem value="Rent" className="text-white hover:bg-charcoal-700">{t("propertyform.options.purposes.rent")}</SelectItem>
                    <SelectItem value="Manage Existing" className="text-white hover:bg-charcoal-700">{t("propertyform.options.purposes.manage")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t("propertyform.fields.location")}</Label>
                {/* CHANGED: Added dark styling to Input fields */}
                <Input
                  value={formData.location_preferences}
                  onChange={(e) =>
                    handleChange("location_preferences", e.target.value)
                  }
                  placeholder={t("propertyform.fields.locationPlaceholder")}
                  required
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t("propertyform.fields.budget")}</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleChange("budget", e.target.value)}
                  placeholder={t("propertyform.fields.budgetPlaceholder")}
                  required
                  min="0"
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Financing Needs */}
              <div className="flex items-center space-x-2">
                {/* CHANGED: Added styling to Checkbox for dark theme compatibility */}
                <Checkbox
                  id="financing"
                  checked={formData.financing_needs}
                  onCheckedChange={(checked) =>
                    handleChange("financing_needs", checked)
                  }
                  className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <Label htmlFor="financing" className="text-gray-300">{t("propertyform.fields.financing")}</Label>
              </div>

              {/* Financing Details */}
              {formData.financing_needs && (
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("propertyform.fields.financingDetails")}</Label>
                  <Input
                    value={formData.financing_details}
                    onChange={(e) =>
                      handleChange("financing_details", e.target.value)
                    }
                    placeholder={t("propertyform.fields.financingDetailsPlaceholder")}
                    className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t("propertyform.fields.timeline")}</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => handleChange("timeline", value)}
                >
                  <SelectTrigger className="bg-charcoal-800 border-charcoal-700 text-white">
                    <SelectValue placeholder={t("propertyform.fields.timelinePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-800 border-charcoal-700">
                    <SelectItem value="Immediate" className="text-white hover:bg-charcoal-700">{t("propertyform.options.timelines.immediate")}</SelectItem>
                    <SelectItem value="1–3 months" className="text-white hover:bg-charcoal-700">{t("propertyform.options.timelines.short")}</SelectItem>
                    <SelectItem value="6+ months" className="text-white hover:bg-charcoal-700">{t("propertyform.options.timelines.long")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Existing Property */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="existing"
                  checked={formData.existing_property}
                  onCheckedChange={(checked) =>
                    handleChange("existing_property", checked)
                  }
                  className="border-charcoal-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <Label htmlFor="existing" className="text-gray-300">
                  {t("propertyform.fields.existingProperty")}
                </Label>
              </div>

              {/* Existing Property Location */}
              {formData.existing_property && (
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("propertyform.fields.existingPropertyLocation")}</Label>
                  <Input
                    value={formData.existing_property_location}
                    onChange={(e) =>
                      handleChange("existing_property_location", e.target.value)
                    }
                    placeholder={t("propertyform.fields.existingPropertyLocationPlaceholder")}
                    className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Additional Requests */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t("propertyform.fields.additionalRequests")}</Label>
                {/* CHANGED: Added dark styling to Textarea */}
                <Textarea
                  value={formData.additional_requests}
                  onChange={(e) =>
                    handleChange("additional_requests", e.target.value)
                  }
                  placeholder={t("propertyform.fields.additionalRequestsPlaceholder")}
                  rows={4}
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Submit Button */}
              {/* CHANGED: Added accent color styling to submit button */}
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-black font-medium">
                {loading ? t("propertyform.buttons.submitting") : t("propertyform.buttons.submit")}
              </Button>

              {/* CHANGED: Updated status message colors for dark theme */}
              {status && (
                <div
                  className={`text-sm font-medium ${status.includes(t("propertyform.status.error")) ||
                    status.includes("error") ||
                    status.includes("failed")
                    ? "text-red-400"  // Changed from text-red-600 to text-red-400 for better contrast on dark background
                    : "text-green-400"  // Changed from text-green-600 to text-green-400 for better contrast on dark background
                    }`}
                >
                  {status}
                </div>
              )}

            </form>
          </CardContent>
        </Card>

        {/* Right: Properties Display */}
        <div className="space-y-4">
          {/* CHANGED: Added text-white to section heading */}
          <h2 className="text-xl font-semibold text-white">{t("propertyform.yourProperties")}</h2>
          {properties.length === 0 ? (
            // CHANGED: Changed text color from text-gray-600 to text-gray-400 for better contrast
            <p className="text-gray-400">{t("propertyform.noProperties")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((prop) => (
                // CHANGED: Added dark styling to property cards
                <Card key={prop.id} className="bg-charcoal-900 border-charcoal-800">
                  <CardContent className="p-4">
                    {prop.image_url && (
                      <img
                        src={prop.image_url}
                        alt={prop.name}
                        className="w-full h-40 object-cover rounded-md mb-3"
                      />
                    )}
                    {/* CHANGED: Added text-white to property name */}
                    <h4 className="text-lg font-semibold text-white">{prop.name}</h4>
                    {/* CHANGED: Changed text color from text-gray-700 to text-gray-300 */}
                    <p className="text-sm text-gray-300">{prop.address}</p>
                    {/* CHANGED: Changed text color to text-gray-300 for property details */}
                    <p className="text-sm text-gray-300">{t("propertyform.propertyCard.price")}: ${prop.price}</p>
                    <p className="text-sm text-gray-300">
                      {t("propertyform.propertyCard.bedrooms")}: {prop.bedrooms} |{" "}
                      {t("propertyform.propertyCard.bathrooms")}: {prop.bathrooms}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}