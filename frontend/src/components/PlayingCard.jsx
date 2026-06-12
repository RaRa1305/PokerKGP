import { motion } from 'framer-motion';

export default function PlayingCard({ cardString, hidden = false, index = 0 }) {
  const fileName = hidden ? 'back' : cardString;
  const imagePath = `/cards/${fileName}.png`;

  return (
    <motion.div
      initial={{ y: -500, x: 300, opacity: 0, rotateY: 180, rotateZ: 45, scale: 1.5 }}
      animate={{ y: 0, x: 0, opacity: 1, rotateY: hidden ? 180 : 0, rotateZ: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 150, damping: 15 }}
      style={{ width: '80px', height: '112px', perspective: '1000px', flexShrink: 0 }}
    >
      <img 
        src={imagePath} 
        alt={hidden ? "Card Back" : cardString} 
        onError={(e) => { e.target.src = 'https://via.placeholder.com/80x112?text=Error'; }} 
        style={{ width: '100%', height: '100%', borderRadius: '6px', boxShadow: '4px 6px 12px rgba(0,0,0,0.6)', objectFit: 'cover' }} 
      />
    </motion.div>
  );
}