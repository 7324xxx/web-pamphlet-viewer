/**
 * タッチイベント管理
 */

export interface TouchState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface TouchHandlerCallbacks {
  onPan?: (deltaX: number, deltaY: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
}

export class TouchHandler {
  private element: HTMLElement;
  private callbacks: TouchHandlerCallbacks;

  // パン/ドラッグ用
  private isDragging = false;
  private lastTouchX = 0;
  private lastTouchY = 0;

  // スワイプ用
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeThreshold = 50; // px
  private swipeMaxVertical = 100; // 縦方向の許容範囲

  // ダブルタップ用
  private lastTapTime = 0;
  private doubleTapDelay = 300; // ms

  // バインドされたイベントハンドラ（メモリリーク防止）
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleContextMenu: (e: Event) => void;

  constructor(element: HTMLElement, callbacks: TouchHandlerCallbacks) {
    this.element = element;
    this.callbacks = callbacks;

    // イベントハンドラをバインド
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleContextMenu = (e: Event) => e.preventDefault();

    this.setupListeners();
  }

  private setupListeners(): void {
    // タッチイベント（パッシブリスナーでパフォーマンス向上）
    this.element.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true });

    // マウスイベント
    this.element.addEventListener('mousedown', this.boundHandleMouseDown);
    // mousemoveとmouseupはwindowに登録（要素外でのドラッグ継続のため）
    window.addEventListener('mousemove', this.boundHandleMouseMove);
    window.addEventListener('mouseup', this.boundHandleMouseUp);

    // コンテキストメニュー無効化（長押し時のメニュー）
    this.element.addEventListener('contextmenu', this.boundHandleContextMenu);
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const touch = e.touches[0];

      // ダブルタップ検出
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapDelay) {
        e.preventDefault(); // ブラウザのデフォルトズームを防止
        this.callbacks.onDoubleTap?.();
        this.lastTapTime = 0; // リセット
      } else {
        this.lastTapTime = now;
      }

      // スワイプ・ドラッグ用の初期位置記録
      this.swipeStartX = touch.clientX;
      this.swipeStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;

      // 常にドラッグ可能
      this.isDragging = true;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.isDragging) {
      // ドラッグ/パン（常時有効）
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastTouchX;
      const deltaY = touch.clientY - this.lastTouchY;

      this.callbacks.onPan?.(deltaX, deltaY);

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      // すべてのタッチが終了

      // 最終タッチ位置を取得（changedTouches から）
      const finalTouch = e.changedTouches[0];
      const finalX = finalTouch.clientX;
      const finalY = finalTouch.clientY;

      // スワイプ検出
      const deltaX = finalX - this.swipeStartX;
      const deltaY = Math.abs(finalY - this.swipeStartY);

      // 横方向のスワイプで、縦方向の移動が少ない場合
      if (deltaY < this.swipeMaxVertical) {
        if (deltaX > this.swipeThreshold) {
          // 右スワイプ（前のページへ）
          this.callbacks.onSwipeRight?.();
        } else if (deltaX < -this.swipeThreshold) {
          // 左スワイプ（次のページへ）
          this.callbacks.onSwipeLeft?.();
        }
      }

      this.isDragging = false;
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    // 左クリックのみ
    if (e.button !== 0) return;

    e.preventDefault();

    // ドラッグ開始
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
    this.swipeStartX = e.clientX;
    this.swipeStartY = e.clientY;
    this.isDragging = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    e.preventDefault();

    const deltaX = e.clientX - this.lastTouchX;
    const deltaY = e.clientY - this.lastTouchY;

    this.callbacks.onPan?.(deltaX, deltaY);

    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.element.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.element.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.element.removeEventListener('mousedown', this.boundHandleMouseDown);
    window.removeEventListener('mousemove', this.boundHandleMouseMove);
    window.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.element.removeEventListener('contextmenu', this.boundHandleContextMenu);
  }
}
