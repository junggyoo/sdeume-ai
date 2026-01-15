/**
 * Client-side Video Renderer for Viral Movie Maker
 *
 * Canvas API + mp4-muxer (WebCodecs API based) 를 사용한 클라이언트 사이드 비디오 렌더링
 * Ken Burns 효과 (줌인/줌아웃 + 이징) + Cross-fade 장면 전환 구현
 */

/**
 * 비디오 생성 설정 상수
 */
export const MOVIE_CONFIG = {
  /** 총 영상 길이 (초) */
  totalDuration: 15,
  /** 초당 프레임 수 */
  fps: 30,
  /** 총 프레임 수 (15 * 30 = 450) */
  totalFrames: 450,
  /** 사용할 이미지 수 */
  imageCount: 5,
  /** 이미지당 프레임 수 (3초 * 30fps = 90) */
  framesPerImage: 90,
  /** 전환 효과 프레임 수 (0.5초 * 30fps = 15) */
  transitionFrames: 15,
  /** 출력 해상도 - 너비 */
  outputWidth: 1080,
  /** 출력 해상도 - 높이 (9:16 세로형) */
  outputHeight: 1920,
  /** 비디오 비트레이트 (8 Mbps) */
  videoBitrate: 8_000_000,
} as const;

/**
 * Ken Burns 씬 설정 타입
 */
export interface KenBurnsScene {
  /** 시작 스케일 (1.0 ~ 1.15) */
  startScale: number;
  /** 종료 스케일 (1.0 ~ 1.15) */
  endScale: number;
  /** 시작 X 오프셋 비율 (-0.1 ~ 0.1) */
  startX: number;
  /** 시작 Y 오프셋 비율 (-0.1 ~ 0.1) */
  startY: number;
  /** 종료 X 오프셋 비율 (-0.1 ~ 0.1) */
  endX: number;
  /** 종료 Y 오프셋 비율 (-0.1 ~ 0.1) */
  endY: number;
}

/**
 * 활성 이미지 정보 타입
 */
export interface ActiveImagesResult {
  /** 메인 이미지 인덱스 */
  imageA: number;
  /** 전환 중인 이미지 인덱스 (전환 중이 아니면 null) */
  imageB: number | null;
  /** 블렌드 팩터 (0: 오직 A, 1: 오직 B) */
  blendFactor: number;
}

/**
 * Ease-in-out cubic 이징 함수
 *
 * 시작과 끝에서 느리게, 중간에서 빠르게 움직이는 자연스러운 가속도 곡선
 *
 * @param t - 진행률 (0 ~ 1)
 * @returns 이징이 적용된 값 (0 ~ 1)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ken Burns 변환값 계산
 *
 * 주어진 씬 설정과 진행률에 따라 스케일 및 오프셋 값을 계산
 *
 * @param scene - Ken Burns 씬 설정
 * @param progress - 진행률 (0 ~ 1)
 * @returns 계산된 변환값 (scale, offsetX, offsetY)
 */
export function getKenBurnsTransform(
  scene: KenBurnsScene,
  progress: number
): { scale: number; offsetX: number; offsetY: number } {
  const eased = easeInOutCubic(progress);

  return {
    scale: scene.startScale + (scene.endScale - scene.startScale) * eased,
    offsetX: scene.startX + (scene.endX - scene.startX) * eased,
    offsetY: scene.startY + (scene.endY - scene.startY) * eased,
  };
}

/**
 * 현재 프레임에서 활성화된 이미지 결정
 *
 * Cross-fade 전환을 고려하여 어떤 이미지가 보여야 하는지와
 * 블렌딩 팩터를 계산
 *
 * @param frame - 현재 프레임 번호 (0 ~ 449)
 * @returns 활성 이미지 정보
 */
export function getActiveImages(frame: number): ActiveImagesResult {
  const { framesPerImage, transitionFrames, imageCount } = MOVIE_CONFIG;

  // 현재 이미지 인덱스 결정
  const imageIndex = Math.floor(frame / framesPerImage);
  // 현재 이미지 내에서의 프레임 위치
  const frameInImage = frame % framesPerImage;

  // 마지막 이미지는 전환 없음
  const isLastImage = imageIndex >= imageCount - 1;

  // 전환 구간인지 확인 (이미지의 마지막 15프레임)
  const transitionStart = framesPerImage - transitionFrames;
  const isInTransition = frameInImage >= transitionStart && !isLastImage;

  if (isInTransition) {
    // 전환 진행률 계산 (0 ~ 1)
    const transitionProgress = (frameInImage - transitionStart) / transitionFrames;
    const easedBlend = easeInOutCubic(transitionProgress);

    return {
      imageA: imageIndex,
      imageB: imageIndex + 1,
      blendFactor: easedBlend,
    };
  }

  return {
    imageA: Math.min(imageIndex, imageCount - 1),
    imageB: null,
    blendFactor: 0,
  };
}

/**
 * Ken Burns 씬 설정 생성
 *
 * 이미지 수에 따라 줌인/줌아웃을 교차하는 씬 설정을 생성
 *
 * @param imageCount - 이미지 수
 * @returns Ken Burns 씬 설정 배열
 */
export function generateKenBurnsScenes(imageCount: number): KenBurnsScene[] {
  if (imageCount === 0) return [];

  return Array.from({ length: imageCount }, (_, index) => {
    // 짝수: 줌인 (1.0 → 1.15), 홀수: 줌아웃 (1.15 → 1.0)
    const isZoomIn = index % 2 === 0;

    // 작은 랜덤 오프셋 추가 (시각적 다양성)
    const offsetVariation = 0.03;
    const startOffsetX = (Math.random() - 0.5) * offsetVariation;
    const startOffsetY = (Math.random() - 0.5) * offsetVariation;
    const endOffsetX = (Math.random() - 0.5) * offsetVariation;
    const endOffsetY = (Math.random() - 0.5) * offsetVariation;

    return {
      startScale: isZoomIn ? 1.0 : 1.15,
      endScale: isZoomIn ? 1.15 : 1.0,
      startX: startOffsetX,
      startY: startOffsetY,
      endX: endOffsetX,
      endY: endOffsetY,
    };
  });
}

