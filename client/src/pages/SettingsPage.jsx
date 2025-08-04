import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage({ user }) {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");
  const { t } = useTranslation();

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

  const handleDeleteProperty = async (property) => {
    if (!window.confirm(`Are you sure you want to delete "${property.name}"?`)) return;
    setStatus(t("settings.status.deleting"));

    try {
      if (property.image_url) {
        const url = new URL(property.image_url);
        const parts = url.pathname.split("/");
        const bucketIndex = parts.indexOf("public") + 1;
        const filePath = parts.slice(bucketIndex + 1).join("/");

        const { error: deleteError } = await supabase.storage
          .from("property-images")
          .remove([filePath]);
        if (deleteError) console.error("Failed to delete image:", deleteError.message);
      }

      const { error } = await supabase.from("properties").delete().eq("id", property.id);
      if (error) {
        setStatus(t("settings.status.deleteFail") + error.message);
        return;
      }

      setProperties((prev) => prev.filter((p) => p.id !== property.id));
    } catch (err) {
      setStatus(t("settings.status.error") + err.message);
    }
  };

  const refreshProperties = () => {
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setShowForm(true)}>{t("settings.add")}</Button>
              {status && <span className="text-sm text-gray-600">{status}</span>}
            </div>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <Card key={prop.id} className="flex flex-col">
                    {prop.image_url && (
                      <img
                        src={prop.image_url}
                        alt={prop.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="flex flex-col gap-2 flex-grow">
                      <h4 className="text-lg font-semibold">{prop.name}</h4>
                      <p className="text-sm text-gray-600">{prop.address}</p>
                      <p className="text-sm">
                        {t("settings.form.price", {
                          price: prop.price,
                        })}
                      </p>
                      <p className="text-sm">
                        {t("settings.form.details", {
                          bedrooms: prop.bedrooms,
                          bathrooms: prop.bathrooms,
                        })}
                      </p>
                      <Button
                        onClick={() => handleDeleteProperty(prop)}
                        className="mt-auto"
                      >
                        {t("settings.form.delete")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">{t("settings.empty")}</p>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <PropertyForm
                onClose={() => setShowForm(false)}
                user={user}
                onPropertyAdded={refreshProperties}
                setStatus={setStatus}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyForm({ onClose, user, onPropertyAdded, setStatus }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [localStatus, setLocalStatus] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !address || !price || !bedrooms || !bathrooms) {
      setLocalStatus("Please fill in all required fields.");
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setLocalStatus("Failed to upload image: " + uploadError.message);
        setStatus("Failed to upload image: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("property-images").getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const { error: insertError } = await supabase.from("properties").insert([
      {
        user_id: user.id,
        name,
        address,
        price: Number(price),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        image_url: imageUrl,
      },
    ]);

    if (insertError) {
      setLocalStatus("Failed to save property: " + insertError.message);
      setStatus("Failed to save property: " + insertError.message);
      return;
    }

    onPropertyAdded();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">{t("settings.form.title")}</h2>

      <label className="text-sm font-medium">{t("settings.form.labels.name")}</label>
      <input
        className="border rounded p-2"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label className="text-sm font-medium">{t("settings.form.labels.address")}</label>
      <input
        className="border rounded p-2"
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />

      <label className="text-sm font-medium">{t("settings.form.labels.price")}</label>
      <input
        className="border rounded p-2"
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <label className="text-sm font-medium">{t("settings.form.labels.bedrooms")}</label>
      <input
        className="border rounded p-2"
        type="number"
        min="0"
        value={bedrooms}
        onChange={(e) => setBedrooms(e.target.value)}
        required
      />

      <label className="text-sm font-medium">{t("settings.form.labels.bathrooms")}</label>
      <input
        className="border rounded p-2"
        type="number"
        min="0"
        value={bathrooms}
        onChange={(e) => setBathrooms(e.target.value)}
        required
      />

      <label className="text-sm font-medium">{t("settings.form.labels.image")}</label>
      <input
        className="border rounded p-2"
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{"Submit"}</Button>
      </div>

      {localStatus && <p className="text-sm text-gray-600">{localStatus}</p>}
    </form>
  );
}
