import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  ShieldCheck,
  Users,
  Loader2,
  RefreshCw,
  TrendingUp,
  Package,
  Plus,
  Trash2,
  X,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import symdealsLogo from "@/assets/symdeals-logo.png";
import {
  type AdminTodayUser,
  type Product,
  type ProductCategory,
  PRODUCT_CATEGORIES,
  adminCreateProduct,
  adminDeleteProduct,
  adminUploadImage,
  clearAdminSession,
  fetchAdminTodayUsers,
  fetchProducts,
  getAdminToken,
  resolveImageUrl,
} from "@/lib/api";
import { EmailCenter } from "@/components/admin/EmailCenter";
import { NoticesManager } from "@/components/admin/NoticesManager";
import { WeeklyGrowthChart } from "@/components/admin/WeeklyGrowthChart";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SymDeals" },
      { name: "description", content: "SymDeals admin dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminTodayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminTodayUsers();
      setCount(res.todayUsers);
      setMonthCount(res.monthUsers ?? null);
      setTotalCount(res.totalUsers ?? null);
      setUsers(res.users || []);
      setRefreshedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setError(msg);
      // If token is invalid/expired, kick back to login.
      if (/401|invalid|expired|admin/i.test(msg)) {
        clearAdminSession();
        navigate({ to: "/admin/login" });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetchProducts();
      setProducts(res.products);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      toast.error(msg);
    } finally {
      setProductsLoading(false);
    }
  };

  // Client-side guard. Admin token is required to view this page.
  useEffect(() => {
    if (!getAdminToken()) {
      navigate({ to: "/admin/login" });
      return;
    }
    void load();
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProductCreated = (p: Product) => {
    setProducts((prev) => [p, ...prev]);
    setShowForm(false);
    toast.success(`"${p.name}" added`);
  };

  const onDeleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const onLogout = () => setLogoutOpen(true);
  const confirmLogout = () => {
    setLogoutOpen(false);
    clearAdminSession();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" aria-label="SymDeals home" className="group flex items-center gap-3">
            <img
              src={symdealsLogo}
              alt="SymDeals"
              className="h-5 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-[1.03] sm:h-6"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.2))" }}
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Admin
            </span>
          </Link>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-muted-foreground/30 hover:bg-surface-elevated"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Live
            </span>
          </div>

          <h1 className="mt-5 font-display text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Real-time user signups for today.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-5">
            {/* Left column (40%): stacked stat cards */}
            <div className="grid gap-6 lg:col-span-2">
              {/* Card 1: Users Registered Today */}
              <div className="rounded-lg border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Users Registered Today
                    </span>
                  </div>
                  <button
                    onClick={() => void load()}
                    disabled={loading}
                    aria-label="Refresh"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-muted-foreground/30 hover:text-foreground disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  {error ? (
                    <p className="text-[13px] font-medium text-destructive">{error}</p>
                  ) : (
                    <div className="font-display text-[3.5rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                      {count === null ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        count.toLocaleString()
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-[11.5px] text-muted-foreground">
                    {refreshedAt
                      ? `Updated ${refreshedAt.toLocaleTimeString()}`
                      : "Awaiting first refresh"}
                  </p>
                </div>
              </div>

              {/* Card 2: This Month / Total Users */}
              <div className="rounded-lg border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      User Growth
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 divide-x divide-border">
                  <div className="pr-4">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      This Month
                    </span>
                    <div className="mt-2 font-display text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                      {monthCount === null ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        monthCount.toLocaleString()
                      )}
                    </div>
                  </div>
                  <div className="pl-4">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Total Users
                    </span>
                    <div className="mt-2 font-display text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                      {totalCount === null ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        totalCount.toLocaleString()
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-[11.5px] text-muted-foreground">
                  Cumulative platform growth
                </p>
              </div>
            </div>

            {/* Right column (60%): large weekly growth chart */}
            <div className="lg:col-span-3">
              <WeeklyGrowthChart />
            </div>
          </div>

          {/* Today's user list */}
          <div className="mt-10 rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                Users Registered Today
              </h2>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>

            {error && users.length === 0 ? (
              <p className="px-6 py-10 text-center text-[13px] font-medium text-destructive">
                {error}
              </p>
            ) : loading && users.length === 0 ? (
              <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                Loading…
              </p>
            ) : users.length === 0 ? (
              <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                No users registered today
              </p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Name
                      </th>
                      <th className="px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/60 last:border-0 transition-colors hover:bg-surface-elevated"
                      >
                        <td className="px-6 py-3.5 font-semibold text-foreground">
                          {u.name}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-[12px] text-muted-foreground">
                          {new Date(u.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manage Products */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                  Manage Products
                </h2>
              </div>
              <button
                onClick={() => setShowForm((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow"
              >
                {showForm ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    Close
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </>
                )}
              </button>
            </div>

            {showForm && (
              <div className="mt-5 rounded-lg border border-border bg-surface p-6 animate-fade-up">
                <ProductForm onCreated={onProductCreated} />
              </div>
            )}

            <div className="mt-6">
              {productsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-lg border border-border bg-surface"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
                  <Package className="h-7 w-7 text-muted-foreground/60" />
                  <p className="mt-3 text-[13.5px] font-semibold text-foreground">
                    No products yet
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Click "Add Product" to create your first listing.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <AdminProductCard
                      key={p.id}
                      product={p}
                      onDelete={() => onDeleteProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <EmailCenter />

          <NoticesManager />
        </div>
      </div>

      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

function AdminProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: () => void;
}) {
  const minPrice = product.plans.length
    ? Math.min(...product.plans.map((p) => p.price))
    : 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all hover:border-primary/40">
      <div className="aspect-[16/10] w-full overflow-hidden bg-background">
        {product.image ? (
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[14px] font-bold tracking-tight text-foreground">
            {product.name}
          </h3>
          <span className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {product.plans.length} {product.plans.length === 1 ? "plan" : "plans"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {product.category && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {product.category}
            </span>
          )}
          {typeof product.service_id === "number" && (
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight text-muted-foreground">
              ID #{product.service_id}
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.55] text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.plans.map((pl) => (
            <span
              key={pl.months}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground"
            >
              {pl.months}M · ₹{pl.price.toLocaleString()}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="font-display text-[1.05rem] font-bold tracking-tight text-foreground">
            From ₹{minPrice.toLocaleString()}
          </div>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

type DraftPlan = { months: string; price: string; realPrice: string };

function ProductForm({ onCreated }: { onCreated: (p: Product) => void }) {
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [plans, setPlans] = useState<DraftPlan[]>([{ months: "1", price: "", realPrice: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_BYTES = 2 * 1024 * 1024;
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

  // Revoke object URL when it changes/unmounts to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetImage = () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setImage("");
    setFileName("");
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2MB or smaller");
      return;
    }

    // Local preview while uploading.
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return localUrl;
    });
    setFileName(file.name);
    setUploading(true);
    setImage("");

    try {
      const res = await adminUploadImage(file);
      setImage(res.imageUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      resetImage();
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const updatePlan = (i: number, patch: Partial<DraftPlan>) => {
    setPlans((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const addPlan = () => {
    if (plans.length >= 12) {
      toast.error("Maximum 12 plans allowed");
      return;
    }
    setPlans((prev) => [...prev, { months: "", price: "", realPrice: "" }]);
  };
  const removePlan = (i: number) => {
    if (plans.length === 1) {
      toast.error("At least one plan is required");
      return;
    }
    setPlans((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    let serviceIdNum: number | undefined;
    const sidTrim = serviceId.trim();
    if (sidTrim) {
      if (!/^\d{4}$/.test(sidTrim)) {
        toast.error("Service ID must be exactly 4 digits");
        return;
      }
      serviceIdNum = Number(sidTrim);
    }
    if (uploading) {
      toast.error("Please wait for the image to finish uploading");
      return;
    }
    if (!image.trim()) {
      toast.error("Please upload a product image");
      return;
    }
    const parsedPlans: { months: number; price: number; realPrice: number }[] = [];
    const seenMonths = new Set<number>();
    for (const [i, pl] of plans.entries()) {
      const m = Number(pl.months);
      const pr = Number(pl.price);
      const rp = pl.realPrice.trim() === "" ? 0 : Number(pl.realPrice);
      if (!Number.isInteger(m) || m < 1 || m > 120) {
        toast.error(`Plan ${i + 1}: months must be a whole number (1–120)`);
        return;
      }
      if (!Number.isFinite(pr) || pr < 0) {
        toast.error(`Plan ${i + 1}: enter a valid price`);
        return;
      }
      if (!Number.isFinite(rp) || rp < 0) {
        toast.error(`Plan ${i + 1}: enter a valid real price`);
        return;
      }
      if (seenMonths.has(m)) {
        toast.error(`Plan ${i + 1}: duration "${m} month(s)" is duplicated`);
        return;
      }
      seenMonths.add(m);
      parsedPlans.push({ months: m, price: pr, realPrice: rp });
    }

    setSubmitting(true);
    try {
      const res = await adminCreateProduct({
        name: name.trim(),
        ...(serviceIdNum !== undefined ? { service_id: serviceIdNum } : {}),
        category,
        description: description.trim(),
        image: image.trim(),
        plans: parsedPlans,
      });
      onCreated(res.product);
      setName("");
      setServiceId("");
      setCategory("");
      setDescription("");
      resetImage();
      setPlans([{ months: "1", price: "", realPrice: "" }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-border bg-input px-3.5 py-2.5 text-[13.5px] font-medium text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelCls =
    "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) void submit();
      }}
    >
      <div>
        <label className={labelCls}>Product Name</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Netflix Premium"
        />
      </div>
      <div>
        <label className={labelCls}>
          Service ID{" "}
          <span className="text-muted-foreground/60 normal-case tracking-normal">
            (4 digits, optional)
          </span>
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={1000}
          max={9999}
          className={inputCls}
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          placeholder="e.g. 1001 (auto if empty)"
        />
        <p className="mt-1 text-[10.5px] text-muted-foreground/80">
          Lower IDs appear first. Leave empty to auto-generate.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>
          Category <span className="text-destructive">*</span>
        </label>
        <select
          required
          className={inputCls}
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory | "")}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Description</label>
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description shown on the product card"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Product Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* Preview box */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {!uploading && image && (
                  <div className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 shadow">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <ImagePlus className="h-7 w-7" />
              </div>
            )}
          </div>

          {/* Picker + meta */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {previewUrl ? "Change Image" : "Choose Image"}
              </button>
              {previewUrl && !uploading && (
                <button
                  type="button"
                  onClick={resetImage}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-[12px] font-semibold text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {fileName ? (
                <>
                  <span className="font-medium text-foreground/80">{fileName}</span>
                  {uploading && " · uploading…"}
                  {!uploading && image && " · uploaded"}
                </>
              ) : (
                "JPG, PNG or WEBP · max 2MB"
              )}
            </p>
          </div>
        </div>
      </div>


      <div className="sm:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <label className={`${labelCls} mb-0`}>Pricing Plans</label>
          <span className="text-[10.5px] text-muted-foreground">
            {plans.length}/12
          </span>
        </div>
        <div className="space-y-2.5">
          {plans.map((pl, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-background/40 p-2.5"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  Months
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputCls}
                  value={pl.months}
                  onChange={(e) => updatePlan(i, { months: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className={inputCls}
                  value={pl.price}
                  onChange={(e) => updatePlan(i, { price: e.target.value })}
                  placeholder="23"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  Real Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className={inputCls}
                  value={pl.realPrice}
                  onChange={(e) => updatePlan(i, { realPrice: e.target.value })}
                  placeholder="299"
                />
              </div>
              <button
                type="button"
                onClick={() => removePlan(i)}
                disabled={plans.length === 1}
                className="mt-5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-background"
                aria-label={`Remove plan ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPlan}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add More Plans
        </button>
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Product
            </>
          )}
        </button>
      </div>
    </form>
  );
}

