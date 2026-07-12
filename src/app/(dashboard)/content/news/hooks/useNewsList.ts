import { useMemo, useState } from "react";
import { postsHooks } from "@/api/postsApi";
import { postCategoriesHooks } from "@/api/postCategoriesApi";
import { toast } from "@/components/ui/Toast";
import { NEWS_PAGE_SIZE, type NewsStatusFilter } from "../types";

function useAllPosts() {
  const { data } = postsHooks.useList({ currentPage: 1, pageSize: 1000 });
  return data?.rows ?? [];
}

/** State + dữ liệu cho trang danh sách tin tức. */
export function useNewsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatusFilter>("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isFetching } = postsHooks.useList({
    currentPage: page,
    pageSize: NEWS_PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(categoryFilter ? { category_id: categoryFilter } : {}),
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / NEWS_PAGE_SIZE) || 1);

  const allPosts = useAllPosts();
  const stats = useMemo(() => {
    const totalPosts = allPosts.length;
    const draft = allPosts.filter((post) => post.status === "DRAFT").length;
    const published = allPosts.filter((post) => post.status === "PUBLISHED").length;
    const featured = allPosts.filter((post) => post.is_featured).length;
    return { totalPosts, draft, published, featured };
  }, [allPosts]);

  const { data: categoriesData } = postCategoriesHooks.useList({ currentPage: 1, pageSize: 100 } as Record<string, unknown>);
  const categoryOptions = (categoriesData?.rows ?? [])
    .filter((category) => category.is_active)
    .map((category) => ({ value: category.id, label: category.name }));

  const deleteMutation = postsHooks.useDelete({
    onSuccess: () => toast.success("Xóa tin tức thành công"),
    onError: (err) => toast.error(err.message || "Xóa tin tức thất bại"),
  });

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setPage(1);
  }

  return {
    rows,
    isFetching,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    stats,
    activeFilterCount,
    resetFilters,
    deleteMutation,
  };
}
