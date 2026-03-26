import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { THEME_LIST, applyTheme, getSavedThemeCustomization } from "@/lib/themes";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/Card";
import { ArrowLeft, Upload, FileCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { ThemeCustomization, ThemeName } from "@/lib/themes";

export default function ThemeCustomization() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("modern");
  const [customization, setCustomization] = useState<ThemeCustomization>({
    theme: "modern",
    primaryColor: "#3b82f6",
    secondaryColor: "#06b6d4",
    accentColor: "#06b6d4",
  });
  const [priceListFile, setPriceListFile] = useState<File | null>(null);
  const [uploadedPriceList, setUploadedPriceList] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const saved = getSavedThemeCustomization();
    if (saved) {
      setSelectedTheme(saved.theme);
      setCustomization(saved);
    }
    // Load uploaded price list from localStorage
    const savedPriceList = localStorage.getItem("priceListUrl");
    if (savedPriceList) {
      setUploadedPriceList(savedPriceList);
    }
  }, []);

  const handleThemeChange = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    const newCustomization = { ...customization, theme: themeName };
    setCustomization(newCustomization);
    applyTheme(newCustomization);
  };

  const handleColorChange = (
    colorKey: "primaryColor" | "secondaryColor" | "accentColor",
    value: string
  ) => {
    const newCustomization = { ...customization, [colorKey]: value };
    setCustomization(newCustomization);
    applyTheme(newCustomization);
  };

  const handlePriceListSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Excel file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setPriceListFile(file);
    }
  };

  const handleUploadPriceList = async () => {
    if (!priceListFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", priceListFile);

      const response = await fetch("/api/upload-price-list", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const fileUrl = data.url || data.filePath;
      setUploadedPriceList(fileUrl);
      localStorage.setItem("priceListUrl", fileUrl);
      setPriceListFile(null);
      toast.success("Price list uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload price list");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    applyTheme(customization);
    toast.success("Theme customization saved!");
    setTimeout(() => navigate("/"), 1500);
  };

  const currentTheme = THEME_LIST.find((t) => t.id === selectedTheme);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Customize Your Store</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose from our festive firecracker themes or customize colors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Theme Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Theme</CardTitle>
                <CardDescription>
                  Choose one of our pre-built themes or customize colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {THEME_LIST.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`p-5 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedTheme === theme.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {/* Theme Preview Colors */}
                      <div className="flex gap-2 mb-4 h-16 rounded overflow-hidden">
                        <div
                          className="flex-1 rounded-l flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            backgroundColor: theme.primaryColor,
                          }}
                          title="Primary Color"
                        >
                          Primary
                        </div>
                        <div
                          className="flex-1 flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            backgroundColor: theme.secondaryColor,
                          }}
                          title="Secondary Color"
                        >
                          Secondary
                        </div>
                        <div
                          className="flex-1 flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: theme.accentColor,
                            color: theme.isDark ? "#ffffff" : "#000000",
                          }}
                          title="Accent Color"
                        >
                          Accent
                        </div>
                        <div
                          className="flex-1 rounded-r flex items-center justify-center font-bold text-sm border-l border-border"
                          style={{
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                          }}
                          title="Background"
                        >
                          BG
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-foreground">{theme.name}</h3>
                      <p className="text-xs font-semibold text-primary mb-2">{theme.tagline}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price List Upload */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-bold text-foreground">Price List</h3>
                  <p className="text-sm text-muted-foreground">Upload your price list PDF or Excel file to make it available for download in the store header</p>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Price List File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.xls,.xlsx"
                        onChange={handlePriceListSelect}
                        className="w-full px-3 py-2 border border-border rounded text-sm"
                        disabled={isUploading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or Excel files only (max 10MB)
                      </p>
                    </div>
                    <button
                      onClick={handleUploadPriceList}
                      disabled={!priceListFile || isUploading}
                      className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  {uploadedPriceList && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      <FileCheck className="w-4 h-4" />
                      <span>Price list uploaded successfully</span>
                    </div>
                  )}
                </div>

                {/* Color Customization */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-bold text-foreground">Advanced Color Options</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customization.primaryColor || "#3b82f6"}
                          onChange={(e) =>
                            handleColorChange("primaryColor", e.target.value)
                          }
                          className="w-12 h-10 rounded cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          value={customization.primaryColor || "#3b82f6"}
                          onChange={(e) =>
                            handleColorChange("primaryColor", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-border rounded text-sm font-mono"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Secondary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customization.secondaryColor || "#06b6d4"}
                          onChange={(e) =>
                            handleColorChange("secondaryColor", e.target.value)
                          }
                          className="w-12 h-10 rounded cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          value={customization.secondaryColor || "#06b6d4"}
                          onChange={(e) =>
                            handleColorChange("secondaryColor", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-border rounded text-sm font-mono"
                          placeholder="#06b6d4"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Accent Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customization.accentColor || "#06b6d4"}
                          onChange={(e) =>
                            handleColorChange("accentColor", e.target.value)
                          }
                          className="w-12 h-10 rounded cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          value={customization.accentColor || "#06b6d4"}
                          onChange={(e) =>
                            handleColorChange("accentColor", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-border rounded text-sm font-mono"
                          placeholder="#06b6d4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    Save & Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="p-8 rounded-lg text-white"
                  style={{
                    backgroundColor: customization.primaryColor || "#3b82f6",
                  }}
                >
                  <h3 className="font-bold text-lg mb-2">Primary Color</h3>
                  <p className="text-sm opacity-90">
                    {customization.primaryColor || "#3b82f6"}
                  </p>
                </div>

                <div
                  className="p-8 rounded-lg text-white"
                  style={{
                    backgroundColor: customization.secondaryColor || "#06b6d4",
                  }}
                >
                  <h3 className="font-bold text-lg mb-2">Secondary Color</h3>
                  <p className="text-sm opacity-90">
                    {customization.secondaryColor || "#06b6d4"}
                  </p>
                </div>

                <div
                  className="p-8 rounded-lg text-white"
                  style={{
                    backgroundColor: customization.accentColor || "#06b6d4",
                  }}
                >
                  <h3 className="font-bold text-lg mb-2">Accent Color</h3>
                  <p className="text-sm opacity-90">
                    {customization.accentColor || "#06b6d4"}
                  </p>
                </div>

                {currentTheme && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-bold mb-2 text-foreground">
                      {currentTheme.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentTheme.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Category: {currentTheme.category}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
