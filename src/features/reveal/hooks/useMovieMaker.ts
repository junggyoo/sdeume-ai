'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  checkWebCodecsSupport,
  loadImage,
  generateKenBurnsScenes,
  encodeVideo,
  MOVIE_CONFIG,
} from '../lib/video-renderer';

/**
 * useMovieMaker 훅 옵션
 */
export interface UseMovieMakerOptions {
  /** 비디오에 사용할 이미지 URL 배열 */
  images: string[];
}

/**
 * useMovieMaker 훅 반환 타입
 */
export interface UseMovieMakerResult {
  /** 비디오 생성 시작 */
  generateMovie: () => Promise<void>;
  /** 생성 취소 */
  cancelGeneration: () => void;
  /** 비디오 다운로드 */
  downloadVideo: () => void;
  /** 미리보기 모달 닫기 */
  closePreviewModal: () => void;

  /** 생성 중 여부 */
  isProcessing: boolean;
  /** 진행률 (0-100) */
  progress: number;
  /** 생성된 비디오 URL */
  videoUrl: string | null;
  /** 에러 */
  error: Error | null;
  /** WebCodecs 지원 여부 */
  isSupported: boolean;

  /** 처리 중 모달 표시 여부 */
  isProcessingModalOpen: boolean;
  /** 미리보기 모달 표시 여부 */
  isPreviewModalOpen: boolean;
}

/**
 * Client-side 비디오 생성을 위한 React Hook
 *
 * Canvas API + mp4-muxer를 사용하여 Ken Burns 효과 비디오를 생성
 *
 * @param options - 이미지 URL 배열
 * @returns 비디오 생성 관련 상태와 함수들
 */
export function useMovieMaker(options: UseMovieMakerOptions): UseMovieMakerResult {
  const { images } = options;

  // 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // WebCodecs 지원 여부
  const isSupported = checkWebCodecsSupport();

  // 취소용 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 이전 비디오 URL 참조 (정리용)
  const previousVideoUrlRef = useRef<string | null>(null);

  /**
   * 이전 비디오 URL 정리
   */
  const cleanupPreviousVideo = useCallback(() => {
    if (previousVideoUrlRef.current) {
      URL.revokeObjectURL(previousVideoUrlRef.current);
      previousVideoUrlRef.current = null;
    }
  }, []);

  /**
   * 비디오 생성
   */
  const generateMovie = useCallback(async () => {
    // 이미 처리 중이면 무시
    if (isProcessing) return;

    // 이미지가 없으면 에러
    if (!images || images.length === 0) {
      setError(new Error('No images provided'));
      return;
    }

    // WebCodecs 미지원 시 에러
    if (!isSupported) {
      setError(
        new Error(
          '이 브라우저에서는 영상 생성을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.'
        )
      );
      return;
    }

    // 이전 에러 초기화
    setError(null);
    // 이전 비디오 URL 정리
    cleanupPreviousVideo();

    // 상태 초기화
    setIsProcessing(true);
    setProgress(0);
    setIsProcessingModalOpen(true);
    setVideoUrl(null);

    // AbortController 생성
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 1. 이미지 로드 (첫 번째 20% 진행률)
      const imageCount = Math.min(images.length, MOVIE_CONFIG.imageCount);
      const imagesToLoad = images.slice(0, imageCount);

      const loadedImages: HTMLImageElement[] = [];
      for (let i = 0; i < imagesToLoad.length; i++) {
        if (signal.aborted) {
          throw new Error('Video generation cancelled');
        }

        const img = await loadImage(imagesToLoad[i]);
        loadedImages.push(img);

        // 이미지 로드 진행률 (0-20%)
        setProgress(Math.round(((i + 1) / imagesToLoad.length) * 20));
      }

      // 2. Ken Burns 씬 생성
      const scenes = generateKenBurnsScenes(loadedImages.length);

      // 3. 비디오 인코딩 (20-100% 진행률)
      const videoBlob = await encodeVideo(
        loadedImages,
        scenes,
        (encodingProgress) => {
          // 인코딩 진행률 (20-100%)
          setProgress(20 + Math.round(encodingProgress * 0.8));
        },
        signal
      );

      // 4. 비디오 URL 생성
      const url = URL.createObjectURL(videoBlob);
      previousVideoUrlRef.current = url;
      setVideoUrl(url);
      setProgress(100);

      // 모달 전환
      setIsProcessingModalOpen(false);
      setIsPreviewModalOpen(true);
    } catch (err) {
      // 취소된 경우 에러 표시 안함
      if (signal.aborted) {
        // 취소 상태만 정리
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
      setIsProcessingModalOpen(false);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [images, isProcessing, isSupported, cleanupPreviousVideo]);

  /**
   * 생성 취소
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setIsProcessingModalOpen(false);
  }, []);

  /**
   * 비디오 다운로드
   */
  const downloadVideo = useCallback(() => {
    if (!videoUrl) return;

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `sdeume_movie_${Date.now()}.mp4`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [videoUrl]);

  /**
   * 미리보기 모달 닫기
   */
  const closePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
  }, []);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      // 비디오 URL 정리
      if (previousVideoUrlRef.current) {
        URL.revokeObjectURL(previousVideoUrlRef.current);
      }
      // 진행 중인 생성 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    generateMovie,
    cancelGeneration,
    downloadVideo,
    closePreviewModal,
    isProcessing,
    progress,
    videoUrl,
    error,
    isSupported,
    isProcessingModalOpen,
    isPreviewModalOpen,
  };
}
