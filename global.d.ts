interface KakaoStatic {
  isInitialized: () => boolean;
  init: (appKey: string) => void;
  Link: {
    sendCustom: (options: { templateId: number }) => void;
  };
}

interface Window {
  Kakao: KakaoStatic;
}