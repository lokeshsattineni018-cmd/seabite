import { useContext } from "react";
import { Link } from "react-router-dom";
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail, FiArrowRight } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

export default function Footer() {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <footer className="bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-white/5 pt-16 md:pt-20 pb-12 font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* SOFT AMBIENT GLOW */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16 mb-16">
          
          {/* BRAND COLUMN */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                SeaBite
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Delivering the freshest catch from coast to kitchen. Premium quality seafood sourced responsibly and delivered with care to your kitchen.
            </p>
            <div className="flex gap-3 pt-2">
              <SocialIcon icon={<FiFacebook />} />
              <SocialIcon icon={<FiInstagram />} />
              <SocialIcon icon={<FiTwitter />} />
            </div>
          </div>

          {/* INFORMATION COLUMN */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Information</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link></li>
              <li><Link to="/products" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Shop Seafood</Link></li>
              
            </ul>
          </div>

          {/* LEGAL COLUMN */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Legal & Policy</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cancellation" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cancellation & Refund</Link></li>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={16} />
                <span>Mogalthur, Narsapur<br/>Andhra Pradesh - 534281</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-blue-600 dark:text-blue-400" size={16} />
                <span>+91 9441429745</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-blue-600 dark:text-blue-400" size={16} />
                <span className="truncate">support@seabite.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT BAR */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-400 text-xs font-medium tracking-wide">
             © {new Date().getFullYear()} SeaBite Seafoods. All rights reserved.
          </p>
          <p className="text-slate-400 text-xs flex items-center gap-1 font-medium">
             Freshly sourced from the coastline of Andhra Pradesh
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon }) {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300 shadow-sm">
      {icon}
    </a>
  );
}