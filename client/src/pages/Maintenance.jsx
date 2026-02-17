import SeaCreature from "../components/SeaCreature";
import Bubbles from "../components/Bubbles";

const Maintenance = ({ message }) => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f4f7fa] dark:bg-[#0a1625] flex items-center justify-center font-sans text-slate-900 dark:text-white transition-colors duration-500">
            {/* Subtle wave bg at bottom */}
            <div className="absolute bottom-0 left-0 w-full pointer-events-none">
                <svg viewBox="0 0 1440 200" className="w-full animate-wave opacity-60" preserveAspectRatio="none">
                    <path
                        d="M0,120 C360,180 720,80 1080,140 C1260,170 1380,100 1440,120 L1440,200 L0,200 Z"
                        fill="hsl(195 50% 92% / 0.4)"
                        className="dark:fill-blue-900/30"
                    />
                </svg>
                <svg viewBox="0 0 1440 200" className="w-full absolute bottom-0 animate-wave opacity-40" style={{ animationDelay: "1s" }} preserveAspectRatio="none">
                    <path
                        d="M0,140 C240,100 480,180 720,130 C960,80 1200,160 1440,130 L1440,200 L0,200 Z"
                        fill="hsl(195 50% 92% / 0.25)"
                        className="dark:fill-blue-800/20"
                    />
                </svg>
            </div>

            {/* Bubbles */}
            <Bubbles />

            {/* Sea creatures */}
            <SeaCreature type="fish1" delay={0} top="20%" duration={18} size={52} />
            <SeaCreature type="fish2" delay={3} top="45%" duration={22} size={38} />
            <SeaCreature type="fish3" delay={1} top="65%" duration={16} size={32} />
            <SeaCreature type="fish1" delay={5} top="35%" duration={25} size={28} />
            <SeaCreature type="fish2" delay={7} top="75%" duration={20} size={44} />
            <SeaCreature type="fish3" delay={2} top="15%" duration={28} size={24} />
            <SeaCreature type="crab" delay={4} top="85%" duration={30} size={48} />
            <SeaCreature type="crab" delay={10} top="88%" duration={35} size={36} />

            {/* Main content */}
            <div className="relative z-10 text-center px-6 animate-gentle-float">
                <div className="mb-6">
                    <span className="text-6xl filter drop-shadow-md">🦐</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-sm">
                    SeaBite
                </h1>
                <div className="w-16 h-0.5 bg-blue-500 mx-auto mb-6 rounded-full" />
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-300 font-light mb-2">
                    We're freshening things up
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                    {message || "Our site is currently under maintenance. We'll be back with the freshest catch soon."}
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-300 shadow-sm backdrop-blur-sm bg-opacity-80">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Back shortly
                </div>

                {/* Helper for admin refresh check */}
                <div className="mt-8">
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest font-bold"
                    >
                        Refresh Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
