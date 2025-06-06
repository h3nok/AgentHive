import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';

interface ServiceIconProps extends BoxProps {
  src: string;
  alt: string;
  delay?: number;
}

export const ServiceIcon = ({ src, alt, delay = 0, ...props }: ServiceIconProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.05 }}
  >
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        height: 40,
        width: 'auto',
        objectFit: 'contain',
        ...props.sx
      }}
      {...props}
    />
  </motion.div>
);
