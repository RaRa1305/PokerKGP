import { motion } from 'framer-motion';

export default function PlayingCard({ cardString, hidden = false, index = 0 }) {
  const fileName = hidden ? 'back' : cardString;
  const imagePath = `/cards/${fileName}.png`;

  return (
    <motion.div
      // 1. The Deal Origin: Start way off-screen (top-right), flipped, spinning, and larger!
      initial={{ 
        y: -500,        // Start 500px higher
        x: 300,         // Start 300px to the right (simulating the dealer's position)
        opacity: 0, 
        rotateY: 180,   // Face down
        rotateZ: 45,    // Tilted sideways for a throwing spin
        scale: 1.5      // Looks closer to the camera when it starts
      }}
      // 2. The Destination: Snap cleanly to the board
      animate={{ 
        y: 0, 
        x: 0, 
        opacity: 1, 
        rotateY: hidden ? 180 : 0, 
        rotateZ: 0,     // Straighten out
        scale: 1        // Shrink to normal size
      }}
      // 3. The Physics: A snappier spring so it "smacks" onto the felt
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15, // Keep the stagger so they deal one by one
        type: "spring", 
        stiffness: 150, 
        damping: 15 
      }}
      style={{ 
        width: '80px', 
        height: '112px',
        perspective: '1000px',
        flexShrink: 0
      }}
    >
      <img 
        src={imagePath} 
        alt={hidden ? "Card Back" : cardString} 
        onError={(e) => { e.target.src = 'https://via.placeholder.com/80x112?text=Error'; }} 
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '6px',
          boxShadow: '4px 6px 12px rgba(0,0,0,0.6)', 
          objectFit: 'cover'
        }} 
      />
    </motion.div>
  );
}