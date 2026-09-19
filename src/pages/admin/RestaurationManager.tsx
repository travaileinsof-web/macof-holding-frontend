import { useEffect, useRef, useState } from 'react';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { useInfiniteReveal } from '../../hooks/useInfiniteReveal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

type Product = {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  prix_gnf: number;
  image_url?: string;
  video_url?: string;
  disponible: boolean;
};

const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} GNF`;

function Thumb({ src, alt, size = 48 }: { src?: string; alt: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!src || broken) {
    return (
      <div
        style={style}
        className="flex items-center justify-center rounded-md bg-slate-800 border border-slate-700 text-slate-600 flex-shrink-0"
      >
        <ImageOff size={size * 0.4} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setBroken(true)}
      className="rounded-md object-cover border border-slate-700 flex-shrink-0"
    />
  );
}

export default function MenuProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    categorie: 'plats',
    prix_gnf: '',
    image: null as File | null,
    image_url: '',
    video_url: '',
    disponible: true,
  });

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (form.image) {
      const objectUrl = URL.createObjectURL(form.image);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(form.image_url || editing?.image_url);
  }, [form.image, form.image_url, editing]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { visibleItems, visibleCount, total, hasMore, sentinelRef } = useInfiniteReveal(
    products,
    20,
    scrollRef
  );

  const load = async () => {
    const response = await api.get('/api/v1/admin/restauration/menu');
    setProducts(response.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const open = (product?: Product) => {
    setEditing(product || null);
    setForm({
      nom: product?.nom || '',
      description: product?.description || '',
      categorie: product?.categorie || 'plats',
      prix_gnf: product ? String(product.prix_gnf) : '',
      image: null,
      image_url: product?.image_url || '',
      video_url: product?.video_url || '',
      disponible: product?.disponible ?? true,
    });
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    data.append('nom', form.nom);
    data.append('description', form.description);
    data.append('categorie', form.categorie);
    data.append('prix_gnf', form.prix_gnf);
    data.append('disponible', String(form.disponible));
    if (form.image) data.append('image', form.image);
    if (form.image_url) data.append('image_url', form.image_url);
    if (form.video_url) data.append('video_url', form.video_url);

    if (editing) {
      await api.put(`/api/v1/admin/restauration/menu/${editing.id}`, data);
    } else {
      await api.post('/api/v1/admin/restauration/menu', data);
    }
    setEditing(null);
    setModalOpen(false);
    await load();
  };

  const confirmRemove = async () => {
    if (!itemToDelete) return;
    await api.delete(`/api/v1/admin/restauration/menu/${itemToDelete}`);
    setItemToDelete(null);
    await load();
  };

  return (
    <AdminPage loading={loading} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Menu & Produits (SEBA)</h2>
          <p className="text-slate-400 text-sm mt-1">Gérez la carte et les produits disponibles</p>
        </div>
        <button
          onClick={() => open()}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau Produit
        </button>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden flex flex-col">
        <section
          ref={scrollRef}
          className="flex-1 overflow-auto h-[65vh] relative"
        >
          <div className="min-w-[800px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-4 text-left">Image</th>
                  <th className="p-4 text-left">Nom</th>
                  <th className="p-4 text-left">Catégorie</th>
                  <th className="p-4 text-left">Prix</th>
                  <th className="p-4 text-left">Disponible</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {visibleItems.map((product) => (
                  <tr key={product.id}>
                    <td className="p-4">
                      <Thumb src={product.image_url} alt={product.nom} />
                    </td>
                    <td className="p-4">{product.nom}</td>
                    <td className="p-4">{product.categorie}</td>
                    <td className="p-4">{money(product.prix_gnf)}</td>
                    <td className="p-4">{product.disponible ? 'Oui' : 'Non'}</td>
                    <td className="p-4 text-right">
                      <button
                        title="Modifier"
                        onClick={() => open(product)}
                        className="mr-3 text-amber-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button title="Supprimer" onClick={() => setItemToDelete(product.id)} className="text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Aucun plat pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Sentinel row observed by IntersectionObserver to reveal the next batch */}
            {hasMore && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-500">
                Chargement...
              </div>
            )}
          </div>
        </section>

        {modalOpen ? (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <form
              onSubmit={save}
              className="bg-[#1e293b] border border-slate-700 p-6 rounded-lg w-full max-w-lg space-y-4 my-8"
            >
              <h3 className="text-xl font-semibold">{editing ? 'Modifier le plat' : 'Nouveau plat'}</h3>
              <input
                required
                placeholder="Nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 p-3 rounded"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 p-3 rounded"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  className="bg-slate-800 border border-slate-600 p-3 rounded"
                >
                  <option value="boulangerie">Boulangerie</option>
                  <option value="plats">Plats</option>
                  <option value="boissons">Boissons</option>
                </select>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Prix GNF"
                  value={form.prix_gnf}
                  onChange={(e) => setForm({ ...form, prix_gnf: e.target.value })}
                  className="bg-slate-800 border border-slate-600 p-3 rounded"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Image (Fichier local ou URL)</p>
                <div className="flex items-start gap-4">
                  <Thumb src={previewUrl} alt={form.nom || 'Aperçu'} size={64} />
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                      className="text-sm w-full"
                    />
                    <input
                      type="url"
                      placeholder="Ou coller une URL d'image (ex: Unsplash)"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 p-2 text-sm rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Vidéo de cuisine au survol (Optionnel)</p>
                <input
                  type="url"
                  placeholder="URL Vidéo MP4 (ex: Pexels)"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 p-2 text-sm rounded"
                />
              </div>

              <label className="flex gap-2 items-center pt-2">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                />
                Disponible
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-slate-800 rounded transition-colors"
                >
                  Annuler
                </button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded transition-colors">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={confirmRemove}
        onCancel={() => setItemToDelete(null)}
      />
    </AdminPage>
  );
}






