// frontend/src/hooks/useElementSize.js
import { useEffect, useState } from "react";

/**
 * 특정 DOM 엘리먼트의 width/height를 ResizeObserver로 추적
 * - SRP: "크기 측정" 책임만 담당
 * - 오토핏/레이아웃 계산에 재사용 가능
 */
export function useElementSize(targetRef) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;

    let raf = 0;

    const update = (rect) => {
      // ResizeObserver 콜백은 연속으로 많이 올 수 있어 rAF로 합침
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      });
    };

    const ro = new ResizeObserver((entries) => {
      if (!entries?.length) return;
      update(entries[0].contentRect);
    });

    ro.observe(el);

    const rect = el.getBoundingClientRect();
    update(rect);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [targetRef]);

  return size;
}
