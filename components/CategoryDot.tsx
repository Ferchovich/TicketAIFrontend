import { categoryColor } from "@/lib/categoryColor";

export function CategoryDot({ categoryId, size = 8 }: { categoryId: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: categoryColor(categoryId) }}
    />
  );
}
