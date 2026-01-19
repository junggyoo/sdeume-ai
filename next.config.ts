import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },

  async redirects() {
    return [
      // Step 1 (특수 케이스: projectId 무시하고 step1으로)
      {
        source: '/studio/:projectId/upload',
        destination: '/new-shoot/step1',
        permanent: false,
      },
      // Step 2: 테마 선택
      {
        source: '/studio/:projectId/theme',
        destination: '/new-shoot/:projectId/step2',
        permanent: true,
      },
      // Step 3: 결제
      {
        source: '/studio/:projectId/payment',
        destination: '/new-shoot/:projectId/step3',
        permanent: true,
      },
      // Step 4: 진행 중
      {
        source: '/studio/:projectId/shooting',
        destination: '/new-shoot/:projectId/progress',
        permanent: true,
      },
      // Step 5: 결과
      {
        source: '/studio/:projectId/reveal',
        destination: '/new-shoot/:projectId/results',
        permanent: true,
      },
      // 스튜디오 인덱스 (기본값: step2)
      {
        source: '/studio/:projectId',
        destination: '/new-shoot/:projectId/step2',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
