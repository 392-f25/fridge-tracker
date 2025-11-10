import { useState, useRef, useEffect } from 'react';
import { uploadReceiptImage, queueReceiptProcessing, useAuthState } from '../utils/firebase';

interface ReceiptUploadProps {
  onUploadStart?: () => void;
  onUploadComplete?: (receiptId: string) => void;
  onUploadError?: (error: string) => void;
}

export default function ReceiptUpload({
  onUploadStart,
  onUploadComplete,
  onUploadError
}: ReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthState();

  useEffect(() => {
    console.log('[ReceiptUpload] Component mounted');
    console.log('[ReceiptUpload] User state:', user?.uid);
    console.log('[ReceiptUpload] uploadReceiptImage function:', typeof uploadReceiptImage);
    console.log('[ReceiptUpload] queueReceiptProcessing function:', typeof queueReceiptProcessing);
  }, [user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('[ReceiptUpload] File selected:', file?.name, file?.type, file?.size);
    if (!file) return;

    // Store the file in state
    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('[ReceiptUpload] Preview generated');
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    console.log('[ReceiptUpload] handleUpload called');
    console.log('[ReceiptUpload] Selected file from state:', selectedFile?.name);
    console.log('[ReceiptUpload] User:', user?.uid);

    if (!selectedFile || !user) {
      console.warn('[ReceiptUpload] Missing file or user, aborting');
      return;
    }

    console.log('[ReceiptUpload] Starting upload process...');
    setIsUploading(true);
    setUploadProgress('Uploading receipt...');
    onUploadStart?.();

    try {
      // Step 1: Upload to Firebase Storage
      console.log('[ReceiptUpload] Calling uploadReceiptImage...');
      const imageUrl = await uploadReceiptImage(selectedFile, user.uid);
      console.log('[ReceiptUpload] Upload successful, imageUrl:', imageUrl);
      setUploadProgress('Processing receipt...');

      // Step 2: Queue for OCR processing
      console.log('[ReceiptUpload] Calling queueReceiptProcessing...');
      const receiptId = await queueReceiptProcessing(imageUrl, user.uid);
      console.log('[ReceiptUpload] Receipt queued successfully, receiptId:', receiptId);
      setUploadProgress('Receipt queued for processing!');

      // Clear preview and reset
      setTimeout(() => {
        console.log('[ReceiptUpload] Resetting form');
        setPreviewUrl(null);
        setSelectedFile(null);
        setUploadProgress('');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onUploadComplete?.(receiptId);
      }, 2000);

    } catch (error) {
      console.error('[ReceiptUpload] Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress('');
      setIsUploading(false);
      onUploadError?.(errorMessage);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#10b981] to-[#06b6d4] bg-clip-text text-transparent">
        Upload Receipt
      </h2>

      {!previewUrl ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#94a3b8] rounded-xl p-8 text-center hover:border-[#10b981] transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <svg
                className="w-12 h-12 text-[#94a3b8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-[#475569] font-medium">Click to upload receipt</span>
              <span className="text-[#94a3b8] text-sm">JPEG, PNG, or HEIC (max 10MB)</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border-2 border-[#10b981]">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full h-64 object-contain bg-gray-50"
            />
          </div>

          {/* Progress Message */}
          {uploadProgress && (
            <div className="text-center text-[#10b981] font-medium">
              {uploadProgress}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Processing...' : 'Process Receipt'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-6 py-3 border-2 border-[#e2e8f0] text-[#475569] rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
