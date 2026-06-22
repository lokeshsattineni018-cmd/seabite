import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiStar, FiX } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const EMPTY_FORM = {
  title: "", description: "", coverImage: "", cookTimeMinutes: 30, prepTimeMinutes: 15,
  servings: 2, difficulty: "Easy", cuisine: "Coastal Indian", tags: "",
  ingredients: [], otherIngredients: "", steps: "", published: false, featured: false,
};

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchRecipes = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/recipes/admin/all`, { withCredentials: true })
      .then(res => { setRecipes(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecipes();
    axios.get(`${API_URL}/api/products`).then(res => setProducts(res.data.products || [])).catch(() => {});
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (recipe) => {
    setForm({
      ...recipe,
      tags: recipe.tags?.join(", ") || "",
      otherIngredients: recipe.otherIngredients?.join("\n") || "",
      steps: recipe.steps?.join("\n") || "",
    });
    setEditingId(recipe._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
      otherIngredients: form.otherIngredients.split("\n").map(s => s.trim()).filter(Boolean),
      steps: form.steps.split("\n").map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/recipes/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/recipes`, payload, { withCredentials: true });
      }
      setShowForm(false);
      fetchRecipes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this recipe?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/recipes/${id}`, { withCredentials: true });
      fetchRecipes();
    } catch { }
    finally { setDeletingId(null); }
  };

  const togglePublish = async (recipe) => {
    await axios.put(`${API_URL}/api/recipes/${recipe._id}`, { published: !recipe.published }, { withCredentials: true });
    fetchRecipes();
  };

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { productId: "", weightGrams: 100, notes: "" }] }));
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i, key, val) => setForm(f => {
    const updated = [...f.ingredients];
    updated[i] = { ...updated[i], [key]: key === "weightGrams" ? parseInt(val) || 0 : val };
    return { ...f, ingredients: updated };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFB", padding: "32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.03em", margin: "0 0 6px" }}>🍳 Recipes</h1>
          <p style={{ color: "#6B8F8A", fontSize: "14px", margin: 0, fontWeight: "500" }}>Manage Recipe-to-Cart content</p>
        </div>
        <button onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", background: "#1A2E2C", color: "#fff", border: "none", fontSize: "13px", fontWeight: "800", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <FiPlus size={16} /> New Recipe
        </button>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "#6B8F8A", fontWeight: "600" }}>Loading recipes…</div>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🍳</div>
          <p style={{ color: "#6B8F8A", fontWeight: "600" }}>No recipes yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {recipes.map(recipe => (
            <motion.div key={recipe._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", overflow: "hidden" }}
            >
              <div style={{ height: "160px", background: "#F4F9F8", position: "relative" }}>
                {recipe.coverImage && (
                  <img src={recipe.coverImage} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "20px", background: recipe.published ? "#F0FDF4" : "#FEF2F2", color: recipe.published ? "#10B981" : "#EF4444" }}>
                    {recipe.published ? "Published" : "Draft"}
                  </span>
                  {recipe.featured && <span style={{ fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "20px", background: "#FFFBEB", color: "#F59E0B" }}>⭐ Featured</span>}
                </div>
              </div>
              <div style={{ padding: "18px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 6px" }}>{recipe.title}</h3>
                <p style={{ fontSize: "12px", color: "#6B8F8A", margin: "0 0 14px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {recipe.description}
                </p>
                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "#6B8F8A", marginBottom: "14px", fontWeight: "600" }}>
                  <span>🐟 {recipe.ingredients?.length || 0} ingredients</span>
                  <span>📋 {recipe.steps?.length || 0} steps</span>
                  <span>👁 {recipe.views || 0} views</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => openEdit(recipe)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "#6B8F8A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button onClick={() => togglePublish(recipe)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: recipe.published ? "#FEF2F2" : "#F0FDF4", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: recipe.published ? "#EF4444" : "#10B981", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {recipe.published ? <><FiEyeOff size={13} /> Unpublish</> : <><FiEye size={13} /> Publish</>}
                  </button>
                  <button onClick={() => handleDelete(recipe._id)} disabled={deletingId === recipe._id} style={{ padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          >
            <motion.div initial={{ scale: 0.9, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 24 }}
              style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", padding: "32px", position: "relative" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.02em", margin: 0 }}>
                  {editingId ? "Edit Recipe" : "New Recipe"}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ padding: "8px", borderRadius: "10px", border: "none", background: "#F4F9F8", cursor: "pointer", color: "#6B8F8A" }}>
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {[
                  { label: "Title", key: "title", type: "text", required: true },
                  { label: "Cover Image URL", key: "coverImage", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <input required={f.required} type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E2EEEC", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E2EEEC", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                  {[{ label: "Prep (min)", key: "prepTimeMinutes" }, { label: "Cook (min)", key: "cookTimeMinutes" }, { label: "Servings", key: "servings" }].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>{f.label}</label>
                      <input type="number" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: parseInt(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E2EEEC", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="grilled, spicy, prawn"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E2EEEC", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Seafood Ingredients */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em" }}>Seafood Ingredients</label>
                    <button type="button" onClick={addIngredient} style={{ fontSize: "12px", fontWeight: "700", color: "#5BBFB5", background: "rgba(91,191,181,0.1)", border: "none", borderRadius: "8px", padding: "4px 12px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      + Add
                    </button>
                  </div>
                  {form.ingredients.map((ing, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                      <select value={ing.productId} onChange={e => updateIngredient(i, "productId", e.target.value)}
                        style={{ flex: 2, padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #E2EEEC", fontSize: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }}
                      >
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <input type="number" placeholder="Grams" value={ing.weightGrams} onChange={e => updateIngredient(i, "weightGrams", e.target.value)}
                        style={{ width: "80px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #E2EEEC", fontSize: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }}
                      />
                      <input type="text" placeholder="Notes" value={ing.notes} onChange={e => updateIngredient(i, "notes", e.target.value)}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #E2EEEC", fontSize: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }}
                      />
                      <button type="button" onClick={() => removeIngredient(i)} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#FEF2F2", color: "#EF4444", cursor: "pointer" }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {[
                  { label: "Other Ingredients (one per line)", key: "otherIngredients", placeholder: "2 tbsp butter\n1 lemon\n..." },
                  { label: "Steps / Instructions (one per line)", key: "steps", placeholder: "Heat the pan...\nAdd garlic..." },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={4} placeholder={f.placeholder}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E2EEEC", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </div>
                ))}

                <div style={{ display: "flex", gap: "20px" }}>
                  {[{ key: "published", label: "Published" }, { key: "featured", label: "Featured" }].map(f => (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>
                      <input type="checkbox" checked={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.checked })} />
                      {f.label}
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: "#6B8F8A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "#1A2E2C", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "800", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {saving ? "Saving…" : editingId ? "Update Recipe" : "Create Recipe"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
