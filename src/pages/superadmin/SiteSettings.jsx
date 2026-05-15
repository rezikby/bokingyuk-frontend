import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSiteSettingsApi, updateManySiteSettingsApi } from "../../api/siteSetting";
import SuperAdminLayout from "../../components/layout/SuperAdminLayout";
import Button from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Settings2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function SiteSettings() {
  const qc = useQueryClient();
  const [values, setValues] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettingsApi().then((r) => r.data.data),
  });

  useEffect(() => {
    if (!data) return;
    const map = {};
    Object.values(data)
      .flat()
      .forEach((s) => { map[s.key] = s.value; });
    setValues(map);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => updateManySiteSettingsApi(values),
    onSuccess: () => {
      toast.success("Pengaturan disimpan");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Gagal menyimpan"),
  });

  const grouped = data || {};

  const inputClass =
    "w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-[#111827] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <SuperAdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings2 size={22} className="text-purple-600" />
            <h1 className="text-xl font-bold">Pengaturan Situs</h1>
          </div>
          <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
            <Save size={15} className="mr-1.5" /> Simpan Semua
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500 text-sm">
            Gagal memuat pengaturan. Coba refresh halaman.
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Tidak ada pengaturan ditemukan.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  {group}
                </h2>
                <div className="space-y-4">
                  {items.map((s) => (
                    <div key={s.key}>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                        {s.label || s.key}
                        {s.description && (
                          <span className="text-gray-400 font-normal ml-1">— {s.description}</span>
                        )}
                      </label>
                      {s.type === "boolean" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={values[s.key] === "1" || values[s.key] === true}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [s.key]: e.target.checked ? "1" : "0" }))
                            }
                            className="w-4 h-4 rounded accent-purple-600"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Aktif</span>
                        </label>
                      ) : s.type === "textarea" ? (
                        <textarea
                          value={values[s.key] || ""}
                          onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                          rows={3}
                          className={inputClass + " resize-none"}
                        />
                      ) : (
                        <input
                          type={s.type === "integer" ? "number" : "text"}
                          value={values[s.key] || ""}
                          onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                          className={inputClass}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
