import { useEffect, useRef, useState } from 'react';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { useInfiniteReveal } from '../../hooks/useInfiniteReveal';

type Product = {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  prix_gnf: number;
  image_url?: string;
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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    categorie: 'plats',
    prix_gnf: '',
    image: null as File | null,
    disponible: true,
  });

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (form.image) {
      const objectUrl = URL.createObjectURL(form.image);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(editing?.image_url);
  }, [form.image, editing]);

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
    if (editing) {
      await api.put(`/api/v1/admin/restauration/menu/${editing.id}`, data);
    } else {
      await api.post('/api/v1/admin/restauration/menu', data);
    }
    setEditing(null);
    setModalOpen(false);
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer ce plat ?')) return;
    await api.delete(`/api/v1/admin/restauration/menu/${id}`);
    await load();
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-6 text-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Produits du menu</h2>
            <p className="text-slate-400 text-sm mt-1">Prix, disponibilité et photos des plats.</p>
          </div>
          <button
            onClick={() => open()}
            className="flex items-center gap-2 bg-amber-600 px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Nouveau plat
          </button>
        </div>

        <section className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold">Produits</h3>
            <span className="text-xs text-slate-500">
              {visibleCount} sur {total}
            </span>
          </div>

          {/* Fixed-height scroll area: rows are revealed progressively as the
              user scrolls here, instead of mounting the whole list at once. */}
          <div ref={scrollRef} className="overflow-y-auto overflow-x-auto max-h-[65vh]">
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
                        <Pencil size={16} />
                      </button>
                      <button title="Supprimer" onClick={() => remove(product.id)} className="text-red-400">
                        <Trash2 size={16} />
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={save}
              className="bg-[#1e293b] border border-slate-700 p-6 rounded-lg w-full max-w-lg space-y-4"
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
              <div className="flex items-center gap-4">
                <Thumb src={previewUrl} alt={form.nom || 'Aperçu'} size={64} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                  className="text-sm"
                />
              </div>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                />
                Disponible
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(false);
                  }}
                  className="px-4 py-2"
                >
                  Annuler
                </button>
                <button className="bg-amber-600 px-4 py-2 rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </AdminPage>
  );
}