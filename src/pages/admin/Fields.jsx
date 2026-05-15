// Admin: CRUD lapangan dengan upload gambar + lokasi
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  adminGetFieldsApi,
  adminCreateFieldApi,
  adminUpdateFieldApi,
  adminDeleteFieldApi,
} from "../../api/field";
import AdminLayout from "../../components/layout/AdminLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ImagePlus,
  MapPin,
  ExternalLink,
  X,
} from "lucide-react";
import { formatPrice } from "../../utils/format";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(["futsal", "badminton", "basketball", "tennis"]),
  description: z.string().optional(),
  price_per_hour: z.coerce.number().min(1000),
  facilities: z.string().optional(),
  is_active: z.boolean().optional(),
  address: z.string().optional(),
  maps_url: z.string().url("URL tidak valid").optional().or(z.literal("")),
  latitude: z.coerce.number().optional().or(z.literal("")),
  longitude: z.coerce.number().optional().or(z.literal("")),
});

export default function AdminFields() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-fields"],
    queryFn: () =>
      adminGetFieldsApi().then((r) => {
        console.log("FIELDS RESPONSE:", r.data);
        console.log("FIRST FIELD:", r.data?.data?.[0] || r.data?.[0]);
        return r.data.data;
      }),
  });
  const fields = data?.data || data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const createMut = useMutation({
    mutationFn: adminCreateFieldApi,
    onSuccess: () => {
      toast.success("Lapangan ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin-fields"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Gagal"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminUpdateFieldApi(id, data),
    onSuccess: () => {
      toast.success("Lapangan diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-fields"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Gagal"),
  });
  const deleteMut = useMutation({
    mutationFn: adminDeleteFieldApi,
    onSuccess: () => {
      toast.success("Lapangan dihapus");
      qc.invalidateQueries({ queryKey: ["admin-fields"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Gagal"),
  });

  const closeModal = () => {
    setModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
    reset();
  };

  const openCreate = () => {
    setEditing(null);
    reset({ is_active: true });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    reset({
      ...f,
      facilities: f.facilities?.join(", ") || "",
      is_active: f.is_active,
      maps_url: f.maps_url || "",
      address: f.address || "",
      latitude: f.latitude ?? "",
      longitude: f.longitude ?? "",
    });
    setImageFile(null);
    setImagePreview(f.image_url || null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = (data) => {
    const payload = new FormData();

    // Basic fields
    payload.append("name", data.name);
    payload.append("type", data.type);
    if (data.description) payload.append("description", data.description);
    payload.append("price_per_hour", data.price_per_hour);
    payload.append("is_active", data.is_active ? "1" : "0");

    // Facilities
    const facs = data.facilities
      ? data.facilities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    facs.forEach((f) => payload.append("facilities[]", f));

    // Location
    if (data.address) payload.append("address", data.address);
    if (data.maps_url) payload.append("maps_url", data.maps_url);
    if (data.latitude) payload.append("latitude", data.latitude);
    if (data.longitude) payload.append("longitude", data.longitude);

    // Image
    if (imageFile) payload.append("image", imageFile);

    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const toggleActive = (f) => {
    const payload = new FormData();
    payload.append("is_active", !f.is_active ? "1" : "0");
    updateMut.mutate({ id: f.id, data: payload });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lapangan</h1>
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Lapangan
          </Button>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                  <tr>
                    {[
                      "Gambar",
                      "Nama",
                      "Tipe",
                      "Harga/Jam",
                      "Lokasi",
                      "Fasilitas",
                      "Status",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 font-medium text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        {f.image_url ? (
                          <img
                            src={f.image_url}
                            alt={f.name}
                            className="w-16 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-300">
                            <ImagePlus size={18} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{f.name}</td>
                      <td className="py-3 px-4 capitalize">
                        {f.type_label || f.type}
                      </td>
                      <td className="py-3 px-4">
                        {f.price_formatted || formatPrice(f.price_per_hour)}
                      </td>
                      <td className="py-3 px-4">
                        {f.address ? (
                          <div className="text-xs text-gray-500">
                            <p className="truncate max-w-[140px]">
                              {f.address}
                            </p>
                            {f.maps_url && (
                              <a
                                href={f.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary-500 hover:underline mt-0.5"
                              >
                                <MapPin size={11} /> Lihat Maps
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {f.facilities?.slice(0, 3).join(", ") || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive(f)}
                          className="flex items-center gap-1.5 text-sm"
                        >
                          {f.is_active ? (
                            <>
                              <ToggleRight
                                size={20}
                                className="text-accent-600"
                              />
                              <span className="text-accent-600">Aktif</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={20} className="text-gray-400" />
                              <span className="text-gray-400">Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(f)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Hapus lapangan ini?"))
                                deleteMut.mutate(f.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Lapangan" : "Tambah Lapangan"}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
        >
          {/* ── Gambar Lapangan ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Gambar Lapangan
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ImagePlus size={28} />
                  <p className="text-sm">Klik untuk upload gambar</p>
                  <p className="text-xs">JPG, PNG, WEBP — maks. 2MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <Input
            label="Nama Lapangan"
            error={errors.name?.message}
            {...register("name")}
          />
          <Select
            label="Tipe"
            error={errors.type?.message}
            {...register("type")}
          >
            <option value="">Pilih tipe</option>
            {["futsal", "badminton", "basketball", "tennis"].map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Harga per Jam (Rp)"
            type="number"
            error={errors.price_per_hour?.message}
            {...register("price_per_hour")}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 resize-none"
              {...register("description")}
            />
          </div>
          <Input
            label="Fasilitas (pisah koma)"
            placeholder="Parkir, Toilet, Mushola"
            error={errors.facilities?.message}
            {...register("facilities")}
          />

          {/* ── Lokasi ── */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-indigo-600" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Lokasi Lapangan
              </span>
            </div>
            <div className="space-y-3">
              <Input
                label="Alamat"
                placeholder="Jl. Sudirman No.1, Jakarta"
                error={errors.address?.message}
                {...register("address")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Google Maps URL
                </label>
                <div className="relative">
                  <input
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                    {...register("maps_url")}
                  />
                </div>
                {errors.maps_url && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.maps_url.message}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Buka Google Maps → Bagikan → Salin link. Atau gunakan link
                  Google Maps biasa.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  placeholder="-6.200000"
                  type="number"
                  step="any"
                  error={errors.latitude?.message}
                  {...register("latitude")}
                />
                <Input
                  label="Longitude"
                  placeholder="106.816666"
                  type="number"
                  step="any"
                  error={errors.longitude?.message}
                  {...register("longitude")}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeModal}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMut.isPending || updateMut.isPending}
            >
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
