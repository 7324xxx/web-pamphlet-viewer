<script lang="ts">
  /**
   * ページネーションコントロール
   */
  let {
    currentPage,
    totalPages,
    canGoPrev,
    canGoNext,
    onPrev,
    onNext
  }: {
    currentPage: number;
    totalPages: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    onPrev: () => void;
    onNext: () => void;
  } = $props();
</script>

<div class="flex items-center justify-center gap-4 p-4 bg-white border-t border-gray-200">
  <button
    onclick={onPrev}
    disabled={!canGoPrev}
    class="px-6 py-3 min-w-[100px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation"
  >
    Previous
  </button>

  <span class="text-sm md:text-base text-gray-600 whitespace-nowrap">
    Page {currentPage + 1} / {totalPages}
  </span>

  <button
    onclick={onNext}
    disabled={!canGoNext}
    class="px-6 py-3 min-w-[100px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation"
  >
    Next
  </button>
</div>
