import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useFetchAPI } from '../../hooks/useFetchAPI';
import { useAuth } from '../../hooks/useAuth';
import { showToastError } from '../../utils/common';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import type { ApiSuccess, Profile } from '@brainx/shared';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AvatarUploadProps {
  currentUrl: string | null | undefined;
  initials: string;
}

const AvatarUpload = ({ currentUrl, initials }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { refresh } = useAuth();
  const [uploadData, setUploadData] = useState<FormData | null>(null);

  const { isLoading: isUploading } = useFetchAPI<FormData, Profile>({
    apiFunction: (formData) =>
      client
        .post<ApiSuccess<Profile>>(endpoints.users.avatar, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: !!uploadData,
    apiParams: uploadData ?? undefined,
    dependencyArray: [uploadData],
    showSuccessMessage: true,
    successMessage: 'Avatar updated',
    errorMessage: 'Failed to upload avatar',
    successCb: () => {
      setUploadData(null);
      refresh();
    },
    failureCb: () => setUploadData(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToastError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      showToastError('File is too large. Maximum 2 MB allowed.');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadData(formData);
    e.target.value = '';
  };

  return (
    <button
      type="button"
      onClick={() => !isUploading && inputRef.current?.click()}
      className="group relative h-24 w-24 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Upload avatar"
    >
      {currentUrl ? (
        <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600 text-2xl font-bold select-none">
          {initials}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
        {isUploading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera size={20} className="text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
};

export default AvatarUpload;
