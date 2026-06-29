import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Edit,
  Save,
  Trash,
  Globe,
  Settings,
  Eye,
  RefreshCw,
  Search
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminCMS() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editorForm, setEditorForm] = useState({
    title: "",
    slug: "",
    contentHtml: "",
    status: "draft"
  });
  const [editingId, setEditingId] = useState(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/cms/pages`, { withCredentials: true });
      setPages(data || []);
    } catch (err) {
      toast.error("Failed to load CMS pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSavePage = async (e) => {
    e.preventDefault();
    if (!editorForm.title) {
      toast.error("Page Title is required");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API}/api/admin/cms/pages/${editingId}`, editorForm, { withCredentials: true });
        toast.success("Page updated successfully!");
      } else {
        await axios.post(`${API}/api/admin/cms/pages`, editorForm, { withCredentials: true });
        toast.success("Page created successfully!");
      }
      setShowEditor(false);
      setEditingId(null);
      setEditorForm({ title: "", slug: "", contentHtml: "", status: "draft" });
      fetchPages();
    } catch (err) {
      toast.error("Failed to save page");
    }
  };

  const handleEdit = (page) => {
    setEditingId(page._id);
    setEditorForm({
      title: page.title,
      slug: page.slug,
      contentHtml: page.contentHtml || "",
      status: page.status
    });
    setShowEditor(true);
  };

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/15 border border-violet-500/30">
            <FileText className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Content Management System</h1>
            <p className="text-xs text-slate-400">Design landing pages, edit legal terms, construct marketing layouts and manage SEO files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setEditorForm({ title: "", slug: "", contentHtml: "", status: "draft" });
              setShowEditor(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Create Page
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-4"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? "Edit Page Structure" : "Create New Custom Page"}
            </h3>
            <form onSubmit={handleSavePage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Page Title</label>
                  <input
                    type="text"
                    value={editorForm.title}
                    onChange={e => setEditorForm({ ...editorForm, title: e.target.value })}
                    placeholder="e.g. Terms of Service"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">SEO Slug</label>
                  <input
                    type="text"
                    value={editorForm.slug}
                    onChange={e => setEditorForm({ ...editorForm, slug: e.target.value })}
                    placeholder="e.g. terms-of-service"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Content editor (HTML)</label>
                <textarea
                  value={editorForm.contentHtml}
                  onChange={e => setEditorForm({ ...editorForm, contentHtml: e.target.value })}
                  placeholder="<h1>Legal Terms</h1><p>Welcome to SeaBite...</p>"
                  rows={8}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-violet-500/50 resize-none font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Save Page
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileText size={48} className="text-violet-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading custom page catalog...</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                  <th className="pb-3 pr-4">Page Title</th>
                  <th className="pb-3 px-4">Slug</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Last Modified</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No pages created yet.</td>
                  </tr>
                ) : (
                  pages.map(page => (
                    <tr key={page._id} className="border-b border-white/5 hover:bg-white/[0.01]">
                      <td className="py-3.5 pr-4 font-bold text-white">{page.title}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">/{page.slug}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          page.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(page.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          onClick={() => handleEdit(page)}
                          className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
