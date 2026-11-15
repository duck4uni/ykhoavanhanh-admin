import React, { useState, useCallback } from "react";

export interface RetryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  retryCount?: number;
  retryDelay?: number;
}

export function RetryImage({
  src,
  alt = "",
  retryCount = 3,
  retryDelay = 1000,
  ...rest
}: RetryImageProps) {
  // Use a key-based reset pattern: store both the original src and current reload state
  const [imageState, setImageState] = useState({
    originalSrc: src,
    reloadSrc: src,
    attempt: 0,
  });

  // Derived state pattern - reset when src prop changes
  const currentState =
    imageState.originalSrc === src
      ? imageState
      : { originalSrc: src, reloadSrc: src, attempt: 0 };

  const handleError = useCallback(() => {
    if (currentState.attempt < retryCount) {
      const nextAttempt = currentState.attempt + 1;
      const srcString = typeof src === "string" ? src : "";
      const retryUrl = `${srcString}${srcString.includes("?") ? "&" : "?"}_retry=${Date.now()}`;

      setTimeout(() => {
        setImageState({
          originalSrc: src,
          reloadSrc: retryUrl,
          attempt: nextAttempt,
        });
      }, retryDelay);
    } else {
      console.error(`❌ Image failed after ${retryCount} retries: ${src}`);
    }
  }, [currentState.attempt, retryCount, retryDelay, src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- cần onError để tự thử lại, URL ảnh động
    <img
      {...rest}
      src={currentState.reloadSrc}
      alt={alt}
      onError={handleError}
      style={{ objectFit: "contain", ...rest.style }}
    />
  );
}

export default RetryImage;
