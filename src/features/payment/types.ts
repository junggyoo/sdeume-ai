export interface Feature {
  icon: string;
  text: string;
}

export interface Package {
  id: string;
  name: string;
  nameKr: string;
  price: number;
  originalPrice: number;
  discount: number;
  themeCount: number;
  features: Feature[];
  recommended: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  color: string;
}

export type PackageId = 'basic' | 'pro' | 'max';
export type PaymentMethodId = 'card' | 'kakao' | 'naver' | 'toss';
