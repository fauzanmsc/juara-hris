import React from 'react';
import { formatDriveUrl } from '../api';

interface DriveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallbackSrc?: string;
}

/**
 * Drop-in replacement for <img> that always converts Google Drive URLs
 * to the public thumbnail API format so they render correctly in browsers.
 */
const DriveImg: React.FC<DriveImgProps> = ({ src, fallbackSrc = '/img/profile.png', onError, ...rest }) => {
  const resolved = formatDriveUrl(src || '');

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (fallbackSrc && target.src !== fallbackSrc) {
      target.src = fallbackSrc;
    }
    if (onError) onError(e);
  };

  return <img src={resolved || fallbackSrc} onError={handleError} {...rest} />;
};

export default DriveImg;
