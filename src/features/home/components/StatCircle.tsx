import { motion } from 'motion/react';

interface StatCircleProps {
  value: string;
  label: string;
  description: string;
}

const StatCircle = ({ value, label, description }: StatCircleProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-20">
      {/* Big Circle */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-[#fccb4e] flex items-center justify-center border border-black z-10"
      >
        <span className="text-[80px] md:text-[180px] font-bold tracking-tighter text-black font-sans">
          {value}
        </span>
      </motion.div>

      {/* Floating Note Box Right */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 md:mt-0 md:absolute md:right-10 md:top-20 max-w-xs bg-white border border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20"
      >
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-xl font-bold leading-tight">{label}</h4>
          <div className="w-2 h-2 rounded-full bg-black md:hidden" />
        </div>
        <p className="font-serif text-sm leading-relaxed text-gray-800">
          {description}
        </p>
      </motion.div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <svg className="w-full h-full">
           <circle cx="50%" cy="50%" r="35%" fill="none" stroke="black" strokeWidth="1" strokeDasharray="4 4" />
           <line x1="0" y1="50%" x2="100%" y2="50%" stroke="black" strokeWidth="1" strokeOpacity="0.1" />
           <line x1="50%" y1="0" x2="50%" y2="100%" stroke="black" strokeWidth="1" strokeOpacity="0.1" />
        </svg>
      </div>
    </div>
  );
};

export default StatCircle;
