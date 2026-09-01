import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'm' | 'l';
}

export function Button({ variant = 'secondary', size = 'm', className, ...rest }: ButtonProps) {
  const cls = [styles['button'], styles[variant], size === 'l' ? styles['large'] : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return <button className={cls} {...rest} />;
}
