'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, MessageCircle, Instagram, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
  shareTitle?: string;
  shareText?: string;
  className?: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  shareUrl = typeof window !== 'undefined' ? window.location.href : '',
  shareTitle = '스드메 AI 화보',
  shareText = '아름다운 AI 웨딩 화보를 확인하세요!',
  className,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [shareUrl]);

  const handleKakaoShare = useCallback(() => {
    if (typeof window !== 'undefined' && (window as unknown as { Kakao?: { Share?: { sendDefault: (options: object) => void } } }).Kakao?.Share) {
      (window as unknown as { Kakao: { Share: { sendDefault: (options: object) => void } } }).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareText,
          imageUrl: '',
          link: {
            webUrl: shareUrl,
            mobileWebUrl: shareUrl,
          },
        },
      });
    } else {
      alert('카카오톡 공유 기능을 사용할 수 없습니다.');
    }
    onClose();
  }, [shareUrl, shareTitle, shareText, onClose]);

  const handleInstagramShare = useCallback(() => {
    alert('인스타그램 공유는 앱에서만 가능합니다.\n링크를 복사하여 공유해주세요.');
  }, []);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  }, [shareUrl, shareTitle, shareText, onClose]);

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: '링크 복사',
      icon: copied ? <Check className="w-6 h-6" /> : <Link2 className="w-6 h-6" />,
      onClick: handleCopyLink,
      color: copied ? 'text-green-400' : 'text-white',
    },
    {
      id: 'kakao',
      label: '카카오톡',
      icon: <MessageCircle className="w-6 h-6" />,
      onClick: handleKakaoShare,
      color: 'text-yellow-400',
    },
    {
      id: 'instagram',
      label: '인스타그램',
      icon: <Instagram className="w-6 h-6" />,
      onClick: handleInstagramShare,
      color: 'text-pink-400',
    },
  ];

  if (navigator.share) {
    shareOptions.push({
      id: 'more',
      label: '더보기',
      icon: <Copy className="w-6 h-6" />,
      onClick: handleNativeShare,
      color: 'text-white',
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 바텀시트 */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-slate-900 rounded-t-3xl',
              'safe-area-inset-bottom',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-3">
              <h3 className="text-white font-semibold text-lg">공유하기</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 공유 옵션들 */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-4 gap-4">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.onClick}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl',
                        'bg-white/10 backdrop-blur-sm',
                        'flex items-center justify-center',
                        'transition-colors hover:bg-white/20',
                        option.color
                      )}
                    >
                      {option.icon}
                    </div>
                    <span className="text-white/80 text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 하단 여백 */}
            <div className="h-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
