// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스들을 안전하게 합쳐주는 헬퍼
 * - clsx: 조건부 className 처리 (isActive && "bg-red-500" 같은 거)
 * - twMerge: 중복/충돌 나는 Tailwind 클래스 정리
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
