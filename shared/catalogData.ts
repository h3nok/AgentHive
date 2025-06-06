import React from 'react';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';

export const catalogData = [
  {
    id: 'tsc-ecom',
    name: 'TSC AI (Customer)',
    description: 'Public Q&A + Order Status',
    icon: <ShoppingCartCheckoutIcon />, 
    color: '#d32f2f',
    avatarBg: 'white',
    blurb: 'Answers product questions on tractorsupply.com',
    healthEndpoint: '/api/agents/tsc-ecom/health',
    launchUrl: '/playground/ecom-widget'
  }
];
