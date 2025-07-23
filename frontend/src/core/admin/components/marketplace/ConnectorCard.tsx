import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  Rating,
  IconButton,
} from '@mui/material';
import { Settings, GetApp, CheckCircle } from '@mui/icons-material';

export interface MarketplaceCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  downloads: number;
  verified: boolean;
  icon: string;
  installed: boolean;
  onInstall: (id: string) => void;
  onConfigure: (id: string) => void;
  onOpenDetails: (id: string) => void;
}

const ConnectorCard: React.FC<MarketplaceCardProps> = ({
  id,
  name,
  description,
  category,
  rating,
  downloads,
  verified,
  icon,
  installed,
  onInstall,
  onConfigure,
  onOpenDetails,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
      onClick={() => onOpenDetails(id)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar src={icon} sx={{ width: 36, height: 36, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {name}
          </Typography>
          {verified && (
            <CheckCircle fontSize="small" color="success" />
          )}
        </Box>
        <Typography
          variant="body2"
          sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {description}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={category} />
          <Rating value={rating} size="small" precision={0.1} readOnly />
          <Chip size="small" label={`${downloads.toLocaleString()} downloads`} />
        </Box>
      </CardContent>
      <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {installed ? (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onConfigure(id); }}>
            <Settings fontSize="small" />
          </IconButton>
        ) : (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onInstall(id); }}>
            <GetApp fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default ConnectorCard;
