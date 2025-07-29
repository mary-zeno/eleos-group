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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t("propertyform.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Type */}
              <div className="space-y-2">
                <Label>{t("propertyform.fields.propertyType")}</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleChange("property_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("propertyform.fields.propertyTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Land">{t("propertyform.options.propertyTypes.land")}</SelectItem>
                    <SelectItem value="House">{t("propertyform.options.propertyTypes.house")}</SelectItem>
                    <SelectItem value="Apartment">{t("propertyform.options.propertyTypes.apartment")}</SelectItem>
                    <SelectItem value="Commercial">{t("propertyform.options.propertyTypes.commercial")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label>{t("propertyform.fields.purpose")}</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => handleChange("purpose", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("propertyform.fields.purposePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">{t("propertyform.options.purposes.buy")}</SelectItem>
                    <SelectItem value="Rent">{t("propertyform.options.purposes.rent")}</SelectItem>
                    <SelectItem value="Manage Existing">{t("propertyform.options.purposes.manage")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>{t("propertyform.fields.location")}</Label>
                <Input
                  value={formData.location_preferences}
                  onChange={(e) =>
                    handleChange("location_preferences", e.target.value)
                  }
                  placeholder={t("propertyform.fields.locationPlaceholder")}
                  required
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label><Label>{t("propertyform.fields.budget")}</Label></Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleChange("budget", e.target.value)}
                  placeholder={t("propertyform.fields.budgetPlaceholder")}
                  required
                  min="0"
                />
              </div>

              {/* Financing Needs */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financing"
                  checked={formData.financing_needs}
                  onCheckedChange={(checked) =>
                    handleChange("financing_needs", checked)
                  }
                />
                <Label htmlFor="financing">{t("propertyform.fields.financing")}</Label>
              </div>

              {/* Financing Details */}
              {formData.financing_needs && (
                <div className="space-y-2">
                  <Label>{t("propertyform.fields.financingDetails")}</Label>
                  <Input
                    value={formData.financing_details}
                    onChange={(e) =>
                      handleChange("financing_details", e.target.value)
                    }
                    placeholder={t("propertyform.fields.financingDetailsPlaceholder")}
                  />
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-2">
                <Label>{t("propertyform.fields.timeline")}</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => handleChange("timeline", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("propertyform.fields.timelinePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">{t("propertyform.options.timelines.immediate")}</SelectItem>
                    <SelectItem value="1–3 months">{t("propertyform.options.timelines.short")}</SelectItem>
                    <SelectItem value="6+ months">{t("propertyform.options.timelines.long")}</SelectItem>
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
                />
                <Label htmlFor="existing">
                  {t("propertyform.fields.existingProperty")}
                </Label>
              </div>

              {/* Existing Property Location */}
              {formData.existing_property && (
                <div className="space-y-2">
                  <Label>{t("propertyform.fields.existingPropertyLocation")}</Label>
                  <Input
                    value={formData.existing_property_location}
                    onChange={(e) =>
                      handleChange("existing_property_location", e.target.value)
                    }
                    placeholder={t("propertyform.fields.existingPropertyLocationPlaceholder")}
                  />
                </div>
              )}

              {/* Additional Requests */}
              <div className="space-y-2">
                <Label>{t("propertyform.fields.additionalRequests")}</Label>
                <Textarea
                  value={formData.additional_requests}
                  onChange={(e) =>
                    handleChange("additional_requests", e.target.value)
                  }
                  placeholder={t("propertyform.fields.additionalRequestsPlaceholder")}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("propertyform.buttons.submitting") : t("propertyform.buttons.submit")}
              </Button>

              {status && (
                <div
                  className={`text-sm font-medium ${status.includes(t("propertyform.status.error")) ||
                    status.includes("error") ||
                    status.includes("failed")
                    ? "text-red-600"
                    : "text-green-600"
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
          <h2 className="text-xl font-semibold">{t("propertyform.yourProperties")}</h2>
          {properties.length === 0 ? (
            <p className="text-gray-600">{t("propertyform.noProperties")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((prop) => (
                <Card key={prop.id}>
                  <CardContent className="p-4">
                    {prop.image_url && (
                      <img
                        src={prop.image_url}
                        alt={prop.name}
                        className="w-full h-40 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="text-lg font-semibold">{prop.name}</h4>
                    <p className="text-sm text-gray-700">{prop.address}</p>
                    <p className="text-sm">{t("propertyform.propertyCard.price")}: ${prop.price}</p>
                    <p className="text-sm">
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
