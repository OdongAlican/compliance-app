import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...props }) {
  return <div className={cn('ui-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('ui-card-header', className)} {...props} />;
}

export function CardBody({ className, ...props }) {
  return <div className={cn('ui-card-body', className)} {...props} />;
}
