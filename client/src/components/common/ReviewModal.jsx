import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiStar, FiCamera, FiTrash2, FiPlus } from 'react-icons/fi';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import SeaBiteLoader from './SeaBiteLoader';

const ReviewModal = ({ isOpen, onClose, product, existingReview, token, API_URL, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating);
        setComment(existingReview.comment);
        setImagePreviews(existingReview.images || []);
      } else {
        setRating(5);
        setComment('');
        setImages([]);
        setImagePreviews([]);
      }
    }
  }, [isOpen, existingReview]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('comment', comment);
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      await axios.post(
        `${API_URL}/api/products/${product._id}/reviews`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true,
        }
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {existingReview ? 'Update Review' : 'Rate Your Catch'}
              </h3>
              <p className="text-sm text-slate-500 font-medium">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                Overall Quality
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-all duration-300 transform ${
                      rating >= star ? 'text-amber-400 scale-110' : 'text-slate-300 scale-100'
                    } hover:scale-125`}
                  >
                    <FiStar fill={rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Share your thoughts
              </label>
              <textarea
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all font-medium"
                rows="4"
                placeholder="Was it fresh? How was the texture?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            {/* Photo Upload Zone */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
                Add Photos (Max 5)
              </label>
              
              <div 
                className={`
                  p-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer
                  ${imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                `}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (imagePreviews.length >= 5) return;
                  const files = Array.from(e.dataTransfer.files);
                  handleImageChange({ target: { files } });
                }}
                onClick={() => imagePreviews.length < 5 && fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
                  <FiCamera size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Click or drag images here</p>
                  <p className="text-[11px] text-slate-500 font-medium">PNG, JPG or JPEG up to 5MB</p>
                </div>
              </div>

              {/* Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <AnimatePresence>
                    {imagePreviews.map((preview, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="relative w-20 h-20 rounded-xl overflow-hidden group border-2 border-slate-100 dark:border-slate-800 shadow-sm"
                      >
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <FiX size={14} />
                        </button>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                           <FiTrash2 size={16} className="text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/10 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <SeaBiteLoader small />
              ) : (
                <>
                  {existingReview ? 'Update Review' : 'Post Review'}
                  <FiPlus className="group-hover:rotate-90 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
