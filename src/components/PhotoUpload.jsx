import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function PhotoUpload({ photoUrl, onPhotoChange, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, etc.)");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onPhotoChange(file_url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Label htmlFor="photo-upload">Profile Photo</Label>
      <div className="flex items-center gap-4 mt-2">
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ background: "#003262" }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-white/70" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {photoUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </Button>
          {photoUrl && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => onPhotoChange("")}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Upload a photo directly — it's stored permanently and won't expire like LinkedIn photo links.
      </p>
    </div>
  );
}