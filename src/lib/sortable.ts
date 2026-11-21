// Drag-to-reorder for a vertical list, using pointer events (mouse, touch and pen alike).
// It knows nothing about what the list holds: it animates the drag and reports the result through
// `onMove`, and the caller updates its own state and re-renders. Free of `astro:*` imports.

export interface SortableOptions {
  /** Selector for the element inside each item that starts a drag, e.g. '.grip'. */
  handle: string;
  /** Called once on drop, only when the item actually changed position. */
  onMove: (from: number, to: number) => void;
}

const MOVE_THRESHOLD = 4; // px of travel before a press becomes a drag

/**
 * Makes the direct children of `list` draggable by their handle. Listeners sit on the list itself,
 * so the caller can freely replace its children (re-render) without re-attaching anything.
 * Give each handle `touch-action: none` in CSS so touch drags don't scroll the page.
 * While dragging, the list gets `.sorting`, the dragged item `.dragging`; style those as you like.
 */
export function sortable(list: HTMLElement, { handle, onMove }: SortableOptions): void {
  list.addEventListener('pointerdown', (down) => {
    if (!down.isPrimary || (down.pointerType === 'mouse' && down.button !== 0)) return;
    const grip = (down.target as Element).closest(handle);
    const item = grip?.closest('li') as HTMLElement | null;
    if (!grip || !item || item.parentElement !== list) return;

    const items = [...list.children] as HTMLElement[];
    const from = items.indexOf(item);
    const centers = items.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    // Moving past a neighbour shifts it by the dragged item's height plus the list's gap.
    const shift = item.offsetHeight + (parseFloat(getComputedStyle(list).rowGap) || 0);
    const startY = down.clientY;
    let to = from;
    let dragging = false;

    const place = (dy: number) => {
      item.style.transform = `translateY(${dy}px)`;
      const draggedCenter = centers[from] + dy;
      to = centers.filter((c, i) => i !== from && c < draggedCenter).length;
      items.forEach((el, i) => {
        if (i === from) return;
        const s = from < to && i > from && i <= to ? -shift : from > to && i >= to && i < from ? shift : 0;
        el.style.transform = s ? `translateY(${s}px)` : '';
      });
    };

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== down.pointerId) return;
      if (!dragging) {
        if (Math.abs(ev.clientY - startY) < MOVE_THRESHOLD) return;
        dragging = true;
        list.classList.add('sorting');
        item.classList.add('dragging');
      }
      ev.preventDefault();
      place(ev.clientY - startY);
    };

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== down.pointerId) return;
      grip.removeEventListener('pointermove', move as EventListener);
      grip.removeEventListener('pointerup', end as EventListener);
      grip.removeEventListener('pointercancel', end as EventListener);
      if (!dragging) return;
      list.classList.remove('sorting');
      item.classList.remove('dragging');
      items.forEach((el) => (el.style.transform = ''));
      // A cancelled gesture (e.g. the system took over the touch) puts everything back.
      if (ev.type === 'pointerup' && to !== from) onMove(from, to);
    };

    // Listeners are on the grip, which keeps receiving events thanks to pointer capture.
    grip.setPointerCapture(down.pointerId);
    grip.addEventListener('pointermove', move as EventListener);
    grip.addEventListener('pointerup', end as EventListener);
    grip.addEventListener('pointercancel', end as EventListener);
  });
}
