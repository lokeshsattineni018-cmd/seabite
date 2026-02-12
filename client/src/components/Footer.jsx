import { useContext, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiPhone, FiMail, FiSend, FiLoader, FiCheck } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";
import { motion, useInView } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "";

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 30, filter: "blur(6px)" }
      }
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Footer() {
  const { isDarkMode } = useContext(ThemeContext);
  const [formData, setFormData] = useState({ email: "", message: "" });
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      setStatus("success");
      setFormData({ email: "", message: "" });
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const footerLinks = [
    {
      title: "Information",
      links: [
        { to: "/about", label: "About Us" },
        { to: "/faq", label: "FAQ" },
        { to: "/products", label: "Shop Seafood" },
      ],
    },
    {
      title: "Legal & Policy",
      links: [
        { to: "/terms", label: "Terms & Conditions" },
        { to: "/privacy", label: "Privacy Policy" },
        { to: "/cancellation", label: "Cancellation & Refund" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-white/5 pt-16 md:pt-20 pb-12 font-sans relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16 mb-16">
          {/* BRAND */}
          <FadeUp delay={0}>
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  SeaBite
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Delivering the freshest catch from coast to kitchen. Premium
                quality seafood sourced responsibly and delivered with care to
                your kitchen.
              </p>
            </div>
          </FadeUp>

          {/* LINK COLUMNS */}
          {footerLinks.map((col, colIdx) => (
            <FadeUp key={col.title} delay={0.1 + colIdx * 0.1}>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">
                  {col.title}
                </h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="relative group inline-block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-blue-500 group-hover:w-full transition-all duration-300 ease-out" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}

          {/* CONTACT FORM */}
          <FadeUp delay={0.3}>
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">
                Contact Us
              </h4>
              <form onSubmit={handleSubmit} className="space-y-3">
                <motion.input
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  type="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <motion.textarea
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  placeholder="Message..."
                  required
                  rows="2"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-slate-900 dark:text-white resize-none placeholder:text-slate-400"
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg
                    ${
                      status === "success"
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : status === "error"
                        ? "bg-red-500 text-white"
                        : "bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 shadow-blue-500/20"
                    }
                  `}
                >
                  {status === "loading" ? (
                    <FiLoader className="animate-spin" />
                  ) : status === "success" ? (
                    <>
                      Sent <FiCheck />
                    </>
                  ) : status === "error" ? (
                    "Retry"
                  ) : (
                    <>
                      Send <FiSend />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <FiPhone
                    className="text-blue-600 dark:text-blue-400 shrink-0"
                    size={14}
                  />
                  <span>+91 9866635566</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <FiMail
                    className="text-blue-600 dark:text-blue-400 shrink-0"
                    size={14}
                  />
                  <span>support@seabite.co.in</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* ANIMATED DIVIDER */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent origin-center"
        />

        {/* COPYRIGHT */}
        <FadeUp delay={0.1}>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              &copy; {new Date().getFullYear()} SeaBite Seafoods. All rights
              reserved.
            </p>
            <p className="text-slate-400 text-xs flex items-center gap-1 font-medium">
              Freshly sourced from the coastline of Andhra Pradesh
            </p>
          </div>
        </FadeUp>
      </div>
    </footer>
  );
}