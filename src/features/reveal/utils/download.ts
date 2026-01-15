import type { GenerationImage } from '@/features/generation/types';

/**
 * 다운로드할 파일명을 생성합니다.
 * @param index - 이미지 인덱스 (0부터 시작)
 * @param projectId - 프로젝트 ID (선택)
 * @returns 생성된 파일명 (예: sdeume_001.jpg, sdeume_proj123_001.jpg)
 */
export function generateFilename(index: number, projectId?: string): string {
  const paddedIndex = String(index + 1).padStart(3, '0');
  if (projectId) {
    return `sdeume_${projectId}_${paddedIndex}.jpg`;
  }
  return `sdeume_${paddedIndex}.jpg`;
}

/**
 * 단일 이미지를 다운로드합니다.
 * fetch → blob → createObjectURL → anchor click → cleanup
 *
 * @param url - 이미지 URL
 * @param filename - 다운로드할 파일명
 * @throws 다운로드 실패 시 에러
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(objectUrl);
}

/**
 * 다운로드 결과 타입
 */
export interface DownloadResult {
  successCount: number;
  failedCount: number;
}

/**
 * 브라우저 제한을 피하기 위한 다운로드 간 딜레이 (ms)
 */
const DOWNLOAD_DELAY = 300;

/**
 * 딜레이를 위한 유틸리티 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 여러 이미지를 순차적으로 다운로드합니다.
 * 일부 다운로드가 실패해도 나머지는 계속 진행합니다.
 *
 * @param images - 다운로드할 이미지 배열
 * @param projectId - 프로젝트 ID (파일명에 포함, 선택)
 * @returns 성공/실패 카운트
 */
export async function downloadAllImages(
  images: GenerationImage[],
  projectId?: string
): Promise<DownloadResult> {
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const filename = generateFilename(i, projectId);

    try {
      await downloadImage(image.url, filename);
      successCount++;
    } catch (error) {
      console.error(`Failed to download image ${i + 1}:`, error);
      failedCount++;
    }

    // 마지막 이미지가 아니면 딜레이 추가 (브라우저 제한 회피)
    if (i < images.length - 1) {
      await delay(DOWNLOAD_DELAY);
    }
  }

  return { successCount, failedCount };
}
