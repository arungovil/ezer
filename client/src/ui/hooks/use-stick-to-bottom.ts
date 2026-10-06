import { useEffect, useRef, useState } from "react";

export function useStickToBottom(itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (!pinned || itemCount === 0) {
      return;
    }

    const scroller = scrollerRef.current;
    const last = scroller?.lastElementChild;
    last?.scrollIntoView({ block: "end" });
  }, [itemCount, pinned]);

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    setPinned(distanceFromBottom < 48);
  }

  return {
    scrollerRef,
    handleScroll,
    pinToEnd() {
      setPinned(true);
    },
  };
}
