import type { FC } from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const SearchIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={`ql-icon-search ${className}`}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'>
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.35-4.35' />
  </svg>
);

export const XIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={`ql-icon-x ${className}`}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={{ display: 'block' }}>
    <line x1='18' y1='6' x2='6' y2='18'></line>
    <line x1='6' y1='6' x2='18' y2='18'></line>
  </svg>
);

export const LoaderIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={`ql-icon-loader ${className}`}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'>
    <path d='M21 12a9 9 0 11-6.219-8.56' />
  </svg>
);

export const ChevronDownIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={`ql-icon-chevron-down ${className}`}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'>
    <path d='m6 9 6 6 6-6' />
  </svg>
);

export const CheckIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={`ql-icon-check ${className}`}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'>
    <path d='M20 6 9 17l-5-5' />
  </svg>
);