/**
 * Ken Burns 효과를 적용하여 이미지를 Canvas에 그리기
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param image - 그릴 이미지
 * @param scene - Ken Burns 씬 설정
 * @param progress - 현재 진행률 (0 ~ 1)
 */
function drawImageWithKenBurns(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  scene: KenBurnsScene,
  progress: number
): void {
  const { scale, offsetX, offsetY } = getKenBurnsTransform(scene, progress);
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.save();

  // 캔버스 중심으로 이동
  ctx.translate(width / 2, height / 2);
  // 스케일 적용
  ctx.scale(scale, scale);
  // 오프셋 적용
  ctx.translate(offsetX * width, offsetY * height);

  // 이미지를 캔버스에 맞게 그리기 (aspect fill - cover)
  const imgAspect = image.width / image.height;
  const canvasAspect = width / height;

  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > canvasAspect) {
    // 이미지가 더 넓음 - 높이 맞춤
    drawHeight = height;
    drawWidth = height * imgAspect;
  } else {
    // 이미지가 더 좁음 - 너비 맞춤
    drawWidth = width;
    drawHeight = width / imgAspect;
  }

  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  ctx.restore();
}

/**
 * 프레임 렌더링
 *
 * Ken Burns 효과와 Cross-fade 전환을 적용하여 Canvas에 프레임을 렌더링
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param images - 이미지 배열
 * @param frame - 현재 프레임 번호
 * @param scenes - Ken Burns 씬 설정 배열
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  frame: number,
  scenes: KenBurnsScene[]
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // 캔버스 클리어 (검은 배경)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const { imageA, imageB, blendFactor } = getActiveImages(frame);
  const { framesPerImage } = MOVIE_CONFIG;

  // 현재 이미지 내에서의 진행률 계산
  const frameInImage = frame % framesPerImage;
  const progressA = frameInImage / framesPerImage;

  // 이미지 A 그리기
  if (imageB !== null) {
    // 전환 중 - 알파 블렌딩 적용
    ctx.globalAlpha = 1 - blendFactor;
  }
  drawImageWithKenBurns(ctx, images[imageA], scenes[imageA], progressA);

  // 이미지 B 그리기 (전환 중인 경우)
  if (imageB !== null) {
    ctx.globalAlpha = blendFactor;
    // 이미지 B는 막 시작하는 상태 (progress = 0)
    drawImageWithKenBurns(ctx, images[imageB], scenes[imageB], 0);
  }

  // 알파 리셋
  ctx.globalAlpha = 1;
}

/**
 * WebCodecs API 지원 여부 확인
 *
 * @returns WebCodecs가 지원되면 true
 */
export function checkWebCodecsSupport(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined' &&
    typeof EncodedVideoChunk !== 'undefined'
  );
}

/**
 * 이미지 로드 헬퍼 함수
 *
 * @param url - 이미지 URL
 * @returns 로드된 HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * 비디오 인코딩 (mp4-muxer 사용)
 *
 * Canvas 프레임들을 H.264 MP4로 인코딩
 *
 * @param images - 이미지 배열
 * @param scenes - Ken Burns 씬 설정
 * @param onProgress - 진행률 콜백 (0 ~ 100)
 * @param signal - AbortSignal (취소용)
 * @returns MP4 Blob
 */
export async function encodeVideo(
  images: HTMLImageElement[],
  scenes: KenBurnsScene[],
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');

  const config = MOVIE_CONFIG;

  // Canvas 생성
  const canvas = document.createElement('canvas');
  canvas.width = config.outputWidth;
  canvas.height = config.outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  // Muxer 초기화
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: config.outputWidth,
      height: config.outputHeight,
    },
    fastStart: 'in-memory',
  });

  // VideoEncoder 초기화
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      muxer.addVideoChunk(chunk, metadata);
    },
    error: (e) => {
      throw new Error(`VideoEncoder error: ${e.message}`);
    },
  });

  await encoder.configure({
    codec: 'avc1.640028', // H.264 High Profile Level 4.0
    width: config.outputWidth,
    height: config.outputHeight,
    bitrate: config.videoBitrate,
    framerate: config.fps,
  });

  const totalFrames = config.totalFrames;
  const frameDuration = 1_000_000 / config.fps; // 마이크로초 단위

  // 프레임 인코딩 루프
  for (let frame = 0; frame < totalFrames; frame++) {
    // 취소 확인
    if (signal?.aborted) {
      encoder.close();
      throw new Error('Video encoding cancelled');
    }

    // 프레임 렌더링
    renderFrame(ctx, images, frame, scenes);

    // VideoFrame 생성
    const videoFrame = new VideoFrame(canvas, {
      timestamp: frame * frameDuration,
      duration: frameDuration,
    });

    // 인코딩 (30프레임마다 키프레임)
    encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 });
    videoFrame.close();

    // 진행률 리포트
    onProgress(Math.round((frame / totalFrames) * 100));

    // UI 블로킹 방지 (10프레임마다 yield)
    if (frame % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // 인코딩 완료
  await encoder.flush();
  encoder.close();
  muxer.finalize();

  // Blob 생성
  const buffer = muxer.target.buffer;
  return new Blob([buffer], { type: 'video/mp4' });
}
