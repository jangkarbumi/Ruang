import { ViewTransition } from 'react';
import './transitions.css';

/**
 * Template dipasang ulang setiap pindah halaman, jadi halaman lama "keluar" dan halaman baru "masuk".
 * Navigasi di App Router adalah transition, sehingga <ViewTransition> otomatis menganimasikannya.
 * Browser tanpa dukungan View Transitions tetap berjalan normal, hanya tanpa animasi.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
