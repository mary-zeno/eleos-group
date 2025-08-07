import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage({ user }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null); // NEW
  const [status, setStatus] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;

    const checkAdminAndFetch = async () => {
      const role = await fetchUserRole(user.id);
      if (role === "admin") {
        setIsAdmin(true);
        fetchProperties();
      } else {
        setIsAdmin(false);
        setStatus(t("settings.accessDenied") || "Access denied. Admins only.");
      }
    };

    checkAdminAndFetch();
  }, [user]);

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching role:", error.message);
      return null;
    }
    return data.role;
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(t("settings.status.fetchFail") + error.message);
    } else {
      setProperties(data);
      setStatus("");
    }
  };

  const handleDeleteProperty = async (property) => {
    if (!window.confirm(`Are you sure you want to delete "${property.name}"?`)) return;

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

  const openEditForm = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  if (!user) return <p>{t("settings.signInPrompt") || "Please sign in."}</p>;
  if (!isAdmin) return <p>{status || (t("settings.accessDenied") || "Access denied")}</p>;

  return (
    <div className="min-h-screen bg-charcoal-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => {
                  setEditingProperty(null);
                  setShowForm(true);
                }}
                className="bg-accent hover:bg-accent/90 text-black font-medium"
              >
                {t("settings.add")}
              </Button>
              {status && <span className="text-sm text-gray-600">{status}</span>}
            </div>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <Card key={prop.id} className="flex flex-col bg-charcoal-800 border-charcoal-700">
                    {prop.image_url && (
                      <img
                        src={prop.image_url}
                        alt={prop.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="flex flex-col gap-2 flex-grow">
                      <h4 className="text-lg font-semibold text-white">{prop.name}</h4>
                      <p className="text-sm text-gray-400">{prop.address}</p>
                      <p className="text-sm text-gray-300">
                        {t("settings.form.price", {
                          price: prop.price,
                        })}
                      </p>
                      <p className="text-sm text-gray-300">
                        {t("settings.form.details", {
                          bedrooms: prop.bedrooms,
                          bathrooms: prop.bathrooms,
                        })}
                      </p>
                      <div className="mt-auto flex gap-2">
                        <Button
                          onClick={() => openEditForm(prop)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {t("Edit") || "Edit"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteProperty(prop)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {t("settings.form.delete")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">{t("settings.empty")}</p>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeForm}
          >
            <div
              className="bg-charcoal-900 border border-charcoal-800 rounded-lg shadow-lg p-6 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <PropertyForm
                onClose={closeForm}
                user={user}
                onPropertyAdded={refreshProperties}
                setStatus={setStatus}
                property={editingProperty} // Pass property if editing
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyForm({ onClose, user, onPropertyAdded, setStatus, property }) {
  const [name, setName] = useState(property?.name || "");
  const [address, setAddress] = useState(property?.address || "");
  const [price, setPrice] = useState(property?.price || "");
  const [bedrooms, setBedrooms] = useState(property?.bedrooms || "");
  const [bathrooms, setBathrooms] = useState(property?.bathrooms || "");
  const [imageFile, setImageFile] = useState(null);
  const [localStatus, setLocalStatus] = useState("");
  const { t } = useTranslation();

  // When property changes (like when opening the form for editing), update states
  React.useEffect(() => {
    setName(property?.name || "");
    setAddress(property?.address || "");
    setPrice(property?.price || "");
    setBedrooms(property?.bedrooms || "");
    setBathrooms(property?.bathrooms || "");
    setImageFile(null); // Reset file input on open
    setLocalStatus("");
  }, [property]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !address || !price || !bedrooms || !bathrooms) {
      setLocalStatus(t("settings.form.validationError") || "Please fill in all required fields.");
      return;
    }

    let imageUrl = property?.image_url || null;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        setLocalStatus(t("settings.form.uploadFail") + uploadError.message);
        setStatus(t("settings.form.uploadFail") + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("property-images").getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    if (property) {
      // UPDATE existing property
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          name,
          address,
          price: Number(price),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          image_url: imageUrl,
        })
        .eq("id", property.id);

      if (updateError) {
        setLocalStatus(t("settings.form.saveFail") + updateError.message);
        setStatus(t("settings.form.saveFail") + updateError.message);
        return;
      }
    } else {
      // INSERT new property
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
        setLocalStatus(t("settings.form.saveFail") + insertError.message);
        setStatus(t("settings.form.saveFail") + insertError.message);
        return;
      }
    }

    onPropertyAdded();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2 text-white">
        {property ? t("settings.form.editTitle") || "Edit Property" : t("settings.form.title")}
      </h2>

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.name")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-gray-400 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.address")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-gray-400 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.price")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-gray-400 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.bedrooms")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-gray-400 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="number"
        min="0"
        value={bedrooms}
        onChange={(e) => setBedrooms(e.target.value)}
        required
      />

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.bathrooms")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-gray-400 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="number"
        min="0"
        value={bathrooms}
        onChange={(e) => setBathrooms(e.target.value)}
        required
      />

      <label className="text-sm font-medium text-gray-300">{t("settings.form.labels.image")}</label>
      <input
        className="border border-charcoal-700 bg-charcoal-800 text-white file:bg-charcoal-700 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 rounded p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700"
        >
          {t("Cancel") || "Cancel"}
        </Button>
        <Button
          type="submit"
          className="bg-accent hover:bg-accent/90 text-black font-medium"
        >
          {t("Submit") || "Submit"}
        </Button>
      </div>

      {localStatus && <p className="text-sm text-red-400">{localStatus}</p>}
    </form>
  );
}